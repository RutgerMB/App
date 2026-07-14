import { describe, it, expect, vi, beforeEach } from 'vitest'
import {
  handleRevenueCatWebhookEvent,
  verifyRevenueCatAuthorization,
} from '../revenuecat-webhook.js'

const mockFindUserById = vi.fn()
const mockGetEntitlement = vi.fn()
const mockSetEntitlement = vi.fn()

vi.mock('../db.js', () => ({
  findUserById: (...args: unknown[]) => mockFindUserById(...args),
  getEntitlement: (...args: unknown[]) => mockGetEntitlement(...args),
  setEntitlement: (...args: unknown[]) => mockSetEntitlement(...args),
}))

describe('revenuecat-webhook', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockFindUserById.mockReturnValue({ id: 'user-1' })
    mockGetEntitlement.mockReturnValue(null)
  })

  it('activates pro on INITIAL_PURCHASE', () => {
    const result = handleRevenueCatWebhookEvent({
      api_version: '1.0',
      event: {
        id: 'evt_1',
        type: 'INITIAL_PURCHASE',
        app_user_id: 'user-1',
        product_id: 'replock_pro_yearly',
        entitlement_ids: ['pro'],
        transaction_id: 'tx_1',
      },
    })

    expect(result.handled).toBe(true)
    expect(result.userId).toBe('user-1')
    expect(mockSetEntitlement).toHaveBeenCalledWith(
      'user-1',
      expect.objectContaining({ isPro: true, source: 'revenuecat' })
    )
  })

  it('deactivates pro on EXPIRATION', () => {
    const result = handleRevenueCatWebhookEvent({
      api_version: '1.0',
      event: {
        id: 'evt_2',
        type: 'EXPIRATION',
        app_user_id: 'user-1',
        entitlement_ids: ['pro'],
      },
    })

    expect(result.handled).toBe(true)
    expect(mockSetEntitlement).toHaveBeenCalledWith(
      'user-1',
      expect.objectContaining({ isPro: false, subscriptionStatus: 'canceled' })
    )
  })

  it('rejects unknown users', () => {
    mockFindUserById.mockReturnValue(undefined)
    const result = handleRevenueCatWebhookEvent({
      api_version: '1.0',
      event: {
        id: 'evt_3',
        type: 'INITIAL_PURCHASE',
        app_user_id: 'unknown',
        entitlement_ids: ['pro'],
      },
    })
    expect(result.handled).toBe(false)
  })

  it('rejects webhooks when secret is missing', () => {
    expect(verifyRevenueCatAuthorization('secret123', undefined)).toBe(false)
    expect(verifyRevenueCatAuthorization(undefined, undefined)).toBe(false)
  })

  it('verifies authorization header', () => {
    expect(verifyRevenueCatAuthorization('secret123', 'secret123')).toBe(true)
    expect(verifyRevenueCatAuthorization('Bearer secret123', 'secret123')).toBe(true)
    expect(verifyRevenueCatAuthorization('wrong', 'secret123')).toBe(false)
  })
})
