import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type Stripe from 'stripe'
import {
  entitlementFromSubscription,
  handleInvoicePaymentFailed,
  handleStripeWebhookEvent,
  handleSubscriptionDeleted,
  handleSubscriptionUpdated,
} from '../stripe-webhook.js'

const mockGetEntitlement = vi.fn()
const mockSetEntitlement = vi.fn()
const mockFindUserIdByStripeCustomerId = vi.fn()

vi.mock('../db.js', () => ({
  getEntitlement: (...args: unknown[]) => mockGetEntitlement(...args),
  setEntitlement: (...args: unknown[]) => mockSetEntitlement(...args),
  findUserIdByStripeCustomerId: (...args: unknown[]) =>
    mockFindUserIdByStripeCustomerId(...args),
}))

function makeSubscription(
  overrides: Partial<Stripe.Subscription> = {}
): Stripe.Subscription {
  return {
    id: 'sub_123',
    object: 'subscription',
    customer: 'cus_abc',
    status: 'active',
    metadata: { userId: 'user-1' },
    ...overrides,
  } as Stripe.Subscription
}

function makeInvoice(overrides: Partial<Stripe.Invoice> = {}): Stripe.Invoice {
  return {
    id: 'in_123',
    object: 'invoice',
    customer: 'cus_abc',
    subscription: 'sub_123',
    metadata: {},
    ...overrides,
  } as Stripe.Invoice
}

describe('entitlementFromSubscription', () => {
  it('marks active subscriptions as Pro', () => {
    const entitlement = entitlementFromSubscription(makeSubscription({ status: 'active' }))
    expect(entitlement.isPro).toBe(true)
    expect(entitlement.subscriptionStatus).toBe('active')
    expect(entitlement.source).toBe('stripe')
  })

  it('marks past_due subscriptions as Pro with past_due status', () => {
    const entitlement = entitlementFromSubscription(makeSubscription({ status: 'past_due' }))
    expect(entitlement.isPro).toBe(true)
    expect(entitlement.subscriptionStatus).toBe('past_due')
  })

  it('revokes Pro for canceled subscriptions', () => {
    const entitlement = entitlementFromSubscription(makeSubscription({ status: 'canceled' }))
    expect(entitlement.isPro).toBe(false)
    expect(entitlement.subscriptionStatus).toBe('canceled')
  })
})

