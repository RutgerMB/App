import { describe, expect, it } from 'vitest'
import {
  clampStreakResetTokens,
  consumeStreakResetToken,
  refillStreakResetTokensIfNeeded,
  STREAK_RESET_TOKENS_MAX,
} from '../streak-tokens'
import { reconcileStreak, restoredStreakState, updateStreak } from '../streaks'

describe('streak reset tokens', () => {
  it('never goes below 0 or above max', () => {
    expect(clampStreakResetTokens(-3)).toBe(0)
    expect(clampStreakResetTokens(99)).toBe(STREAK_RESET_TOKENS_MAX)
    expect(consumeStreakResetToken(1)).toBe(0)
    expect(consumeStreakResetToken(0)).toBe(0)
  })

  it('refills Pro tokens when the local month changes', () => {
    const result = refillStreakResetTokensIfNeeded({
      isPro: true,
      tokens: 1,
      tokensMonth: '2026-06',
      today: '2026-07-01',
    })
    expect(result).toEqual({
      tokens: STREAK_RESET_TOKENS_MAX,
      tokensMonth: '2026-07',
      refilled: true,
    })
  })

  it('does not refill free users on month change', () => {
    const result = refillStreakResetTokensIfNeeded({
      isPro: false,
      tokens: 0,
      tokensMonth: '2026-06',
      today: '2026-07-01',
    })
    expect(result.tokens).toBe(0)
    expect(result.refilled).toBe(false)
  })

  it('keeps Pro tokens within the same month', () => {
    const result = refillStreakResetTokensIfNeeded({
      isPro: true,
      tokens: 3,
      tokensMonth: '2026-07',
      today: '2026-07-18',
    })
    expect(result).toEqual({ tokens: 3, tokensMonth: '2026-07', refilled: false })
  })
})

describe('streak restore', () => {
  const today = '2026-07-14'

  it('records lost streak when reconcile breaks a streak > 1', () => {
    expect(reconcileStreak('2026-07-12', 9, 12, today)).toEqual({
      streak: 0,
      longest: 12,
      justLostStreak: 9,
    })
  })

  it('does not flag restore for streak of 1', () => {
    expect(reconcileStreak('2026-07-12', 1, 5, today).justLostStreak).toBeNull()
  })

  it('restores lastExerciseDate to yesterday', () => {
    expect(restoredStreakState(7, today)).toEqual({
      streak: 7,
      lastExerciseDate: '2026-07-13',
    })
  })

  it('updateStreak reports lostStreak when resetting after a gap', () => {
    expect(updateStreak('2026-07-12', 9, 12, today)).toEqual({
      streak: 1,
      longest: 12,
      lostStreak: 9,
    })
  })
})
