import type { AppState } from '../src/types/index.js'

export interface ProEntitlement {
  isPro: boolean
  stripeCustomerId: string | null
  subscriptionId: string | null
  subscriptionStatus: 'active' | 'canceled' | 'past_due' | null
  source?: 'stripe' | 'apple' | 'demo' | 'review'
}

export function entitlementFromAppState(appState: AppState): ProEntitlement {
  return {
    isPro: appState.profile.isPro,
    stripeCustomerId: appState.profile.stripeCustomerId,
    subscriptionId: appState.profile.subscriptionId,
    subscriptionStatus: appState.profile.subscriptionStatus,
  }
}

export function mergeEntitlementIntoAppState(
  appState: AppState,
  entitlement: ProEntitlement
): AppState {
  return {
    ...appState,
    profile: {
      ...appState.profile,
      isPro: entitlement.isPro,
      stripeCustomerId: entitlement.stripeCustomerId,
      subscriptionId: entitlement.subscriptionId,
      subscriptionStatus: entitlement.subscriptionStatus,
    },
  }
}

/** Strip client-supplied pro fields; always preserve server entitlement. */
export function sanitizeAppStateForSync(
  existing: AppState,
  incoming: AppState,
  entitlement?: ProEntitlement | null
): AppState {
  const serverEntitlement = entitlement ?? entitlementFromAppState(existing)
  return {
    ...incoming,
    profile: {
      ...incoming.profile,
      isPro: serverEntitlement.isPro,
      stripeCustomerId: serverEntitlement.stripeCustomerId,
      subscriptionId: serverEntitlement.subscriptionId,
      subscriptionStatus: serverEntitlement.subscriptionStatus,
    },
  }
}
