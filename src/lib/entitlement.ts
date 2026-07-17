import { apiFetch } from '@/lib/api'
import { getBearerHeaders } from '@/lib/auth-headers'
import { hasRevenueCatProEntitlement, isRevenueCatConfigured } from '@/lib/revenuecat'
import { hasNativeProEntitlement, isNativeRevenueCatAvailable } from '@/lib/replock-revenuecat-native'
import { useStore } from '@/store'

export interface ServerEntitlement {
  isPro: boolean
  stripeCustomerId: string | null
  subscriptionId: string | null
  subscriptionStatus: 'active' | 'canceled' | 'past_due' | null
  source: string | null
}

export interface EntitlementSyncResult {
  isPro: boolean
  /** False when the backend was unreachable or returned no entitlement. */
  serverSynced: boolean
  source: 'server' | 'revenuecat' | 'none'
  /** Present when server auth failed (caller may show a soft message). */
  authError?: string
}

/**
 * Pro entitlement security model:
 * - Server `/api/subscription/status` and webhooks (Stripe / RevenueCat) are authoritative.
 * - Client `profile.isPro` is synced from the server on login and app launch; never trusted from local storage alone.
 * - RevenueCat SDK on native validates store receipts on launch when configured (fills webhook lag).
 * - Client → server sync strips isPro fields (see entitlement-sanitize.ts).
 * - After IAP: grant Pro from RevenueCat even if backend sync fails (webhook / next sync will catch up).
 */

async function refreshAuthToken(): Promise<void> {
  const { useAuthStore } = await import('@/store/auth')
  await useAuthStore.getState().refreshToken().catch(() => {})
}

async function fetchServerEntitlementOnce(refresh: boolean): Promise<{
  entitlement: ServerEntitlement | null
  authError?: string
}> {
  const headers = await getBearerHeaders()
  if (!headers.Authorization) return { entitlement: null }

  const url = refresh ? '/api/subscription/status?refresh=1' : '/api/subscription/status'
  const res = await apiFetch(url, { headers })
  if (res.ok) {
    return { entitlement: (await res.json()) as ServerEntitlement }
  }

  if (res.status === 401) {
    const body = (await res.json().catch(() => ({}))) as { error?: string; code?: string }
    return {
      entitlement: null,
      authError: body.error ?? 'Session expired — sign in again to sync Pro to your account.',
    }
  }

  return { entitlement: null }
}

export async function fetchServerEntitlement(refresh = false): Promise<ServerEntitlement | null> {
  // Retry once with a forced token refresh (covers paywall / background expiry).
  let result = await fetchServerEntitlementOnce(refresh)
  if (!result.entitlement && result.authError) {
    await refreshAuthToken()
    result = await fetchServerEntitlementOnce(refresh)
  }
  return result.entitlement
}

/** Apply server entitlement to local store (server wins over client). */
export function applyServerEntitlement(entitlement: ServerEntitlement): void {
  const { setProStatus } = useStore.getState()
  setProStatus(
    entitlement.isPro,
    entitlement.stripeCustomerId ?? undefined,
    entitlement.subscriptionId ?? undefined,
    entitlement.subscriptionStatus ?? (entitlement.isPro ? 'active' : undefined)
  )
}

async function readStoreProEntitlement(): Promise<boolean> {
  // Prefer native plugin first on iOS — it shares the SDK with the SwiftUI paywall.
  if (isNativeRevenueCatAvailable()) {
    try {
      if (await hasNativeProEntitlement()) return true
    } catch {
      // fall through
    }
  }
  if (isRevenueCatConfigured()) {
    try {
      if (await hasRevenueCatProEntitlement()) return true
    } catch {
      return false
    }
  }
  return false
}

export async function refreshEntitlementFromServer(refreshStripe = false): Promise<boolean> {
  const entitlement = await fetchServerEntitlement(refreshStripe)
  if (!entitlement) return false
  applyServerEntitlement(entitlement)
  return entitlement.isPro
}

/**
 * Prefer server Pro; if server unreachable or free, grant from RevenueCat store entitlement.
 * Never throws on network failure — callers can still unlock Pro after a successful IAP.
 */
export async function syncEntitlementPreferringStore(options?: {
  refreshStripe?: boolean
}): Promise<EntitlementSyncResult> {
  const refreshStripe = options?.refreshStripe ?? false
  const rcPro = await readStoreProEntitlement()

  let serverEntitlement: ServerEntitlement | null = null
  let serverSynced = false
  let authError: string | undefined
  try {
    // Force-refresh auth before post-purchase sync (native paywall can outlive token TTL).
    await refreshAuthToken()
    let once = await fetchServerEntitlementOnce(refreshStripe)
    if (!once.entitlement && once.authError) {
      await refreshAuthToken()
      once = await fetchServerEntitlementOnce(refreshStripe)
    }
    serverEntitlement = once.entitlement
    serverSynced = once.entitlement !== null
    authError = once.authError
  } catch {
    serverSynced = false
  }

  if (serverEntitlement?.isPro) {
    applyServerEntitlement(serverEntitlement)
    return { isPro: true, serverSynced: true, source: 'server' }
  }

  if (rcPro) {
    applyServerEntitlement({
      isPro: true,
      stripeCustomerId: serverEntitlement?.stripeCustomerId ?? null,
      subscriptionId: serverEntitlement?.subscriptionId ?? null,
      subscriptionStatus: 'active',
      source: 'revenuecat',
    })
    return { isPro: true, serverSynced, source: 'revenuecat', authError }
  }

  // Server authoritatively free + no store entitlement → clear local Pro (no localStorage bypass).
  if (serverEntitlement) {
    applyServerEntitlement(serverEntitlement)
    return { isPro: false, serverSynced: true, source: 'server' }
  }

  // Offline / unreachable API only: keep a fresh local grant (post-IAP before webhook).
  if (useStore.getState().profile.isPro) {
    return { isPro: true, serverSynced: false, source: 'revenuecat', authError }
  }

  return { isPro: false, serverSynced, source: 'none', authError }
}

/** Sync server + RevenueCat SDK entitlement on app launch (after purchases SDK init). */
export async function syncEntitlementOnLaunch(): Promise<boolean> {
  const result = await syncEntitlementPreferringStore({ refreshStripe: false })
  return result.isPro
}

/** After purchase / restore / native paywall — refresh Stripe when possible, always prefer store Pro. */
export async function syncEntitlementAfterPurchase(): Promise<EntitlementSyncResult> {
  return syncEntitlementPreferringStore({ refreshStripe: true })
}
