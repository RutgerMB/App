import { Capacitor, registerPlugin } from '@capacitor/core'

export interface RepLockRevenueCatCustomerInfo {
  originalAppUserId: string
  isPro: boolean
  entitlementId: string
  activeEntitlements: string[]
  expirationDate: number | null
  willRenew: boolean
  productIdentifier: string | null
  restored?: boolean
}

export interface RepLockRevenueCatPlugin {
  configure(options?: { appUserID?: string }): Promise<{ configured: boolean }>
  logIn(options: { appUserID: string }): Promise<RepLockRevenueCatCustomerInfo>
  hasProEntitlement(): Promise<{ isPro: boolean; entitlementId: string }>
  getCustomerInfo(): Promise<RepLockRevenueCatCustomerInfo>
  purchase(options: { period: 'monthly' | 'yearly' }): Promise<RepLockRevenueCatCustomerInfo>
  restorePurchases(): Promise<RepLockRevenueCatCustomerInfo>
  presentPaywall(): Promise<{ presented: boolean }>
  presentCustomerCenter(): Promise<{ presented: boolean }>
}

const RepLockRevenueCatNative = registerPlugin<RepLockRevenueCatPlugin>('RepLockRevenueCat')

export function isNativeRevenueCatAvailable(): boolean {
  return Capacitor.getPlatform() === 'ios'
}

/** Present the native RevenueCat Paywall (server-driven SwiftUI). */
export async function presentNativePaywall(): Promise<void> {
  if (!isNativeRevenueCatAvailable()) return
  await RepLockRevenueCatNative.presentPaywall()
}

/** Present RevenueCat Customer Center for subscription management. */
export async function presentNativeCustomerCenter(): Promise<void> {
  if (!isNativeRevenueCatAvailable()) return
  await RepLockRevenueCatNative.presentCustomerCenter()
}

export async function getNativeCustomerInfo(): Promise<RepLockRevenueCatCustomerInfo | null> {
  if (!isNativeRevenueCatAvailable()) return null
  try {
    return await RepLockRevenueCatNative.getCustomerInfo()
  } catch {
    return null
  }
}

export async function hasNativeProEntitlement(): Promise<boolean> {
  if (!isNativeRevenueCatAvailable()) return false
  try {
    const { isPro } = await RepLockRevenueCatNative.hasProEntitlement()
    return isPro
  } catch {
    return false
  }
}

export async function identifyNativeRevenueCatUser(appUserID: string): Promise<void> {
  if (!isNativeRevenueCatAvailable()) return
  await RepLockRevenueCatNative.logIn({ appUserID })
}

export { RepLockRevenueCatNative }
