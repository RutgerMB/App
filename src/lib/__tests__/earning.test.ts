import { describe, expect, it } from 'vitest'
import {
  BASE_EARN_SCALE,
  computeEarnedMinutes,
  DIFFICULTY_MULTIPLIERS,
  getDifficultyMultiplier,
} from '../earning'

describe('getDifficultyMultiplier', () => {
  it('returns configured multipliers for each difficulty', () => {
    expect(getDifficultyMultiplier('easy')).toBe(DIFFICULTY_MULTIPLIERS.easy)
    expect(getDifficultyMultiplier('medium')).toBe(DIFFICULTY_MULTIPLIERS.medium)
    expect(getDifficultyMultiplier('hard')).toBe(DIFFICULTY_MULTIPLIERS.hard)
    expect(getDifficultyMultiplier('unstoppable')).toBe(DIFFICULTY_MULTIPLIERS.unstoppable)
  })
})

describe('computeEarnedMinutes', () => {
  it('computes minutes with medium difficulty by default', () => {
    const raw = 1.5 * 10 * BASE_EARN_SCALE * DIFFICULTY_MULTIPLIERS.medium
    expect(computeEarnedMinutes('pushups', 10)).toBe(Math.round(raw * 10) / 10)
  })

  it('applies difficulty multipliers to earned minutes', () => {
    const base = computeEarnedMinutes('pushups', 10, 'medium')
    expect(computeEarnedMinutes('pushups', 10, 'easy')).toBe(
      Math.round(base * DIFFICULTY_MULTIPLIERS.easy * 10) / 10,
    )
    expect(computeEarnedMinutes('pushups', 10, 'hard')).toBe(
      Math.round(base * DIFFICULTY_MULTIPLIERS.hard * 10) / 10,
    )
    expect(computeEarnedMinutes('pushups', 10, 'unstoppable')).toBe(
      Math.round(base * DIFFICULTY_MULTIPLIERS.unstoppable * 10) / 10,
    )
  })

  it('rounds earned minutes to one decimal place', () => {
    expect(computeEarnedMinutes('squats', 7)).toBe(2)
    expect(computeEarnedMinutes('pushups', 10, 'easy')).toBe(5.7)
  })
})
