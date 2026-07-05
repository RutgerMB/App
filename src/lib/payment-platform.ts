import { Capacitor } from '@capacitor/core'

export type PaymentProvider = 'apple-iap' | 'stripe-native' | 'stripe-web'

/** iOS App Store: digital subscriptions must use Apple IAP. Android EU / web may use Stripe. */
export function getPaymentProvider(): PaymentProvider {
  if (!Capacitor.isNativePlatform()) return 'stripe-web'
  if (Capacitor.getPlatform() === 'ios') return 'apple-iap'
  return 'stripe-native'
}

export function requiresAppleIAP(): boolean {
  return getPaymentProvider() === 'apple-iap'
}

export function canUseStripe(): boolean {
  return getPaymentProvider() !== 'apple-iap'
}
