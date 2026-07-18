import { describe, expect, it } from 'vitest'
import {
  estimateRepDwellSeconds,
  formatSessionTimer,
  REP_DWELL_MAX_SECONDS,
  REP_DWELL_MIN_SECONDS,
  SET_REST_SECONDS,
} from '../exercise-accountability'

describe('estimateRepDwellSeconds', () => {
  it('enforces a minimum dwell', () => {
    expect(estimateRepDwellSeconds(1)).toBe(REP_DWELL_MIN_SECONDS)
    expect(estimateRepDwellSeconds(0)).toBe(REP_DWELL_MIN_SECONDS)
  })

  it('scales with reps for typical sets', () => {
    expect(estimateRepDwellSeconds(10)).toBe(14)
    expect(estimateRepDwellSeconds(20)).toBe(28)
  })

  it('caps very large sets', () => {
    expect(estimateRepDwellSeconds(200)).toBe(REP_DWELL_MAX_SECONDS)
  })
})

describe('formatSessionTimer', () => {
  it('formats mm:ss', () => {
    expect(formatSessionTimer(0)).toBe('0:00')
    expect(formatSessionTimer(65)).toBe('1:05')
    expect(formatSessionTimer(-3)).toBe('0:00')
  })
})

describe('SET_REST_SECONDS', () => {
  it('is a short ~5s catch-your-breath pause', () => {
    expect(SET_REST_SECONDS).toBeGreaterThanOrEqual(4)
    expect(SET_REST_SECONDS).toBeLessThanOrEqual(8)
  })
})
