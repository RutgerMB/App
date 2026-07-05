import { Capacitor, registerPlugin } from '@capacitor/core'
import { apiFetch } from '@/lib/api'
import { getBearerHeaders } from '@/lib/auth-headers'
import { PURCHASE_TYPE, type NativePurchasesPlugin } from './apple-iap-types'

const NativePurchases = registerPlugin<NativePurchasesPlugin>('NativePurchases', {
  web: () => import('./apple-iap-web-stub').then((m) => m.default),
})

const PRODUCT_ID = import.meta.env.VITE_APPLE_PRODUCT_ID || 'replock_pro_monthly'

export function isAppleIAPConfigured(): boolean {
  return Capacitor.getPlatform() === 'ios' && Boolean(PRODUCT_ID)
}

export async function purchaseAppleProSubscription(): Promise<{
  customerId: string
  subscriptionId: string
}> {
  if (Capacitor.getPlatform() !== 'ios') {
    throw new Error('Apple In-App Purchase is only available on iOS')
  }

  const { product } = await NativePurchases.getProduct({
    productIdentifier: PRODUCT_ID,
    productType: PURCHASE_TYPE.SUBS,
  })
  if (!product?.identifier) {
    throw new Error(
      `Product "${PRODUCT_ID}" not found. Create it in App Store Connect and use a StoreKit config file while testing.`
    )
  }

  const result = await NativePurchases.purchaseProduct({
    productIdentifier: PRODUCT_ID,
    productType: PURCHASE_TYPE.SUBS,
    quantity: 1,
  })

  const verifyRes = await apiFetch('/api/subscription/apple/verify', {
    method: 'POST',
    headers: await getBearerHeaders({ 'Content-Type': 'application/json' }),
    body: JSON.stringify({
      transactionId: result.transactionId,
      productId: PRODUCT_ID,
    }),
  })

  const data = await verifyRes.json()
  if (!verifyRes.ok) {
    throw new Error(data.error ?? 'Could not verify Apple purchase')
  }

  return {
    customerId: data.customerId ?? 'apple',
    subscriptionId: data.subscriptionId ?? result.transactionId,
  }
}

export async function restoreApplePurchases(): Promise<boolean> {
  if (Capacitor.getPlatform() !== 'ios') return false

  try {
    await NativePurchases.restorePurchases()
    const { purchases } = await NativePurchases.getPurchases()
    return purchases.some((p) => p.productIdentifier === PRODUCT_ID && p.isActive !== false)
  } catch {
    return false
  }
}
