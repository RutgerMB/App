export enum PURCHASE_TYPE {
  INAPP = 'inapp',
  SUBS = 'subs',
}

export interface NativePurchasesPlugin {
  getProduct(options: {
    productIdentifier: string
    productType?: PURCHASE_TYPE
  }): Promise<{ product: { identifier: string } | null }>

  purchaseProduct(options: {
    productIdentifier: string
    productType?: PURCHASE_TYPE
    quantity?: number
  }): Promise<{ transactionId: string }>

  restorePurchases(): Promise<void>

  /** Opens Apple’s subscription management sheet (iOS 15+). */
  manageSubscriptions(): Promise<void>

  getPurchases(options?: {
    productType?: PURCHASE_TYPE
  }): Promise<{
    purchases: Array<{ productIdentifier: string; isActive?: boolean; transactionId?: string }>
  }>
}
