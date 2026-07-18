/** Focused request-field validation for the Express JSON API (not HTML XSS). */

export const LIMITS = {
  email: 254,
  passwordMin: 8,
  passwordMax: 128,
  name: 80,
  transactionId: 200,
  productId: 120,
  customerId: 200,
  sessionId: 200,
  jsonDepth: 32,
} as const

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

const DANGEROUS_KEYS = new Set(['__proto__', 'constructor', 'prototype'])

export function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

export function asTrimmedString(
  value: unknown,
  field: string,
  maxLen: number
): { ok: true; value: string } | { ok: false; error: string } {
  if (typeof value !== 'string') {
    return { ok: false, error: `${field} must be a string` }
  }
  const trimmed = value.trim()
  if (!trimmed) {
    return { ok: false, error: `${field} is required` }
  }
  if (trimmed.length > maxLen) {
    return { ok: false, error: `${field} is too long` }
  }
  return { ok: true, value: trimmed }
}

export function asPassword(
  value: unknown
): { ok: true; value: string } | { ok: false; error: string } {
  if (typeof value !== 'string') {
    return { ok: false, error: 'Password must be a string' }
  }
  if (value.length < LIMITS.passwordMin) {
    return { ok: false, error: `Password must be at least ${LIMITS.passwordMin} characters` }
  }
  if (value.length > LIMITS.passwordMax) {
    return { ok: false, error: 'Password is too long' }
  }
  return { ok: true, value }
}

export function asEmail(
  value: unknown
): { ok: true; value: string } | { ok: false; error: string } {
  const raw = asTrimmedString(value, 'Email', LIMITS.email)
  if (!raw.ok) return raw
  const email = raw.value.toLowerCase()
  if (!EMAIL_RE.test(email)) {
    return { ok: false, error: 'Email is invalid' }
  }
  return { ok: true, value: email }
}

export function hasDangerousKeys(value: unknown, depth = 0): boolean {
  if (depth > LIMITS.jsonDepth) return true
  if (Array.isArray(value)) {
    return value.some((item) => hasDangerousKeys(item, depth + 1))
  }
  if (!isPlainObject(value)) return false
  for (const key of Object.keys(value)) {
    if (DANGEROUS_KEYS.has(key)) return true
    if (hasDangerousKeys(value[key], depth + 1)) return true
  }
  return false
}

export function asOptionalId(
  value: unknown,
  field: string,
  maxLen: number
): { ok: true; value: string | undefined } | { ok: false; error: string } {
  if (value === undefined || value === null || value === '') {
    return { ok: true, value: undefined }
  }
  if (typeof value !== 'string') {
    return { ok: false, error: `${field} must be a string` }
  }
  const trimmed = value.trim()
  if (!trimmed) return { ok: true, value: undefined }
  if (trimmed.length > maxLen) {
    return { ok: false, error: `${field} is too long` }
  }
  return { ok: true, value: trimmed }
}
