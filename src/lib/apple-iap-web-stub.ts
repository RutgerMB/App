import type { NativePurchasesPlugin } from './apple-iap-types'

const stub: NativePurchasesPlugin = {
  getProduct: async () => ({ product: null }),
  purchaseProduct: async () => {
    throw new Error('Apple In-App Purchase is only available in the native iOS app')
  },
  restorePurchases: async () => {},
  manageSubscriptions: async () => {
    throw new Error('Subscription management is only available in the native iOS app')
  },
  getPurchases: async () => ({ purchases: [] }),
}

export default stub
