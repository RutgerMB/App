import type { NativePurchasesPlugin } from './apple-iap-types'

/** iOS native IAP is omitted on Xcode 15.4 builds (Capacitor 8 plugin APIs need Xcode 26). */
const stub: NativePurchasesPlugin = {
  getProduct: async () => ({ product: null }),
  purchaseProduct: async () => {
    throw new Error(
      'In-app purchases on iPhone require a build made with Xcode 26. App blocking still works on this dev build.'
    )
  },
  restorePurchases: async () => {},
  getPurchases: async () => ({ purchases: [] }),
}

export default stub
