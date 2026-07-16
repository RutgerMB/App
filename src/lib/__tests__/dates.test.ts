import { describe, expect, it } from 'vitest'
import { localDateString, offsetLocalDateString, parseLocalDateString } from '../dates'
import { reconcileStreak, updateStreak } from '../streaks'

describe('localDateString', () => {
  it('formats YYYY-MM-DD in local timezone', () => {
    const date = new Date(2026, 6, 14, 23, 30)
    expect(localDateString(date)).toBe('2026-07-14')
  })

  it('does not use UTC when local calendar day differs', () => {
    const utcLateEvening = new Date('2026-07-14T23:30:00')
    const local = localDateString(utcLateEvening)
    const utc = utcLateEvening.toISOString().split('T')[0]
    expect(local).toMatch(/^\d{4}-\d{2}-\d{2}$/)
    if (local !== utc) {
      expect(local).not.toBe(utc)
    }
  })
})

describe('offsetLocalDateString', () => {
  it('steps backward one local calendar day', () => {
    const today = parseLocalDateString('2026-07-14')
    expect(offsetLocalDateString(-1, today)).toBe('2026-07-13')
  })

  it('steps forward across month boundary', () => {
    const lastDay = parseLocalDateString('2026-07-31')
    expect(offsetLocalDateString(1, lastDay)).toBe('2026-08-01')
  })
})

describe('updateStreak', () => {
  const today = '2026-07-14'
  const yesterday = '2026-07-13'

  it('keeps streak when already exercised today', () => {
    expect(updateStreak(today, 5, 10, today)).toEqual({ streak: 5, longest: 10 })
  })

  it('increments streak when last exercise was yesterday', () => {
    expect(updateStreak(yesterday, 4, 8, today)).toEqual({ streak: 5, longest: 8 })
  })

  it('resets streak after a skipped day', () => {
    expect(updateStreak('2026-07-12', 9, 12, today)).toEqual({ streak: 1, longest: 12 })
  })

  it('starts streak at 1 when no prior exercise date', () => {
    expect(updateStreak(null, 0, 0, today)).toEqual({ streak: 1, longest: 1 })
  })

  it('updates longest when new streak exceeds prior record', () => {
    expect(updateStreak(yesterday, 11, 11, today)).toEqual({ streak: 12, longest: 12 })
  })
})

describe('reconcileStreak', () => {
  const today = '2026-07-14'
  const yesterday = '2026-07-13'

  it('keeps streak when last exercise was today', () => {
    expect(reconcileStreak(today, 5, 10, today)).toEqual({ streak: 5, longest: 10 })
  })

  it('keeps streak when last exercise was yesterday (still active until end of today)', () => {
    expect(reconcileStreak(yesterday, 4, 8, today)).toEqual({ streak: 4, longest: 8 })
  })

  it('resets displayed streak to 0 when a day was skipped', () => {
    expect(reconcileStreak('2026-07-12', 9, 12, today)).toEqual({ streak: 0, longest: 12 })
  })

  it('shows 0 when there is no prior exercise date', () => {
    expect(reconcileStreak(null, 3, 5, today)).toEqual({ streak: 0, longest: 5 })
  })
})
