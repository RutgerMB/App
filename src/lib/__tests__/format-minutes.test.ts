import { describe, expect, it } from 'vitest'
import { formatMinutes } from '@/lib/utils'

describe('formatMinutes', () => {
  it('shows 0m for zero or negative', () => {
    expect(formatMinutes(0)).toBe('0m')
    expect(formatMinutes(-1)).toBe('0m')
  })

  it('rounds fractional under one minute up to 1m', () => {
    expect(formatMinutes(0.1)).toBe('1m')
    expect(formatMinutes(0.9)).toBe('1m')
  })

  it('rounds whole minutes under an hour', () => {
    expect(formatMinutes(1)).toBe('1m')
    expect(formatMinutes(15.4)).toBe('15m')
    expect(formatMinutes(59)).toBe('59m')
  })

  it('formats hours', () => {
    expect(formatMinutes(60)).toBe('1h')
    expect(formatMinutes(90)).toBe('1h 30m')
  })
})
