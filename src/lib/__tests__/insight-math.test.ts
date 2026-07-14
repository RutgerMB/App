import { describe, expect, it } from 'vitest'
import {
  computeLifetimeScrollStats,
  formatInsightCount,
  INSIGHT_HORIZON_YEARS,
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
