import { Capacitor, registerPlugin } from '@capacitor/core'
import type { PluginListenerHandle } from '@capacitor/core'

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
  purchase(options: {
    period: 'monthly' | 'yearly'
  }): Promise<RepLockRevenueCatCustomerInfo & { cancelled?: boolean }>
  restorePurchases(): Promise<RepLockRevenueCatCustomerInfo>
  presentPaywall(): Promise<{ presented: boolean; isPro?: boolean }>
  presentCustomerCenter(): Promise<{ presented: boolean }>
  addListener(
    eventName: 'customerInfoUpdated',
    listenerFunc: (info: RepLockRevenueCatCustomerInfo) => void,
  ): Promise<PluginListenerHandle>
}

const RepLockRevenueCatNative = registerPlugin<RepLockRevenueCatPlugin>('RepLockRevenueCat')

export function isNativeRevenueCatPlatform(): boolean {
  return Capacitor.getPlatform() === 'ios'
}

/** Platform check only — prefer `isNativeRevenueCatPluginReady` before presenting UI. */
export function isNativeRevenueCatAvailable(): boolean {
  return isNativeRevenueCatPlatform()
}

export async function isNativeRevenueCatPluginReady(): Promise<boolean> {
  if (!isNativeRevenueCatPlatform()) return false
  try {
    await RepLockRevenueCatNative.hasProEntitlement()
    return true
  } catch {
    return false
  }
}

/** Present the native RevenueCat Paywall (server-driven SwiftUI). Resolves when dismissed. */
export async function presentNativePaywall(): Promise<{ presented: boolean; isPro: boolean }> {
  if (!isNativeRevenueCatPlatform()) return { presented: false, isPro: false }
  try {
    const result = await RepLockRevenueCatNative.presentPaywall()
    return {
      presented: Boolean(result?.presented),
      isPro: Boolean(result?.isPro),
    }
  } catch (error) {
    throw error instanceof Error ? error : new Error('Failed to present paywall')
  }
}

/** Present RevenueCat Customer Center for subscription management. */
export async function presentNativeCustomerCenter(): Promise<{ presented: boolean }> {
  if (!isNativeRevenueCatPlatform()) return { presented: false }
  try {
    const result = await RepLockRevenueCatNative.presentCustomerCenter()
    return { presented: Boolean(result?.presented) }
  } catch (error) {
    throw error instanceof Error ? error : new Error('Failed to present customer center')
  }
}

/**
 * Open native paywall when the plugin is ready; otherwise call `fallback` (e.g. navigate to /pricing).
 * Returns true when the native sheet was presented. Syncs Pro after dismiss when entitled.
 */
export async function openUpgradeOrFallback(fallback: () => void): Promise<boolean> {
  if (!isNativeRevenueCatPlatform()) {
    fallback()
    return false
  }
  const ready = await isNativeRevenueCatPluginReady()
  if (!ready) {
    fallback()
    return false
  }
  try {
    const { presented, isPro } = await presentNativePaywall()
    if (!presented) {
      fallback()
      return false
    }
    if (isPro) {
      const { syncEntitlementAfterPurchase } = await import('@/lib/entitlement')
      await syncEntitlementAfterPurchase().catch(() => {})
    }
    return true
  } catch {
    fallback()
    return false
  }
}

export async function getNativeCustomerInfo(): Promise<RepLockRevenueCatCustomerInfo | null> {
  if (!isNativeRevenueCatPlatform()) return null
  try {
    return await RepLockRevenueCatNative.getCustomerInfo()
  } catch {
    return null
  }
}

export async function hasNativeProEntitlement(): Promise<boolean> {
  if (!isNativeRevenueCatPlatform()) return false
  try {
    const { isPro } = await RepLockRevenueCatNative.hasProEntitlement()
    return isPro
  } catch {
    return false
  }
}

export async function identifyNativeRevenueCatUser(appUserID: string): Promise<void> {
  if (!isNativeRevenueCatPlatform()) return
  await RepLockRevenueCatNative.logIn({ appUserID })
}

export async function subscribeNativeCustomerInfoUpdates(
  onUpdate: (info: RepLockRevenueCatCustomerInfo) => void,
): Promise<PluginListenerHandle | null> {
  if (!isNativeRevenueCatPlatform()) return null
  try {
    return await RepLockRevenueCatNative.addListener('customerInfoUpdated', onUpdate)
  } catch {
    return null
  }
}

export { RepLockRevenueCatNative }
