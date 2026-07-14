import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import {
  allowedAppleProductIds,
  isValidAppleProductId,
  verifyAppleTransaction,
} from '../apple-iap-verify.js'

describe('allowedAppleProductIds', () => {
  const original = process.env.VITE_APPLE_PRODUCT_ID

  afterEach(() => {
    if (original === undefined) delete process.env.VITE_APPLE_PRODUCT_ID
    else process.env.VITE_APPLE_PRODUCT_ID = original
  })

  it('includes configured product id and default', () => {
    process.env.VITE_APPLE_PRODUCT_ID = 'custom_monthly'
    expect(allowedAppleProductIds()).toEqual(['custom_monthly', 'replock_pro_monthly'])
  })

  it('defaults to replock_pro_monthly when unset', () => {
    delete process.env.VITE_APPLE_PRODUCT_ID
    expect(allowedAppleProductIds()).toEqual(['replock_pro_monthly'])
  })
})

describe('isValidAppleProductId', () => {
  it('accepts default and configured ids', () => {
    expect(isValidAppleProductId('replock_pro_monthly')).toBe(true)
  })

  it('rejects unknown product ids', () => {
    expect(isValidAppleProductId('other_product')).toBe(false)
  })
})

describe('verifyAppleTransaction', () => {
  const env = { ...process.env }

  beforeEach(() => {
    process.env = { ...env }
    delete process.env.APPLE_IAP_VERIFY_SKIP
    delete process.env.VITE_APPLE_PRODUCT_ID
  })

  afterEach(() => {
    process.env = env
  })

  it('rejects empty transaction or product id', () => {
    expect(verifyAppleTransaction('', 'replock_pro_monthly', false)).toBe(false)
    expect(verifyAppleTransaction('txn_1', '', false)).toBe(false)
  })

  it('rejects invalid product ids', () => {
    expect(verifyAppleTransaction('txn_1', 'bad_product', true)).toBe(false)
  })

  it('allows dev demo mode without skip flag', () => {
    process.env.NODE_ENV = 'development'
    expect(verifyAppleTransaction('txn_1', 'replock_pro_monthly', false)).toBe(true)
  })

  it('allows dev when APPLE_IAP_VERIFY_SKIP is set', () => {
    process.env.NODE_ENV = 'development'
    process.env.APPLE_IAP_VERIFY_SKIP = 'true'
    expect(verifyAppleTransaction('txn_1', 'replock_pro_monthly', true)).toBe(true)
  })

  it('fails closed in dev when stripe is configured and skip is unset', () => {
    process.env.NODE_ENV = 'development'
    expect(verifyAppleTransaction('txn_1', 'replock_pro_monthly', true)).toBe(false)
  })

  it('allows production only with APPLE_IAP_VERIFY_SKIP for App Review', () => {
    process.env.NODE_ENV = 'production'
    expect(verifyAppleTransaction('txn_1', 'replock_pro_monthly', true)).toBe(false)

    process.env.APPLE_IAP_VERIFY_SKIP = 'true'
    expect(verifyAppleTransaction('txn_1', 'replock_pro_monthly', true)).toBe(true)
  })
})
