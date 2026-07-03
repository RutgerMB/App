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

const stripeKey = process.env.STRIPE_SECRET_KEY

if (!stripeKey) {
  console.warn('⚠️  STRIPE_SECRET_KEY not set. Payment features will use demo mode.')
}

const stripe = stripeKey
  ? new Stripe(stripeKey)
  : null

// In-memory price mapping (created on first checkout if no price ID env var)
let proPriceId = process.env.STRIPE_PRICE_ID || ''

app.use(cors())
app.use(express.json())

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

// Serve static files in production
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, '../dist')))
  app.get('*', (_req, res) => {
    res.sendFile(path.join(__dirname, '../dist/index.html'))
  })
}

app.listen(PORT, () => {
  console.log(`🚀 RepLock server running on http://localhost:${PORT}`)
  console.log(`   Stripe: ${stripe ? 'configured' : 'demo mode'}`)
})
