import type { PurchasesPlugin } from './revenuecat-types'

const emptyCustomerInfo = { entitlements: { active: {} } }

const stub: PurchasesPlugin = {
  setLogLevel: async () => {},
  configure: async () => {},
  logIn: async () => ({}),
  getOfferings: async () => ({ current: null }),
  purchasePackage: async () => {
    throw new Error('RevenueCat is only available in the native mobile app')
  },
  restorePurchases: async () => ({ customerInfo: emptyCustomerInfo }),
  getCustomerInfo: async () => ({ customerInfo: emptyCustomerInfo }),
}

export default stub
