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
  presentCustomerCenter(): Promise<{ presented: boolean; isPro?: boolean }>
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

/** Present RevenueCat Customer Center for subscription management. Resolves when dismissed. */
export async function presentNativeCustomerCenter(): Promise<{
  presented: boolean
  isPro: boolean
}> {
  if (!isNativeRevenueCatPlatform()) return { presented: false, isPro: false }
  try {
    const result = await RepLockRevenueCatNative.presentCustomerCenter()
    return {
      presented: Boolean(result?.presented),
      isPro: Boolean(result?.isPro),
    }
  } catch (error) {
    throw error instanceof Error ? error : new Error('Failed to present customer center')
  }
}

/** Open Apple’s subscription management (StoreKit sheet or App Store URL). */
export async function openAppleSubscriptionManagement(): Promise<boolean> {
  const { openAppleManageSubscriptions } = await import('@/lib/apple-iap')
  return openAppleManageSubscriptions()
}

export type ManageSubscriptionResult = {
  /** Customer Center or Apple manage UI was shown / opened. */
  opened: boolean
  /** Pro after any restore / refresh during the flow. */
  isPro: boolean
  /** Used restorePurchases when Customer Center was unavailable. */
  restored: boolean
}

/** Open Google Play subscription management for this package. */
export async function openPlaySubscriptionManagement(): Promise<boolean> {
  if (Capacitor.getPlatform() !== 'android') return false
  const pkg = 'com.replock.app'
  const urls = [
    `https://play.google.com/store/account/subscriptions?package=${pkg}`,
    `https://play.google.com/store/account/subscriptions`,
  ]
  try {
    const { AppLauncher } = await import('@capacitor/app-launcher')
    for (const url of urls) {
      try {
        await AppLauncher.openUrl({ url })
        return true
      } catch {
        /* try next */
      }
    }
  } catch {
    /* ignore */
  }
  return false
}

/**
 * Subscription management: iOS Customer Center / Apple manage sheet;
 * Android opens Play Store subscriptions.
 */
export async function openManageSubscription(options?: {
  /** When Customer Center fails, also attempt restore. Default true. */
  restoreIfNeeded?: boolean
}): Promise<ManageSubscriptionResult> {
  const restoreIfNeeded = options?.restoreIfNeeded !== false

  if (Capacitor.getPlatform() === 'android') {
    let restored = false
    let isPro = false
    if (restoreIfNeeded) {
      try {
        const { restoreMobilePurchases } = await import('@/lib/mobile-purchases')
        restored = await restoreMobilePurchases()
        if (restored) {
          const { syncEntitlementAfterPurchase } = await import('@/lib/entitlement')
          const sync = await syncEntitlementAfterPurchase().catch(() => null)
          isPro = Boolean(sync?.isPro || restored)
        }
      } catch {
        /* ignore */
      }
    }
    const opened = await openPlaySubscriptionManagement()
    return { opened, isPro, restored }
  }

  if (!isNativeRevenueCatPlatform()) {
    const opened = await openAppleSubscriptionManagement()
    return { opened, isPro: false, restored: false }
  }

  const ready = await isNativeRevenueCatPluginReady()
  if (ready) {
    try {
      const { presented, isPro } = await presentNativeCustomerCenter()
      if (presented) {
        const { syncEntitlementAfterPurchase } = await import('@/lib/entitlement')
        await syncEntitlementAfterPurchase().catch(() => {})
        return { opened: true, isPro, restored: false }
      }
    } catch {
      /* fall through */
    }
  }

  let restored = false
  let isPro = false
  if (restoreIfNeeded) {
    try {
      const { restoreMobilePurchases } = await import('@/lib/mobile-purchases')
      restored = await restoreMobilePurchases()
      if (restored) {
        const { syncEntitlementAfterPurchase } = await import('@/lib/entitlement')
        const sync = await syncEntitlementAfterPurchase().catch(() => null)
        isPro = Boolean(sync?.isPro || restored)
      }
    } catch {
      /* ignore */
    }
  }

  const opened = await openAppleSubscriptionManagement()
  return { opened, isPro, restored }
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
