import { describe, it, expect } from 'vitest'
import {
  asEmail,
  asPassword,
  asTrimmedString,
  hasDangerousKeys,
  LIMITS,
} from '../validate.js'

describe('asEmail', () => {
  it('accepts and lowercases a valid email', () => {
    const result = asEmail('  User@Example.COM ')
    expect(result).toEqual({ ok: true, value: 'user@example.com' })
  })

  it('rejects missing or non-string', () => {
    expect(asEmail(undefined).ok).toBe(false)
    expect(asEmail(123).ok).toBe(false)
  })

  it('rejects invalid shape', () => {
    expect(asEmail('not-an-email').ok).toBe(false)
  })
})

describe('asPassword', () => {
  it('enforces min and max length', () => {
    expect(asPassword('short').ok).toBe(false)
    expect(asPassword('a'.repeat(LIMITS.passwordMin)).ok).toBe(true)
    expect(asPassword('a'.repeat(LIMITS.passwordMax + 1)).ok).toBe(false)
  })

  it('rejects non-strings', () => {
    expect(asPassword({ length: 12 }).ok).toBe(false)
  })
})

describe('asTrimmedString', () => {
  it('trims and caps length', () => {
    expect(asTrimmedString('  Ada  ', 'Name', 80)).toEqual({ ok: true, value: 'Ada' })
    expect(asTrimmedString('x'.repeat(81), 'Name', 80).ok).toBe(false)
  })

  it('rejects unexpected types', () => {
    expect(asTrimmedString(['Ada'], 'Name', 80).ok).toBe(false)
  })
})

describe('hasDangerousKeys', () => {
  it('detects prototype pollution keys', () => {
    expect(hasDangerousKeys(JSON.parse('{"__proto__":{"admin":true}}'))).toBe(true)
    expect(hasDangerousKeys({ nested: { constructor: { prototype: {} } } })).toBe(true)
    expect(hasDangerousKeys({ profile: { name: 'ok' } })).toBe(false)
  })
})
