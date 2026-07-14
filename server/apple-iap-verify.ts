const DEFAULT_APPLE_PRODUCT_ID = 'replock_pro_monthly'
const DEFAULT_YEARLY_PRODUCT_ID = 'replock_pro_yearly'

export function allowedAppleProductIds(): string[] {
  const configured = process.env.VITE_APPLE_PRODUCT_ID || DEFAULT_APPLE_PRODUCT_ID
  const yearly = process.env.VITE_APPLE_PRODUCT_ID_YEARLY || DEFAULT_YEARLY_PRODUCT_ID
  return [...new Set([configured, yearly, DEFAULT_APPLE_PRODUCT_ID, DEFAULT_YEARLY_PRODUCT_ID])]
}

export function isValidAppleProductId(productId: string): boolean {
  return allowedAppleProductIds().includes(productId)
}

export function isDemoMode(stripeConfigured: boolean): boolean {
  return process.env.NODE_ENV !== 'production' && !stripeConfigured
}

/**
 * Returns true when purchase verification succeeds.
 * Production always fails closed until App Store Server API is integrated.
 * Dev may skip via APPLE_IAP_VERIFY_SKIP or demo mode (no Stripe key).
 */
export function verifyAppleTransaction(
  transactionId: string,
  productId: string,
  stripeConfigured: boolean
): boolean {
  if (!transactionId.trim() || !productId.trim()) return false
  if (!isValidAppleProductId(productId)) return false

  if (process.env.NODE_ENV === 'production') {
    return false
  }

  return process.env.APPLE_IAP_VERIFY_SKIP === 'true' || isDemoMode(stripeConfigured)
}
