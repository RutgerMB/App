import express from 'express'
import cors from 'cors'
import Stripe from 'stripe'
import dotenv from 'dotenv'
import path from 'path'
import { fileURLToPath } from 'url'

dotenv.config()

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const app = express()
const PORT = process.env.PORT || 3001
const clientUrl = process.env.CLIENT_URL || 'http://localhost:5173'

import {
  handleRegister,
  handleLogin,
  handleGetSync,
  handlePutSync,
  handleDeleteAccount,
  authMiddleware,
  type AuthPayload,
} from './auth.js'
import { ensureAppReviewAccount } from './review-account.js'
import { isFirebaseAdminConfigured } from './firebase-admin.js'
import {
  createEphemeralKey,
  resolveSubscriptionPaymentClientSecret,
} from './stripe-subscription.js'
import {
  getEntitlement,
  setEntitlement,
  isAppleTransactionUsed,
  markAppleTransactionUsed,
} from './db.js'
import type { ProEntitlement } from './entitlement.js'
import { verifyAppleTransaction, isValidAppleProductId } from './apple-iap-verify.js'
import { handleStripeWebhookEvent } from './stripe-webhook.js'

const stripeKey = process.env.STRIPE_SECRET_KEY

function isDemoMode(): boolean {
  return process.env.NODE_ENV !== 'production' && !stripeKey
}

if (!stripeKey) {
  console.warn('⚠️  STRIPE_SECRET_KEY not set. Payment features will use demo mode.')
}

const stripe = stripeKey ? new Stripe(stripeKey) : null

let proPriceId = process.env.STRIPE_PRICE_ID || ''

async function ensureProPrice(): Promise<string> {
  if (proPriceId) return proPriceId
  if (!stripe) throw new Error('Stripe not configured')

  const product = await stripe.products.create({
    name: 'RepLock Pro',
    description: 'Unlimited apps, custom limits, streak protection, and analytics',
  })

  const price = await stripe.prices.create({
    product: product.id,
    unit_amount: 799,
    currency: 'eur',
    recurring: { interval: 'month' },
  })

  proPriceId = price.id
  console.log(`Created Stripe price: ${proPriceId}`)
  return proPriceId
}

function getAuth(req: express.Request): AuthPayload {
  return (req as express.Request & { auth: AuthPayload }).auth
}

function customerBelongsToUser(userId: string, customerId: string): boolean {
  const entitlement = getEntitlement(userId)
  return entitlement?.stripeCustomerId === customerId
}

async function refreshEntitlementFromStripe(
  userId: string,
  entitlement: ProEntitlement
): Promise<ProEntitlement> {
  if (!stripe || !entitlement.stripeCustomerId) return entitlement

  const subscriptions = await stripe.subscriptions.list({
    customer: entitlement.stripeCustomerId,
    status: 'active',
    limit: 1,
  })

  if (subscriptions.data.length === 0) {
    const updated: ProEntitlement = {
      isPro: false,
      stripeCustomerId: entitlement.stripeCustomerId,
      subscriptionId: null,
      subscriptionStatus: null,
      source: entitlement.source,
    }
    setEntitlement(userId, updated)
    return updated
  }

  const sub = subscriptions.data[0]
  const updated: ProEntitlement = {
    isPro: true,
    stripeCustomerId: entitlement.stripeCustomerId,
    subscriptionId: sub.id,
    subscriptionStatus: 'active',
    source: 'stripe',
  }
  setEntitlement(userId, updated)
  return updated
}

const corsOptions =
  process.env.NODE_ENV === 'production' ? { origin: clientUrl } : {}

app.use(cors(corsOptions))

app.post(
  '/api/webhooks/stripe',
  express.raw({ type: 'application/json' }),
  async (req, res) => {
    if (!stripe) {
      return res.status(503).json({ error: 'Stripe is not configured' })
    }

    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET
    if (!webhookSecret) {
      return res.status(503).json({ error: 'Stripe webhook secret is not configured' })
    }

    const signature = req.headers['stripe-signature']
    if (!signature || typeof signature !== 'string') {
      return res.status(400).json({ error: 'Missing Stripe signature' })
    }

    let event: Stripe.Event
    try {
      event = stripe.webhooks.constructEvent(req.body, signature, webhookSecret)
    } catch (err) {
      console.error('Stripe webhook signature verification failed:', err)
      return res.status(400).json({ error: 'Invalid webhook signature' })
    }

    try {
      const result = handleStripeWebhookEvent(event)
      res.json({ received: true, handled: result.handled, userId: result.userId ?? null })
    } catch (err) {
      console.error('Stripe webhook handler error:', err)
      res.status(500).json({ error: 'Webhook handler failed' })
    }
  }
)

app.use(express.json())

