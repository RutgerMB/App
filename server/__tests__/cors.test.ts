import { describe, expect, it } from 'vitest'
import { buildProductionAllowedOrigins, createCorsOptions } from '../cors.js'

describe('buildProductionAllowedOrigins', () => {
  it('always includes Capacitor / localhost WebView origins', () => {
    const allowed = buildProductionAllowedOrigins('https://api.example.com')
    expect(allowed.has('capacitor://localhost')).toBe(true)
    expect(allowed.has('http://localhost')).toBe(true)
    expect(allowed.has('https://localhost')).toBe(true)
    expect(allowed.has('https://api.example.com')).toBe(true)
  })

  it('merges CLIENT_ORIGINS extras', () => {
    const allowed = buildProductionAllowedOrigins(
      'https://api.example.com',
      'https://app.example.com, https://staging.example.com/'
    )
    expect(allowed.has('https://app.example.com')).toBe(true)
    expect(allowed.has('https://staging.example.com')).toBe(true)
  })
})

describe('createCorsOptions', () => {
  it('allows all origins outside production', () => {
    expect(createCorsOptions('development', 'http://localhost:5173')).toEqual({})
  })

  it('allows capacitor origin in production', () => {
    const opts = createCorsOptions('production', 'https://api.example.com')
    expect(opts).toHaveProperty('origin')
    const originFn = (opts as { origin: Function }).origin
    return new Promise<void>((resolve) => {
      originFn('capacitor://localhost', (_err: Error | null, allow?: boolean) => {
        expect(allow).toBe(true)
        resolve()
      })
    })
  })

  it('blocks unknown origins in production', () => {
    const opts = createCorsOptions('production', 'https://api.example.com')
    const originFn = (opts as { origin: Function }).origin
    return new Promise<void>((resolve) => {
      originFn('https://evil.example', (_err: Error | null, allow?: boolean) => {
        expect(allow).toBe(false)
        resolve()
      })
    })
  })
})
