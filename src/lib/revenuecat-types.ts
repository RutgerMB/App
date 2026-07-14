export type BillingPeriod = 'monthly' | 'yearly'

export const LOG_LEVEL = {
  DEBUG: 'DEBUG',
  WARN: 'WARN',
} as const

export type LogLevel = (typeof LOG_LEVEL)[keyof typeof LOG_LEVEL]

export interface PurchasesProduct {
  identifier: string
  price: number
  priceString: string
}

export interface PurchasesPackage {
  packageType?: string
  product: PurchasesProduct
}

export interface PurchasesOffering {
  monthly?: PurchasesPackage | null
  annual?: PurchasesPackage | null
  availablePackages: PurchasesPackage[]
}

export interface PurchasesOfferings {
  current: PurchasesOffering | null
}

export interface CustomerInfo {
  entitlements: {
    active: Record<string, unknown>
  }
}

export interface PurchasesPlugin {
  setLogLevel(options: { level: LogLevel }): Promise<void>
  configure(options: { apiKey: string; appUserID?: string }): Promise<void>
  logIn(options: { appUserID: string }): Promise<unknown>
  getOfferings(): Promise<PurchasesOfferings>
  purchasePackage(options: { aPackage: PurchasesPackage }): Promise<{ customerInfo: CustomerInfo }>
  restorePurchases(): Promise<{ customerInfo: CustomerInfo }>
  getCustomerInfo(): Promise<{ customerInfo: CustomerInfo }>
}
