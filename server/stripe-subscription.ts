import type Stripe from 'stripe'

type InvoiceWithPaymentData = Stripe.Invoice & {
  confirmation_secret?: { client_secret?: string | null } | null
  payment_intent?: Stripe.PaymentIntent | string | null
  payments?: {
    data?: Array<{
      payment?: {
        payment_intent?: Stripe.PaymentIntent | string | null
      }
    }>
  }
}

export async function resolveSubscriptionPaymentClientSecret(
  stripe: Stripe,
  subscription: Stripe.Subscription
): Promise<string> {
  let invoice = subscription.latest_invoice
  if (!invoice) {
    throw new Error('Subscription has no invoice')
  }

  if (typeof invoice === 'string') {
    invoice = await stripe.invoices.retrieve(invoice, {
      expand: ['confirmation_secret', 'payment_intent', 'payments.data.payment.payment_intent'],
    })
  }

  const secret = extractClientSecret(invoice as InvoiceWithPaymentData)
  if (secret) return secret

  const legacyIntent = (invoice as InvoiceWithPaymentData).payment_intent
  if (typeof legacyIntent === 'string') {
    const intent = await stripe.paymentIntents.retrieve(legacyIntent)
    if (intent.client_secret) return intent.client_secret
  }

  const invoiceId = typeof invoice === 'string' ? invoice : invoice.id
  const expanded = await stripe.invoices.retrieve(invoiceId, {
    expand: ['confirmation_secret', 'payment_intent', 'payments.data.payment.payment_intent'],
  })

  const retrySecret = extractClientSecret(expanded as InvoiceWithPaymentData)
  if (retrySecret) return retrySecret

  throw new Error('Could not resolve payment client secret from invoice')
}

function extractClientSecret(invoice: InvoiceWithPaymentData): string | null {
  if (invoice.confirmation_secret?.client_secret) {
    return invoice.confirmation_secret.client_secret
  }

  const paymentIntent = invoice.payment_intent
  if (paymentIntent && typeof paymentIntent === 'object' && paymentIntent.client_secret) {
    return paymentIntent.client_secret
  }

  const nestedIntent = invoice.payments?.data?.[0]?.payment?.payment_intent
  if (nestedIntent && typeof nestedIntent === 'object' && nestedIntent.client_secret) {
    return nestedIntent.client_secret
  }

  return null
}

export async function createEphemeralKey(
  stripe: Stripe,
  customerId: string
): Promise<string> {
  const apiVersion = stripe.getApiField('version')
  const ephemeralKey = await stripe.ephemeralKeys.create(
    { customer: customerId },
    { apiVersion }
  )
  if (!ephemeralKey.secret) {
    throw new Error('Could not create Stripe ephemeral key')
  }
  return ephemeralKey.secret
}
