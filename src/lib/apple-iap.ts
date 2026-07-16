import { Capacitor, registerPlugin } from '@capacitor/core'
import { apiFetch } from '@/lib/api'
import { getBearerHeaders } from '@/lib/auth-headers'
import { useStore } from '@/store'
import { PURCHASE_TYPE, type NativePurchasesPlugin } from './apple-iap-types'

const NativePurchases = registerPlugin<NativePurchasesPlugin>('NativePurchases', {
  web: () => import('./apple-iap-web-stub').then((m) => m.default),
})

const PRODUCT_ID_MONTHLY = import.meta.env.VITE_APPLE_PRODUCT_ID || 'replock_pro_monthly'
const PRODUCT_ID_YEARLY =
  import.meta.env.VITE_APPLE_PRODUCT_ID_YEARLY || 'replock_pro_yearly'

export function isAppleIAPConfigured(): boolean {
  return Capacitor.getPlatform() === 'ios' && Boolean(PRODUCT_ID_MONTHLY)
}

export interface ApplePurchaseResult {
  customerId: string
  subscriptionId: string
  /** False when StoreKit succeeded but backend verify failed (auth/network). */
  serverVerified: boolean
}

function grantLocalApplePro(transactionId: string): ApplePurchaseResult {
  useStore.getState().setProStatus(true, 'apple', transactionId, 'active')
  return {
    customerId: 'apple',
    subscriptionId: transactionId,
    serverVerified: false,
  }
}

async function purchaseProduct(productId: string): Promise<ApplePurchaseResult> {
  if (Capacitor.getPlatform() !== 'ios') {
    throw new Error('Apple In-App Purchase is only available on iOS')
  }

  const { product } = await NativePurchases.getProduct({
    productIdentifier: productId,
    productType: PURCHASE_TYPE.SUBS,
  })
  if (!product?.identifier) {
    throw new Error(
      `Product "${productId}" not found. Create it in App Store Connect and use a StoreKit config file while testing.`
    )
  }

  const result = await NativePurchases.purchaseProduct({
    productIdentifier: productId,
    productType: PURCHASE_TYPE.SUBS,
    quantity: 1,
  })

  const transactionId = result.transactionId

  try {
    const verifyRes = await apiFetch('/api/subscription/apple/verify', {
      method: 'POST',
      headers: await getBearerHeaders({ 'Content-Type': 'application/json' }),
      body: JSON.stringify({
        transactionId,
        productId,
      }),
    })

    const data = (await verifyRes.json().catch(() => ({}))) as { error?: string }

    if (verifyRes.ok) {
      useStore.getState().setProStatus(
        true,
        data && typeof data === 'object' && 'customerId' in data
          ? String((data as { customerId?: string }).customerId ?? 'apple')
          : 'apple',
        (data as { subscriptionId?: string }).subscriptionId ?? transactionId,
        'active'
      )
      return {
        customerId: (data as { customerId?: string }).customerId ?? 'apple',
        subscriptionId: (data as { subscriptionId?: string }).subscriptionId ?? transactionId,
        serverVerified: true,
      }
    }

    // StoreKit already charged — unlock locally instead of showing a raw auth error.
    console.warn('Apple verify failed after purchase; granting local Pro', data.error)
    return grantLocalApplePro(transactionId)
  } catch (err) {
    console.warn('Apple verify unreachable after purchase; granting local Pro', err)
    return grantLocalApplePro(transactionId)
  }
}

export async function purchaseAppleProSubscription(): Promise<ApplePurchaseResult> {
  return purchaseProduct(PRODUCT_ID_MONTHLY)
}

export async function purchaseAppleProSubscriptionYearly(): Promise<ApplePurchaseResult> {
  return purchaseProduct(PRODUCT_ID_YEARLY)
}

export async function restoreApplePurchases(): Promise<ApplePurchaseResult | null> {
  if (Capacitor.getPlatform() !== 'ios') return null

  try {
    await NativePurchases.restorePurchases()
    const { purchases } = await NativePurchases.getPurchases()
    const activePurchase = purchases.find(
      (p) =>
        (p.productIdentifier === PRODUCT_ID_MONTHLY ||
          p.productIdentifier === PRODUCT_ID_YEARLY) &&
        p.isActive !== false
    )
    if (!activePurchase) return null

    const transactionId =
      'transactionId' in activePurchase && typeof activePurchase.transactionId === 'string'
        ? activePurchase.transactionId
        : `restore_${activePurchase.productIdentifier}_${Date.now()}`

    try {
      const verifyRes = await apiFetch('/api/subscription/apple/verify', {
        method: 'POST',
        headers: await getBearerHeaders({ 'Content-Type': 'application/json' }),
        body: JSON.stringify({
          transactionId,
          productId: activePurchase.productIdentifier,
        }),
      })

      const data = (await verifyRes.json().catch(() => ({}))) as {
        error?: string
        customerId?: string
        subscriptionId?: string
      }

      if (verifyRes.ok) {
        useStore.getState().setProStatus(
          true,
          data.customerId ?? 'apple',
          data.subscriptionId ?? transactionId,
          'active'
        )
        return {
          customerId: data.customerId ?? 'apple',
          subscriptionId: data.subscriptionId ?? transactionId,
          serverVerified: true,
        }
      }
    } catch {
      // fall through to local grant
    }

    return grantLocalApplePro(transactionId)
  } catch {
    return null
  }
}
