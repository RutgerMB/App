import { describe, expect, it } from 'vitest'
import {
  clampAppDailyLimit,
  clampExerciseAmount,
  clampSetCount,
  clampUnlockMinutes,
  clampUnlocksLeft,
  digitsOnly,
  maxSetsForAmount,
  MAX_EXERCISE_AMOUNT,
  MAX_SET_COUNT,
  MAX_UNLOCKS_LEFT,
  MIN_UNLOCKS_LEFT,
} from '../numeric-input'

describe('digitsOnly', () => {
  it('strips non-digits', () => {
    expect(digitsOnly('12a3')).toBe('123')
    expect(digitsOnly('-4.5')).toBe('45')
  })
})

describe('clampUnlocksLeft', () => {
  it('clamps to 1–500', () => {
    expect(clampUnlocksLeft(0)).toBe(MIN_UNLOCKS_LEFT)
    expect(clampUnlocksLeft(999)).toBe(MAX_UNLOCKS_LEFT)
    expect(clampUnlocksLeft(12.9)).toBe(12)
  })
})

describe('clampExerciseAmount', () => {
  it('clamps to 1–500', () => {
    expect(clampExerciseAmount(0)).toBe(1)
    expect(clampExerciseAmount(1000)).toBe(MAX_EXERCISE_AMOUNT)
  })
})

describe('clampSetCount', () => {
  it('cannot exceed total amount or MAX_SET_COUNT', () => {
    expect(clampSetCount(10, 8)).toBe(8)
    expect(clampSetCount(100, 200)).toBe(MAX_SET_COUNT)
    expect(maxSetsForAmount(3)).toBe(3)
  })

  it('allows zero while drafting', () => {
    expect(clampSetCount(0, 20, true)).toBe(0)
  })
})

describe('clampAppDailyLimit / unlock minutes', () => {
  it('clamps app daily limit 5–180', () => {
    expect(clampAppDailyLimit(1)).toBe(5)
    expect(clampAppDailyLimit(999)).toBe(180)
  })

  it('clamps unlock minutes with optional balance cap', () => {
    expect(clampUnlockMinutes(0)).toBe(1)
    expect(clampUnlockMinutes(900)).toBe(500)
    expect(clampUnlockMinutes(40, 25)).toBe(25)
  })
})
