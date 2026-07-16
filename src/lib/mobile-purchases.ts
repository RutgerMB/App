import { Capacitor } from '@capacitor/core'
import type { BillingPeriod } from '@/lib/revenuecat'
import {
  identifyRevenueCatUser,
  initRevenueCat,
  isRevenueCatConfigured,
  purchaseRevenueCatPackage,
  restoreRevenueCatPurchases,
} from '@/lib/revenuecat'
import {
  purchaseAppleProSubscription,
  restoreApplePurchases,
  purchaseAppleProSubscriptionYearly,
} from '@/lib/apple-iap'
import {
  isNativeRevenueCatPluginReady,
  RepLockRevenueCatNative,
} from '@/lib/replock-revenuecat-native'

/** RepLock launches on App Store + Play Store only; web is dev/testing. */
export function isMobileLaunchTarget(): boolean {
  return Capacitor.isNativePlatform()
}

export function usesStoreSubscriptions(): boolean {
  return isMobileLaunchTarget()
}

async function stableAppUserId(): Promise<string | undefined> {
  const { useAuthStore } = await import('@/store/auth')
  return useAuthStore.getState().user?.id
}

export async function initMobilePurchases(appUserId?: string): Promise<void> {
  if (!isMobileLaunchTarget()) return
  const userId = appUserId ?? (await stableAppUserId())
  if (isRevenueCatConfigured()) {
    await initRevenueCat(userId)
    if (userId) await identifyRevenueCatUser(userId)
  } else if (userId && Capacitor.getPlatform() === 'ios') {
    // Native Swift SDK may already be configured — still bind the app user id.
    await RepLockRevenueCatNative.logIn({ appUserID: userId }).catch(() => {})
  }
}

export async function purchaseProSubscription(period: BillingPeriod): Promise<void> {
  if (!isMobileLaunchTarget()) {
    throw new Error('Subscriptions are only available in the RepLock mobile app.')
  }

  const userId = await stableAppUserId()
  if (userId) {
    await initMobilePurchases(userId).catch(() => {})
  }

  // Prefer native RevenueCat (same SDK as the SwiftUI paywall) when the plugin is ready.
  if (Capacitor.getPlatform() === 'ios') {
    const ready = await isNativeRevenueCatPluginReady()
    if (ready) {
      const info = await RepLockRevenueCatNative.purchase({ period })
      if (info && 'cancelled' in info && info.cancelled) {
        throw new Error('Purchase cancelled')
      }
      if (!info?.isPro) {
        throw new Error('Purchase completed but Pro access was not activated.')
      }
      return
    }
  }

  if (isRevenueCatConfigured()) {
    await purchaseRevenueCatPackage(period)
    return
  }

  if (Capacitor.getPlatform() === 'ios') {
    if (period === 'yearly') {
      await purchaseAppleProSubscriptionYearly()
    } else {
      await purchaseAppleProSubscription()
    }
    return
  }

  throw new Error('Store billing is not configured on this device.')
}

export async function restoreMobilePurchases(): Promise<boolean> {
  if (!isMobileLaunchTarget()) return false

  const userId = await stableAppUserId()
  if (userId) {
    await initMobilePurchases(userId).catch(() => {})
  }

  if (Capacitor.getPlatform() === 'ios') {
    const ready = await isNativeRevenueCatPluginReady()
    if (ready) {
      const info = await RepLockRevenueCatNative.restorePurchases()
      return Boolean(info?.isPro)
    }
  }

  if (isRevenueCatConfigured()) {
    return restoreRevenueCatPurchases()
  }

  if (Capacitor.getPlatform() === 'ios') {
    const restored = await restoreApplePurchases()
    return restored !== null
  }

  return false
}
