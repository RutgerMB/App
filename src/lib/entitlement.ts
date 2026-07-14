import { apiFetch } from '@/lib/api'
import { getBearerHeaders } from '@/lib/auth-headers'
import { hasRevenueCatProEntitlement, isRevenueCatConfigured } from '@/lib/revenuecat'
import { useStore } from '@/store'

export interface ServerEntitlement {
  isPro: boolean
  stripeCustomerId: string | null
  subscriptionId: string | null
  subscriptionStatus: 'active' | 'canceled' | 'past_due' | null
  source: string | null
}

/**
 * Pro entitlement security model:
 * - Server `/api/subscription/status` and webhooks (Stripe / RevenueCat) are authoritative.
 * - Client `profile.isPro` is synced from the server on login and app launch; never trusted from local storage alone.
 * - RevenueCat SDK on native validates store receipts on launch when configured (fills webhook lag).
 * - Client → server sync strips isPro fields (see entitlement-sanitize.ts).
 */

export async function fetchServerEntitlement(refresh = false): Promise<ServerEntitlement | null> {
  const headers = await getBearerHeaders()
  if (!headers.Authorization) return null

  const url = refresh ? '/api/subscription/status?refresh=1' : '/api/subscription/status'
  const res = await apiFetch(url, { headers })
  if (!res.ok) return null
  return res.json() as Promise<ServerEntitlement>
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

export async function refreshEntitlementFromServer(refreshStripe = false): Promise<boolean> {
  const entitlement = await fetchServerEntitlement(refreshStripe)
  if (!entitlement) return false
  applyServerEntitlement(entitlement)
  return entitlement.isPro
}

/** Sync server + RevenueCat SDK entitlement on app launch (after purchases SDK init). */
export async function syncEntitlementOnLaunch(): Promise<boolean> {
  let rcPro = false
  if (isRevenueCatConfigured()) {
    try {
      rcPro = await hasRevenueCatProEntitlement()
    } catch {
      // SDK unavailable — rely on server only
    }
  }

  const serverEntitlement = await fetchServerEntitlement(false)

  if (serverEntitlement?.isPro) {
    applyServerEntitlement(serverEntitlement)
    return true
  }

  if (rcPro) {
    applyServerEntitlement({
      isPro: true,
      stripeCustomerId: serverEntitlement?.stripeCustomerId ?? null,
      subscriptionId: serverEntitlement?.subscriptionId ?? null,
      subscriptionStatus: 'active',
      source: 'revenuecat',
    })
    return true
  }

  if (serverEntitlement) {
    applyServerEntitlement(serverEntitlement)
  }

  return false
}