app.post('/api/auth/register', handleRegister)
app.post('/api/auth/login', handleLogin)
app.get('/api/auth/sync', authMiddleware, handleGetSync)
app.put('/api/auth/sync', authMiddleware, handlePutSync)
app.delete('/api/auth/account', authMiddleware, handleDeleteAccount)

app.post('/api/subscription/apple/verify', authMiddleware, async (req, res) => {
  try {
    const auth = getAuth(req)
    const { transactionId, productId } = req.body as {
      transactionId?: string
      productId?: string
    }

    if (!transactionId || !productId) {
      return res.status(400).json({ error: 'Missing transaction data' })
    }

    if (!isValidAppleProductId(productId)) {
      return res.status(400).json({ error: 'Invalid product ID' })
    }

    if (isAppleTransactionUsed(transactionId)) {
      return res.status(409).json({ error: 'Transaction already redeemed' })
    }

    if (!verifyAppleTransaction(transactionId, productId, !!stripeKey)) {
      return res.status(403).json({ error: 'Purchase could not be verified' })
    }

    markAppleTransactionUsed(transactionId)

    const customerId = `apple_${transactionId.slice(0, 12)}`
    const entitlement: ProEntitlement = {
      isPro: true,
      stripeCustomerId: customerId,
      subscriptionId: transactionId,
      subscriptionStatus: 'active',
      source: 'apple',
    }
    setEntitlement(auth.userId, entitlement)

    res.json({
      customerId,
      subscriptionId: transactionId,
      productId,
      verified: true,
    })
  } catch (err) {
    console.error('Apple verify error:', err)
    res.status(500).json({ error: 'Verification failed' })
  }
})

app.post('/api/subscription/payment-sheet', authMiddleware, async (req, res) => {
  try {
    const auth = getAuth(req)
    if (!stripe) {
      return res.status(503).json({ error: 'Stripe is not configured. Add STRIPE_SECRET_KEY to .env' })
    }

    const { customerId } = req.body as { customerId?: string }
    const priceId = await ensureProPrice()

    if (customerId && !customerBelongsToUser(auth.userId, customerId)) {
      return res.status(403).json({ error: 'Customer does not belong to this account' })
    }

    const existingEntitlement = getEntitlement(auth.userId)
    const resolvedCustomerId = customerId ?? existingEntitlement?.stripeCustomerId ?? undefined

    let customer: Stripe.Customer
    if (resolvedCustomerId) {
      customer = (await stripe.customers.retrieve(resolvedCustomerId)) as Stripe.Customer
    } else if (auth.email) {
      const existing = await stripe.customers.list({ email: auth.email, limit: 1 })
      customer = existing.data[0] ?? (await stripe.customers.create({ email: auth.email }))
    } else {
      customer = await stripe.customers.create()
    }

    const subscription = await stripe.subscriptions.create({
      customer: customer.id,
      items: [{ price: priceId }],
      payment_behavior: 'default_incomplete',
      payment_settings: { save_default_payment_method: 'on_subscription' },
      expand: ['latest_invoice.confirmation_secret', 'latest_invoice.payment_intent'],
      metadata: { userId: auth.userId },
    })

    const clientSecret = await resolveSubscriptionPaymentClientSecret(stripe, subscription)
    const ephemeralKey = await createEphemeralKey(stripe, customer.id)

    res.json({
      paymentIntentClientSecret: clientSecret,
      customerId: customer.id,
      subscriptionId: subscription.id,
      ephemeralKey,
    })
  } catch (err) {
    console.error('Payment sheet error:', err)
    res.status(500).json({ error: err instanceof Error ? err.message : 'Payment setup failed' })
  }
})

