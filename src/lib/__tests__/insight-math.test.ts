import { describe, expect, it } from 'vitest'
import {
  computeLifetimeScrollStats,
  computeWithRepLockProjection,
  formatInsightCount,
  DEFAULT_DAILY_OPENINGS,
  DEFAULT_MINUTES_PER_OPENING,
  INSIGHT_HORIZON_YEARS,
  REPLOCK_TARGET_REDUCTION,
} from '../insight-math'

describe('computeLifetimeScrollStats', () => {
  it('clamps daily hours to at least 0.25', () => {
    const stats = computeLifetimeScrollStats(0)
    expect(stats.dailyHours).toBe(0.25)
  })

  it('derives lifetime stats from daily scroll hours', () => {
    const dailyHours = 2
    const stats = computeLifetimeScrollStats(dailyHours)

    expect(stats.dailyHours).toBe(dailyHours)
    expect(stats.totalScrollHours).toBe(dailyHours * 365 * INSIGHT_HORIZON_YEARS)
    expect(stats.yearsOnPhone).toBe(Math.round(((dailyHours * INSIGHT_HORIZON_YEARS) / 24) * 10) / 10)

    const expectedReps = Math.round(dailyHours * 60 * 365 * INSIGHT_HORIZON_YEARS * 15)
    expect(stats.repsIfTrainedInstead).toBe(expectedReps)
  })
})

describe('computeWithRepLockProjection', () => {
  it('applies the documented 55% reduction formula', () => {
    const baseline = 4
    const projection = computeWithRepLockProjection(baseline)

    const earned = (DEFAULT_DAILY_OPENINGS * DEFAULT_MINUTES_PER_OPENING) / 60
    const expected =
      Math.round(Math.max(earned, baseline * (1 - REPLOCK_TARGET_REDUCTION)) * 60) / 60

    expect(projection.baselineHours).toBe(4)
    expect(projection.withRepLockHours).toBe(expected)
    expect(projection.withRepLockHours).toBe(1.8)
    expect(projection.reductionPct).toBe(55)
    expect(projection.earnedAllowanceMinutes).toBe(15)
    expect(projection.withRepLockHours).toBeLessThan(baseline)
  })

  it('floors at earned unlock allowance for low baselines', () => {
    const projection = computeWithRepLockProjection(0.4, {
      openings: 3,
      minutesPerOpening: 5,
    })
    // 0.4 × 0.45 = 0.18 → floor at 0.25h (15 min)
    expect(projection.withRepLockHours).toBe(0.25)
    expect(projection.earnedAllowanceHours).toBe(0.25)
  })

  it('never returns identical before/after for typical baselines', () => {
    for (const hours of [2, 4, 6, 8, 10]) {
      const p = computeWithRepLockProjection(hours)
      expect(p.withRepLockHours).not.toBe(p.baselineHours)
      expect(p.reductionPct).toBeGreaterThan(0)
    }
  })
})

describe('formatInsightCount', () => {
  it('formats millions with one decimal and M suffix', () => {
    expect(formatInsightCount(1_234_567)).toMatch(/1[.,]2M/)
  })

  it('formats thousands as K for values at or above 10k', () => {
    expect(formatInsightCount(84_000)).toMatch(/84K/)
  })

  it('uses locale formatting for smaller values', () => {
    expect(formatInsightCount(999)).toBe((999).toLocaleString())
  })
})
