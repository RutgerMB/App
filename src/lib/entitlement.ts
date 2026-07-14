import { apiFetch } from '@/lib/api'
import { getBearerHeaders } from '@/lib/auth-headers'
import { useStore } from '@/store'

export interface ServerEntitlement {
  isPro: boolean
  stripeCustomerId: string | null
  subscriptionId: string | null
  subscriptionStatus: 'active' | 'canceled' | 'past_due' | null
  source: string | null
}

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
