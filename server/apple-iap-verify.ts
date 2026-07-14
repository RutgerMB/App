const DEFAULT_APPLE_PRODUCT_ID = 'replock_pro_monthly'

export function allowedAppleProductIds(): string[] {
  const configured = process.env.VITE_APPLE_PRODUCT_ID || DEFAULT_APPLE_PRODUCT_ID
  return [...new Set([configured, DEFAULT_APPLE_PRODUCT_ID])]
}

export function isValidAppleProductId(productId: string): boolean {
  return allowedAppleProductIds().includes(productId)
}

export function isDemoMode(stripeConfigured: boolean): boolean {
  return process.env.NODE_ENV !== 'production' && !stripeConfigured
}

/** Returns true when purchase verification is allowed without App Store Server API. */
export function verifyAppleTransaction(
  transactionId: string,
  productId: string,
  stripeConfigured: boolean
): boolean {
  if (!transactionId.trim() || !productId.trim()) return false
  if (!isValidAppleProductId(productId)) return false

  const isProduction = process.env.NODE_ENV === 'production'

  if (!isProduction) {
    return process.env.APPLE_IAP_VERIFY_SKIP === 'true' || isDemoMode(stripeConfigured)
  }

  // Production: only App Review bypass until App Store Server API is integrated.
  return process.env.APPLE_IAP_VERIFY_SKIP === 'true'
}
