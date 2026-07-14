import type Stripe from 'stripe'
import {
  findUserIdByStripeCustomerId,
  getEntitlement,
  setEntitlement,
} from './db.js'
import type { ProEntitlement } from './entitlement.js'

export type WebhookHandlerResult = { handled: boolean; userId?: string }

function resolveCustomerId(
  customer: string | Stripe.Customer | Stripe.DeletedCustomer | null
): string | null {
  if (!customer) return null
  return typeof customer === 'string' ? customer : customer.id
}

function subscriptionStatusToEntitlementStatus(
  status: Stripe.Subscription.Status
): ProEntitlement['subscriptionStatus'] {
  if (status === 'active' || status === 'trialing') return 'active'
  if (status === 'past_due') return 'past_due'
  if (status === 'canceled' || status === 'unpaid' || status === 'incomplete_expired') {
    return 'canceled'
  }
  return null
}

export function entitlementFromSubscription(
  subscription: Stripe.Subscription,
  existing?: ProEntitlement | null
): ProEntitlement {
  const status = subscription.status
  const entitlementStatus = subscriptionStatusToEntitlementStatus(status)
  const isPro = status === 'active' || status === 'trialing' || status === 'past_due'

  return {
    isPro,
    stripeCustomerId:
      resolveCustomerId(subscription.customer) ?? existing?.stripeCustomerId ?? null,
    subscriptionId: subscription.id,
    subscriptionStatus: entitlementStatus,
    source: 'stripe',
  }
}

function resolveUserIdFromSubscription(subscription: Stripe.Subscription): string | undefined {
  if (subscription.metadata?.userId) return subscription.metadata.userId
  const customerId = resolveCustomerId(subscription.customer)
  return customerId ? findUserIdByStripeCustomerId(customerId) : undefined
}

function resolveUserIdFromInvoice(invoice: Stripe.Invoice): string | undefined {
  if (invoice.metadata?.userId) return invoice.metadata.userId
  const customerId = resolveCustomerId(invoice.customer)
  return customerId ? findUserIdByStripeCustomerId(customerId) : undefined
}

export function handleSubscriptionUpdated(
  subscription: Stripe.Subscription
): WebhookHandlerResult {
  const userId = resolveUserIdFromSubscription(subscription)
  if (!userId) return { handled: false }

  const existing = getEntitlement(userId)
  const entitlement = entitlementFromSubscription(subscription, existing)
  setEntitlement(userId, entitlement)
  return { handled: true, userId }
}

export function handleSubscriptionDeleted(
  subscription: Stripe.Subscription
): WebhookHandlerResult {
  const userId = resolveUserIdFromSubscription(subscription)
  if (!userId) return { handled: false }

  const existing = getEntitlement(userId)
  setEntitlement(userId, {
    isPro: false,
    stripeCustomerId:
      resolveCustomerId(subscription.customer) ?? existing?.stripeCustomerId ?? null,
    subscriptionId: subscription.id,
    subscriptionStatus: 'canceled',
    source: 'stripe',
  })
  return { handled: true, userId }
}

export function handleInvoicePaymentFailed(invoice: Stripe.Invoice): WebhookHandlerResult {
  const userId = resolveUserIdFromInvoice(invoice)
  if (!userId) return { handled: false }

  const existing = getEntitlement(userId)
  const subscriptionId =
    typeof invoice.subscription === 'string'
      ? invoice.subscription
      : invoice.subscription?.id ?? existing?.subscriptionId ?? null

  setEntitlement(userId, {
    isPro: false,
    stripeCustomerId:
      resolveCustomerId(invoice.customer) ?? existing?.stripeCustomerId ?? null,
    subscriptionId,
    subscriptionStatus: 'past_due',
    source: 'stripe',
  })
  return { handled: true, userId }
}

export function handleStripeWebhookEvent(event: Stripe.Event): WebhookHandlerResult {
  switch (event.type) {
    case 'customer.subscription.updated':
      return handleSubscriptionUpdated(event.data.object as Stripe.Subscription)
    case 'customer.subscription.deleted':
      return handleSubscriptionDeleted(event.data.object as Stripe.Subscription)
    case 'invoice.payment_failed':
      return handleInvoicePaymentFailed(event.data.object as Stripe.Invoice)
    default:
      return { handled: false }
  }
}
