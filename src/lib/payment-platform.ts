import { Capacitor } from '@capacitor/core'

export type PaymentProvider = 'revenuecat' | 'apple-iap' | 'stripe-native' | 'stripe-web' | 'mobile-only'

/** Mobile stores only for launch — web is dev/testing, not a subscription surface. */
export function getPaymentProvider(): PaymentProvider {
  if (!Capacitor.isNativePlatform()) return 'mobile-only'
  if (import.meta.env.VITE_REVENUECAT_API_KEY_IOS && Capacitor.getPlatform() === 'ios') {
    return 'revenuecat'
  }
  if (import.meta.env.VITE_REVENUECAT_API_KEY_ANDROID && Capacitor.getPlatform() === 'android') {
    return 'revenuecat'
  }
  if (Capacitor.getPlatform() === 'ios') return 'apple-iap'
  return 'stripe-native'
}

export function requiresAppleIAP(): boolean {
  return getPaymentProvider() === 'apple-iap'
}

export function usesRevenueCat(): boolean {
  return getPaymentProvider() === 'revenuecat'
}

export function canSubscribeOnWeb(): boolean {
  return false
}

export function canUseStripe(): boolean {
  const provider = getPaymentProvider()
  return provider === 'stripe-native' || provider === 'stripe-web'
}
