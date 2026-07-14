/** Legacy Android Stripe checkout — removed for mobile-only launch (RevenueCat / App Store). */

export function isStripeConfigured(): boolean {
  return false
}

export async function initStripe(): Promise<void> {}

export interface NativeSubscriptionResult {
  customerId: string
  subscriptionId: string
}

export async function presentNativeProCheckout(): Promise<NativeSubscriptionResult> {
  throw new Error('Stripe checkout is not available in the mobile app.')
}

export function shouldUseNativeStripeCheckout(): boolean {
  return false
}
