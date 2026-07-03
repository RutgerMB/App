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

import {
  handleRegister,
  handleLogin,
  handleGetSync,
  handlePutSync,
  authMiddleware,
} from './auth.js'

const stripeKey = process.env.STRIPE_SECRET_KEY

if (!stripeKey) {
  console.warn('⚠️  STRIPE_SECRET_KEY not set. Payment features will use demo mode.')
}

const stripe = stripeKey
  ? new Stripe(stripeKey)
  : null

// In-memory price mapping (created on first checkout if no price ID env var)
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

app.use(cors())
app.use(express.json())

app.post('/api/auth/register', handleRegister)
app.post('/api/auth/login', handleLogin)
app.get('/api/auth/sync', authMiddleware, handleGetSync)
app.put('/api/auth/sync', authMiddleware, handlePutSync)

app.post('/api/subscription/payment-sheet', async (req, res) => {
  try {
    if (!stripe) {
      return res.status(503).json({ error: 'Stripe is not configured. Add STRIPE_SECRET_KEY to .env' })
    }

    const { email, customerId } = req.body as { email?: string; customerId?: string }
    const priceId = await ensureProPrice()

    let customer: Stripe.Customer
    if (customerId) {
      customer = (await stripe.customers.retrieve(customerId)) as Stripe.Customer
    } else if (email) {
      const existing = await stripe.customers.list({ email, limit: 1 })
      customer = existing.data[0] ?? (await stripe.customers.create({ email }))
    } else {
      customer = await stripe.customers.create()
    }

    const subscription = await stripe.subscriptions.create({
      customer: customer.id,
      items: [{ price: priceId }],
      payment_behavior: 'default_incomplete',
      payment_settings: { save_default_payment_method: 'on_subscription' },
      expand: ['latest_invoice.payment_intent'],
    })

    const invoice = subscription.latest_invoice as Stripe.Invoice
    const paymentIntent = invoice.payment_intent as Stripe.PaymentIntent
    if (!paymentIntent?.client_secret) {
      return res.status(500).json({ error: 'Could not create payment intent' })
    }

    const ephemeralKey = await stripe.ephemeralKeys.create(
      { customer: customer.id },
      { apiVersion: '2025-02-24.acacia' }
    )

    res.json({
      paymentIntentClientSecret: paymentIntent.client_secret,
      customerId: customer.id,
      subscriptionId: subscription.id,
      ephemeralKey: ephemeralKey.secret,
    })
  } catch (err) {
    console.error('Payment sheet error:', err)
    res.status(500).json({ error: err instanceof Error ? err.message : 'Payment setup failed' })
  }
})

app.post('/api/checkout', async (req, res) => {
  try {
    if (!stripe) {
      // Demo mode: redirect to success
      return res.json({
        url: `${process.env.CLIENT_URL || 'http://localhost:5173'}/success?session_id=demo_session`,
      })
    }

    const priceId = await ensureProPrice()
    const clientUrl = process.env.CLIENT_URL || 'http://localhost:5173'

    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      payment_method_types: ['card'],
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${clientUrl}/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${clientUrl}/cancel`,
      allow_promotion_codes: true,
    })

    res.json({ url: session.url })
  } catch (err) {
    console.error('Checkout error:', err)
    res.status(500).json({ error: err instanceof Error ? err.message : 'Checkout failed' })
  }
})

app.get('/api/verify-session', async (req, res) => {
  try {
    const sessionId = req.query.session_id as string

    if (sessionId === 'demo_session' || !stripe) {
      return res.json({
        isPro: true,
        customerId: 'demo_customer',
        subscriptionId: 'demo_subscription',
      })
    }

    const session = await stripe.checkout.sessions.retrieve(sessionId)

    if (session.payment_status === 'paid' || session.status === 'complete') {
      res.json({
        isPro: true,
        customerId: session.customer as string,
        subscriptionId: session.subscription as string,
      })
    } else {
      res.json({ isPro: false })
    }
  } catch (err) {
    console.error('Verify error:', err)
    res.status(500).json({ error: 'Verification failed' })
  }
})

app.get('/api/subscription', async (req, res) => {
  try {
    const customerId = req.query.customer_id as string

    if (!stripe || customerId === 'demo_customer') {
      return res.json({ isPro: true, status: 'active' })
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

app.get('/api/health', (_req, res) => {
  res.json({
    status: 'ok',
    stripe: !!stripe,
    mode: stripeKey?.startsWith('sk_test') ? 'test' : stripe ? 'live' : 'demo',
  })
})

const clientUrl = process.env.CLIENT_URL || 'http://localhost:5173'

// In dev, port 3001 is API-only — send browsers to the Vite app
if (process.env.NODE_ENV !== 'production') {
  app.get('/', (_req, res) => {
    res.redirect(clientUrl)
  })
}

// Serve static files in production
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, '../dist')))
  app.get('*', (_req, res) => {
    res.sendFile(path.join(__dirname, '../dist/index.html'))
  })
}

app.listen(Number(PORT), '0.0.0.0', () => {
  console.log(`🚀 RepLock server running on http://localhost:${PORT}`)
  console.log(`   App (dev): ${clientUrl}`)
  console.log(`   Stripe: ${stripe ? 'configured' : 'demo mode'}`)
})