app.post('/api/checkout', authMiddleware, async (req, res) => {
  try {
    if (isDemoMode()) {
      return res.json({
        url: `${clientUrl}/success?session_id=demo_session`,
      })
    }

    if (!stripe) {
      return res.status(503).json({ error: 'Stripe is not configured' })
    }

    const auth = getAuth(req)
    const priceId = await ensureProPrice()
    const entitlement = getEntitlement(auth.userId)

    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      payment_method_types: ['card'],
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${clientUrl}/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${clientUrl}/cancel`,
      allow_promotion_codes: true,
      customer: entitlement?.stripeCustomerId ?? undefined,
      customer_email: entitlement?.stripeCustomerId ? undefined : auth.email,
      metadata: { userId: auth.userId },
    })

    res.json({ url: session.url })
  } catch (err) {
    console.error('Checkout error:', err)
    res.status(500).json({ error: err instanceof Error ? err.message : 'Checkout failed' })
  }
})

app.get('/api/verify-session', authMiddleware, async (req, res) => {
  try {
    const auth = getAuth(req)
    const sessionId = req.query.session_id as string

    if (sessionId === 'demo_session' && isDemoMode()) {
      const entitlement: ProEntitlement = {
        isPro: true,
        stripeCustomerId: 'demo_customer',
        subscriptionId: 'demo_subscription',
        subscriptionStatus: 'active',
        source: 'demo',
      }
      setEntitlement(auth.userId, entitlement)
      return res.json({
        isPro: true,
        customerId: entitlement.stripeCustomerId,
        subscriptionId: entitlement.subscriptionId,
      })
    }

    if (!stripe) {
      return res.status(503).json({ error: 'Stripe is not configured' })
    }

    const session = await stripe.checkout.sessions.retrieve(sessionId)

    if (session.payment_status === 'paid' || session.status === 'complete') {
      const customerId = session.customer as string
      const subscriptionId = session.subscription as string
      const entitlement: ProEntitlement = {
        isPro: true,
        stripeCustomerId: customerId,
        subscriptionId,
        subscriptionStatus: 'active',
        source: 'stripe',
      }
      setEntitlement(auth.userId, entitlement)
      res.json({
        isPro: true,
        customerId,
        subscriptionId,
      })
    } else {
      res.json({ isPro: false })
    }
  } catch (err) {
    console.error('Verify error:', err)
    res.status(500).json({ error: 'Verification failed' })
  }
})

app.get('/api/subscription', authMiddleware, async (req, res) => {
  try {
    const auth = getAuth(req)
    const customerId = req.query.customer_id as string

    if (!customerId) {
      return res.status(400).json({ error: 'customer_id is required' })
    }

    if (!customerBelongsToUser(auth.userId, customerId)) {
      return res.status(403).json({ error: 'Customer does not belong to this account' })
    }

    if (customerId === 'demo_customer' && isDemoMode()) {
      return res.json({ isPro: true, status: 'active' })
    }

    if (!stripe) {
      return res.status(503).json({ error: 'Stripe is not configured' })
    }

    const subscriptions = await stripe.subscriptions.list({
      customer: customerId,
      status: 'active',
      limit: 1,
    })

    const isPro = subscriptions.data.length > 0
    res.json({
      isPro,
      status: isPro ? 'active' : 'none',
      subscriptionId: isPro ? subscriptions.data[0].id : null,
    })
  } catch (err) {
    console.error('Subscription check error:', err)
    res.status(500).json({ error: 'Failed to check subscription' })
  }
})

app.get('/api/subscription/status', authMiddleware, async (req, res) => {
  try {
    const auth = getAuth(req)
    const refresh = req.query.refresh === '1' || req.query.refresh === 'true'

    let entitlement =
      getEntitlement(auth.userId) ??
      ({
        isPro: false,
        stripeCustomerId: null,
        subscriptionId: null,
        subscriptionStatus: null,
      } satisfies ProEntitlement)

    if (refresh && entitlement.stripeCustomerId && entitlement.source !== 'apple') {
      entitlement = await refreshEntitlementFromStripe(auth.userId, entitlement)
    }

    res.json({
      isPro: entitlement.isPro,
      stripeCustomerId: entitlement.stripeCustomerId,
      subscriptionId: entitlement.subscriptionId,
      subscriptionStatus: entitlement.subscriptionStatus,
      source: entitlement.source ?? null,
    })
  } catch (err) {
    console.error('Subscription status error:', err)
    res.status(500).json({ error: 'Failed to get subscription status' })
  }
})

app.get('/api/health', (_req, res) => {
  res.json({
    status: 'ok',
    stripe: !!stripe,
    mode: stripeKey?.startsWith('sk_test') ? 'test' : stripe ? 'live' : 'demo',
    demo: isDemoMode(),
  })
})

if (process.env.NODE_ENV !== 'production') {
  app.get('/', (_req, res) => {
    res.redirect(clientUrl)
  })
}

if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, '../dist')))
  app.get('*', (_req, res) => {
    res.sendFile(path.join(__dirname, '../dist/index.html'))
  })
}

app.listen(Number(PORT), '0.0.0.0', async () => {
  await ensureAppReviewAccount()
  console.log(`🚀 RepLock server running on http://localhost:${PORT}`)
  console.log(`   App (dev): ${clientUrl}`)
  console.log(`   Stripe: ${stripe ? 'configured' : 'demo mode'}`)
  console.log(`   Demo mode: ${isDemoMode()}`)
  console.log(`   Firebase Admin: ${isFirebaseAdminConfigured() ? 'configured' : 'not set (JWT auth only on API)'}`)
  if (process.env.APP_REVIEW_EMAIL) {
    console.log(`   App Review login: ${process.env.APP_REVIEW_EMAIL}`)
  }
})
