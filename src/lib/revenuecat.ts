import { Capacitor, registerPlugin } from '@capacitor/core'
import {
  LOG_LEVEL,
  type BillingPeriod,
  type PurchasesPackage,
  type PurchasesPlugin,
} from '@/lib/revenuecat-types'
import {
  PRODUCT_ID_MONTHLY,
  PRODUCT_ID_YEARLY,
  REVENUECAT_ENTITLEMENT,
} from '@/types'
import { identifyNativeRevenueCatUser } from '@/lib/replock-revenuecat-native'

export type { BillingPeriod, PurchasesPackage } from '@/lib/revenuecat-types'

const Purchases = registerPlugin<PurchasesPlugin>('Purchases', {
  web: () => import('./revenuecat-web-stub').then((m) => m.default),
})

let configured = false

function getApiKey(): string | null {
  const platform = Capacitor.getPlatform()
  if (platform === 'ios') {
    return import.meta.env.VITE_REVENUECAT_API_KEY_IOS || null
  }
  if (platform === 'android') {
    return import.meta.env.VITE_REVENUECAT_API_KEY_ANDROID || null
  }
  return null
}

/** Test Store keys (test_…) do not drive App Store / sandbox StoreKit on a real iPhone. */
function warnIfTestStoreKeyOnIos(apiKey: string): void {
  if (Capacitor.getPlatform() !== 'ios' || !apiKey.startsWith('test_')) return
  const msg =
    '[RepLock] RevenueCat Test Store key (test_…) on iOS. ' +
    'Physical device / sandbox IAP needs the App Store public SDK key (appl_…). ' +
    'Set VITE_REVENUECAT_API_KEY_IOS=appl_… and re-run npm run cap:ios:sync. See IOS_SETUP.md.'
  console.error(msg)
}

export function isRevenueCatConfigured(): boolean {
  return Capacitor.isNativePlatform() && Boolean(getApiKey())
}

export async function initRevenueCat(appUserId?: string): Promise<void> {
  const apiKey = getApiKey()
  if (!apiKey || configured) return

  warnIfTestStoreKeyOnIos(apiKey)

  await Purchases.setLogLevel({
    level: import.meta.env.DEV ? LOG_LEVEL.DEBUG : LOG_LEVEL.WARN,
  })
  await Purchases.configure({
    apiKey,
    appUserID: appUserId,
  })
  configured = true
}

export async function identifyRevenueCatUser(appUserId: string): Promise<void> {
  if (!isRevenueCatConfigured()) return
  if (!configured) await initRevenueCat(appUserId)
  await Purchases.logIn({ appUserID: appUserId })
  if (Capacitor.getPlatform() === 'ios') {
    await identifyNativeRevenueCatUser(appUserId).catch(() => {})
  }
}

export async function getRevenueCatPackages(): Promise<{
  monthly: PurchasesPackage | null
  yearly: PurchasesPackage | null
}> {
  const offerings = await Purchases.getOfferings()
  const current = offerings.current
  if (!current) {
    return { monthly: null, yearly: null }
  }

  const monthly =
    current.monthly ??
    current.availablePackages.find(
      (pkg) =>
        pkg.packageType === 'MONTHLY' ||
        pkg.product.identifier === PRODUCT_ID_MONTHLY
    ) ??
    null

  const yearly =
    current.annual ??
    current.availablePackages.find(
      (pkg) =>
        pkg.packageType === 'ANNUAL' ||
        pkg.product.identifier === PRODUCT_ID_YEARLY
    ) ??
    null

  return { monthly, yearly }
}

export async function purchaseRevenueCatPackage(
  billingPeriod: BillingPeriod
): Promise<void> {
  const { monthly, yearly } = await getRevenueCatPackages()
  const selected = billingPeriod === 'yearly' ? yearly : monthly
  if (!selected) {
    throw new Error(
      billingPeriod === 'yearly'
        ? 'Annual plan is not available yet. Try monthly or check store setup.'
        : 'Monthly plan is not available yet. Check store setup.'
    )
  }

  const { customerInfo } = await Purchases.purchasePackage({ aPackage: selected })
  const isPro = customerInfo.entitlements.active[REVENUECAT_ENTITLEMENT] !== undefined
  if (!isPro) {
    throw new Error('Purchase completed but Pro access was not activated.')
  }
}

export async function restoreRevenueCatPurchases(): Promise<boolean> {
  const { customerInfo } = await Purchases.restorePurchases()
  return customerInfo.entitlements.active[REVENUECAT_ENTITLEMENT] !== undefined
}

export async function hasRevenueCatProEntitlement(): Promise<boolean> {
  const { customerInfo } = await Purchases.getCustomerInfo()
  return customerInfo.entitlements.active[REVENUECAT_ENTITLEMENT] !== undefined
}
