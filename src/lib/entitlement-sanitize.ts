import type { AppState } from '@/types'

/** Remove pro entitlement fields before client → server sync (defense in depth). */
export function stripProFieldsFromSnapshot(appState: AppState): AppState {
  return {
    ...appState,
    profile: {
      ...appState.profile,
      isPro: false,
      stripeCustomerId: null,
      subscriptionId: null,
      subscriptionStatus: null,
    },
  }
}
