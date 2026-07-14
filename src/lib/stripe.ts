import { Capacitor } from '@capacitor/core'
import { Stripe, PaymentSheetEventsEnum } from '@capacitor-community/stripe'
import { apiFetch } from '@/lib/api'
import { getBearerHeaders } from '@/lib/auth-headers'
import { canUseStripe } from '@/lib/payment-platform'

const PUBLISHABLE_KEY = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY

let initialized = false

export function isStripeConfigured(): boolean {
  return Boolean(PUBLISHABLE_KEY)
}

export async function initStripe(): Promise<void> {
  if (!PUBLISHABLE_KEY || initialized) return
  await Stripe.initialize({ publishableKey: PUBLISHABLE_KEY })
  initialized = true
}

export interface NativeSubscriptionResult {
  customerId: string
  subscriptionId: string
}

export async function presentNativeProCheckout(
  email?: string,
  customerId?: string | null
): Promise<NativeSubscriptionResult> {
  if (!PUBLISHABLE_KEY) {
    throw new Error('Stripe publishable key is not configured')
  }

  await initStripe()

  const res = await apiFetch('/api/subscription/payment-sheet', {
    method: 'POST',
    headers: await getBearerHeaders({ 'Content-Type': 'application/json' }),
    body: JSON.stringify({
      email,
      customerId: customerId ?? undefined,
    }),
  })

  const data = await res.json()
  if (!res.ok) {
    throw new Error(data.error ?? 'Failed to start payment')
  }

  await Stripe.createPaymentSheet({
    paymentIntentClientSecret: data.paymentIntentClientSecret,
    merchantDisplayName: 'RepLock',
    customerId: data.customerId,
    customerEphemeralKeySecret: data.ephemeralKey,
    enableGooglePay: Capacitor.getPlatform() === 'android',
    GooglePayIsTesting: true,
    countryCode: 'NL',
    currencyCode: 'EUR',
  })

  const { paymentResult } = await Stripe.presentPaymentSheet()

  if (paymentResult === PaymentSheetEventsEnum.Canceled) {
    throw new Error('Payment canceled')
  }
  if (paymentResult === PaymentSheetEventsEnum.Failed) {
    throw new Error('Payment failed')
  }

  return {
    customerId: data.customerId,
    subscriptionId: data.subscriptionId,
  }
}

export function shouldUseNativeStripeCheckout(): boolean {
  return Capacitor.isNativePlatform() && isStripeConfigured() && canUseStripe()
}