describe('handleSubscriptionUpdated', () => {
  beforeEach(() => {
    mockGetEntitlement.mockReturnValue({
      isPro: false,
      stripeCustomerId: 'cus_abc',
      subscriptionId: null,
      subscriptionStatus: null,
    })
    mockSetEntitlement.mockReturnValue(undefined)
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  it('updates entitlement from subscription metadata.userId', () => {
    const subscription = makeSubscription({ status: 'active' })
    const result = handleSubscriptionUpdated(subscription)

    expect(result).toEqual({ handled: true, userId: 'user-1' })
    expect(mockSetEntitlement).toHaveBeenCalledWith('user-1', {
      isPro: true,
      stripeCustomerId: 'cus_abc',
      subscriptionId: 'sub_123',
      subscriptionStatus: 'active',
      source: 'stripe',
    })
  })

  it('resolves userId from stripe customer when metadata is missing', () => {
    mockFindUserIdByStripeCustomerId.mockReturnValue('user-from-customer')
    const subscription = makeSubscription({
      metadata: {},
      status: 'active',
    })

    const result = handleSubscriptionUpdated(subscription)

    expect(result).toEqual({ handled: true, userId: 'user-from-customer' })
    expect(mockFindUserIdByStripeCustomerId).toHaveBeenCalledWith('cus_abc')
  })

  it('returns handled:false when user cannot be resolved', () => {
    mockFindUserIdByStripeCustomerId.mockReturnValue(undefined)
    const result = handleSubscriptionUpdated(makeSubscription({ metadata: {} }))
    expect(result).toEqual({ handled: false })
    expect(mockSetEntitlement).not.toHaveBeenCalled()
  })
})

describe('handleSubscriptionDeleted', () => {
  beforeEach(() => {
    mockGetEntitlement.mockReturnValue({
      isPro: true,
      stripeCustomerId: 'cus_abc',
      subscriptionId: 'sub_123',
      subscriptionStatus: 'active',
      source: 'stripe',
    })
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  it('revokes Pro entitlement on deletion', () => {
    const result = handleSubscriptionDeleted(makeSubscription())

    expect(result).toEqual({ handled: true, userId: 'user-1' })
    expect(mockSetEntitlement).toHaveBeenCalledWith('user-1', {
      isPro: false,
      stripeCustomerId: 'cus_abc',
      subscriptionId: 'sub_123',
      subscriptionStatus: 'canceled',
      source: 'stripe',
    })
  })
})

describe('handleInvoicePaymentFailed', () => {
  beforeEach(() => {
    mockGetEntitlement.mockReturnValue({
      isPro: true,
      stripeCustomerId: 'cus_abc',
      subscriptionId: 'sub_123',
      subscriptionStatus: 'active',
      source: 'stripe',
    })
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  it('marks entitlement past_due and revokes Pro', () => {
    mockFindUserIdByStripeCustomerId.mockReturnValue('user-1')
    const result = handleInvoicePaymentFailed(makeInvoice())

    expect(result).toEqual({ handled: true, userId: 'user-1' })
    expect(mockSetEntitlement).toHaveBeenCalledWith('user-1', {
      isPro: false,
      stripeCustomerId: 'cus_abc',
      subscriptionId: 'sub_123',
      subscriptionStatus: 'past_due',
      source: 'stripe',
    })
  })

  it('prefers invoice metadata.userId', () => {
    const result = handleInvoicePaymentFailed(
      makeInvoice({ metadata: { userId: 'user-invoice' } })
    )

    expect(result).toEqual({ handled: true, userId: 'user-invoice' })
    expect(mockFindUserIdByStripeCustomerId).not.toHaveBeenCalled()
  })
})

describe('handleStripeWebhookEvent', () => {
  beforeEach(() => {
    mockGetEntitlement.mockReturnValue({
      isPro: true,
      stripeCustomerId: 'cus_abc',
      subscriptionId: 'sub_123',
      subscriptionStatus: 'active',
      source: 'stripe',
    })
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  it('routes customer.subscription.updated events', () => {
    const result = handleStripeWebhookEvent({
      id: 'evt_1',
      object: 'event',
      type: 'customer.subscription.updated',
      data: { object: makeSubscription({ status: 'canceled' }) },
    } as Stripe.Event)

    expect(result.handled).toBe(true)
    expect(mockSetEntitlement).toHaveBeenCalled()
  })

  it('routes customer.subscription.deleted events', () => {
    const result = handleStripeWebhookEvent({
      id: 'evt_2',
      object: 'event',
      type: 'customer.subscription.deleted',
      data: { object: makeSubscription() },
    } as Stripe.Event)

    expect(result).toEqual({ handled: true, userId: 'user-1' })
  })

  it('routes invoice.payment_failed events', () => {
    mockFindUserIdByStripeCustomerId.mockReturnValue('user-1')
    const result = handleStripeWebhookEvent({
      id: 'evt_3',
      object: 'event',
      type: 'invoice.payment_failed',
      data: { object: makeInvoice() },
    } as Stripe.Event)

    expect(result).toEqual({ handled: true, userId: 'user-1' })
  })

  it('ignores unsupported event types', () => {
    const result = handleStripeWebhookEvent({
      id: 'evt_4',
      object: 'event',
      type: 'checkout.session.completed',
      data: { object: {} },
    } as Stripe.Event)

    expect(result).toEqual({ handled: false })
    expect(mockSetEntitlement).not.toHaveBeenCalled()
  })
})
