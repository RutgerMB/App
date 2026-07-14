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

/** RepLock launches on App Store + Play Store only; web is dev/testing. */
export function isMobileLaunchTarget(): boolean {
  return Capacitor.isNativePlatform()
}

export function usesStoreSubscriptions(): boolean {
  return isMobileLaunchTarget()
}

export async function initMobilePurchases(appUserId?: string): Promise<void> {
  if (!isMobileLaunchTarget()) return
  if (isRevenueCatConfigured()) {
    await initRevenueCat(appUserId)
    if (appUserId) await identifyRevenueCatUser(appUserId)
  }
}

export async function purchaseProSubscription(period: BillingPeriod): Promise<void> {
  if (!isMobileLaunchTarget()) {
    throw new Error('Subscriptions are only available in the RepLock mobile app.')
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

  if (isRevenueCatConfigured()) {
    return restoreRevenueCatPurchases()
  }

  if (Capacitor.getPlatform() === 'ios') {
    const restored = await restoreApplePurchases()
    return restored !== null
  }

  return false
}
