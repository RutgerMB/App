import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatMinutes(minutes: number): string {
  if (minutes < 1) return '<1m'
  if (minutes < 60) return `${Math.round(minutes)}m`
  const h = Math.floor(minutes / 60)
  const m = Math.round(minutes % 60)
  return m > 0 ? `${h}h ${m}m` : `${h}h`
}

export function formatTimeRemaining(until: number): string {
  const diff = until - Date.now()
  if (diff <= 0) return '0m'
  const minutes = Math.ceil(diff / 60_000)
  return formatMinutes(minutes)
}

export function formatDate(timestamp: number): string {
  const date = new Date(timestamp)
  const now = new Date()
  const isToday = date.toDateString() === now.toDateString()
  if (isToday) {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  }
  return date.toLocaleDateString([], { month: 'short', day: 'numeric' })
}

export function formatPrice(amount: number, currency = 'EUR'): string {
  return new Intl.NumberFormat(undefined, {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
  }).format(amount)
}

export async function createCheckoutSession(priceId: string): Promise<string> {
  const res = await fetch('/api/checkout', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ priceId }),
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Checkout failed' }))
    throw new Error(err.error || 'Checkout failed')
  }
  const data = await res.json()
  return data.url
}

export async function verifySession(sessionId: string): Promise<{
  isPro: boolean
  customerId?: string
  subscriptionId?: string
}> {
  const res = await fetch(`/api/verify-session?session_id=${sessionId}`)
  if (!res.ok) throw new Error('Verification failed')
  return res.json()
}

export async function getSubscriptionStatus(customerId: string): Promise<{ isPro: boolean; status: string }> {
  const res = await fetch(`/api/subscription?customer_id=${customerId}`)
  if (!res.ok) return { isPro: false, status: 'none' }
  return res.json()
}
