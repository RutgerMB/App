import type { NativePurchasesPlugin } from './apple-iap-types'

/** Legacy stub kept for reference; iOS uses the native Capgo plugin with Xcode 26+. */
const stub: NativePurchasesPlugin = {
  getProduct: async () => ({ product: null }),
  purchaseProduct: async () => {
    throw new Error(
      'In-app purchases require the native StoreKit plugin. Run npm run cap:ios:sync and rebuild in Xcode 26+.'
    )
  },
  restorePurchases: async () => {},
  manageSubscriptions: async () => {
    throw new Error(
      'Subscription management requires the native StoreKit plugin. Rebuild with Xcode 26+.'
    )
  },
  getPurchases: async () => ({ purchases: [] }),
}

export default stub
