export interface NativePurchasesPlugin {
  configure(options: { appUserID?: string }): Promise<void>
  getProduct(options: { productId: string }): Promise<{ product: { productId: string } | null }>
  purchaseProduct(options: { productId: string }): Promise<{ transactionId: string }>
  restorePurchases(): Promise<{ purchases: Array<{ productId: string }> }>
}
