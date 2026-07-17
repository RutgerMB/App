import { timingSafeEqual } from 'crypto'
import { ensureExternalUser, getEntitlement, setEntitlement } from './db.js'
import type { ProEntitlement } from './entitlement.js'

export interface RevenueCatWebhookEvent {
  id: string
  type: string
  app_user_id: string
  product_id?: string
  entitlement_ids?: string[]
  expiration_at_ms?: number | null
  transaction_id?: string
}

export interface RevenueCatWebhookPayload {
  api_version: string
  event: RevenueCatWebhookEvent
}

export type WebhookHandlerResult = { handled: boolean; userId?: string }

const PRO_ENTITLEMENT_ID = 'pro'

const ACTIVATE_EVENTS = new Set([
  'INITIAL_PURCHASE',
  'RENEWAL',
  'UNCANCELLATION',
  'PRODUCT_CHANGE',
  'SUBSCRIPTION_EXTENDED',
])

const DEACTIVATE_EVENTS = new Set(['EXPIRATION'])

const GRACE_EVENTS = new Set(['BILLING_ISSUE', 'CANCELLATION'])

function hasProEntitlement(event: RevenueCatWebhookEvent): boolean {
  return (event.entitlement_ids ?? []).includes(PRO_ENTITLEMENT_ID)
}

function buildEntitlement(
  event: RevenueCatWebhookEvent,
  isPro: boolean,
  status: ProEntitlement['subscriptionStatus'],
  existing?: ProEntitlement | null
): ProEntitlement {
  const transactionId =
    event.transaction_id ?? existing?.subscriptionId ?? `rc_${event.id}`

  return {
    isPro,
    stripeCustomerId: `rc_${event.app_user_id}`,
    subscriptionId: transactionId,
    subscriptionStatus: status,
    source: 'revenuecat',
  }
}

export function handleRevenueCatWebhookEvent(
  payload: RevenueCatWebhookPayload
): WebhookHandlerResult {
  const event = payload.event
  if (!event?.app_user_id) return { handled: false }

  const userId = event.app_user_id
  ensureExternalUser(userId)

  const existing = getEntitlement(userId)
  const proEntitled = hasProEntitlement(event)

  if (ACTIVATE_EVENTS.has(event.type) && proEntitled) {
    setEntitlement(userId, buildEntitlement(event, true, 'active', existing))
    return { handled: true, userId }
  }

  if (DEACTIVATE_EVENTS.has(event.type)) {
    setEntitlement(userId, buildEntitlement(event, false, 'canceled', existing))
    return { handled: true, userId }
  }

  if (GRACE_EVENTS.has(event.type) && proEntitled) {
    const stillActive =
      event.type === 'CANCELLATION' &&
      typeof event.expiration_at_ms === 'number' &&
      event.expiration_at_ms > Date.now()

    if (stillActive) {
      setEntitlement(userId, buildEntitlement(event, true, 'active', existing))
    } else if (event.type === 'BILLING_ISSUE') {
      setEntitlement(userId, buildEntitlement(event, false, 'past_due', existing))
    } else {
      setEntitlement(userId, buildEntitlement(event, true, 'active', existing))
    }
    return { handled: true, userId }
  }

  return { handled: false }
}

function safeEqualString(a: string, b: string): boolean {
  const bufA = Buffer.from(a)
  const bufB = Buffer.from(b)
  if (bufA.length !== bufB.length) return false
  return timingSafeEqual(bufA, bufB)
}

export function verifyRevenueCatAuthorization(
  authHeader: string | undefined,
  expectedSecret: string | undefined
): boolean {
  if (!expectedSecret) return false
  if (!authHeader) return false
  return (
    safeEqualString(authHeader, expectedSecret) ||
    safeEqualString(authHeader, `Bearer ${expectedSecret}`)
  )
}
