import { describe, expect, it } from 'vitest'
import {
  applyDailyEarnCap,
  clampMaxDailyHours,
  dailyEarnCapMinutes,
  earnedMinutesTodayFor,
  DEFAULT_MAX_DAILY_HOURS,
  MIN_MAX_DAILY_HOURS,
  MAX_MAX_DAILY_HOURS,
} from '../daily-earn-cap'
import {
  aggregateByAppForPeriod,
  buildUsageByApp,
  upsertUsageDay,
} from '../usage-history'
import type { LockedApp, UsageDayRecord } from '@/types'

describe('clampMaxDailyHours', () => {
  it('defaults invalid values', () => {
    expect(clampMaxDailyHours(undefined)).toBe(DEFAULT_MAX_DAILY_HOURS)
    expect(clampMaxDailyHours(NaN)).toBe(DEFAULT_MAX_DAILY_HOURS)
  })

  it('clamps to 1–12 integer hours', () => {
    expect(clampMaxDailyHours(0)).toBe(MIN_MAX_DAILY_HOURS)
    expect(clampMaxDailyHours(99)).toBe(MAX_MAX_DAILY_HOURS)
    expect(clampMaxDailyHours(3.7)).toBe(4)
  })
})

describe('applyDailyEarnCap', () => {
  it('credits full amount when under cap', () => {
    const result = applyDailyEarnCap({
      rawEarned: 30,
      earnedMinutesToday: 10,
      earnedDate: '2026-07-18',
      today: '2026-07-18',
      maxDailyHours: 4,
    })
    expect(result.applied).toBe(30)
    expect(result.earnedMinutesToday).toBe(40)
    expect(result.remaining).toBe(dailyEarnCapMinutes(4) - 40)
  })

  it('truncates when near daily cap', () => {
    const result = applyDailyEarnCap({
      rawEarned: 50,
      earnedMinutesToday: 230,
      earnedDate: '2026-07-18',
      today: '2026-07-18',
      maxDailyHours: 4,
    })
    expect(result.applied).toBe(10)
    expect(result.earnedMinutesToday).toBe(240)
    expect(result.remaining).toBe(0)
  })

  it('resets counter on a new calendar day', () => {
    const result = applyDailyEarnCap({
      rawEarned: 20,
      earnedMinutesToday: 240,
      earnedDate: '2026-07-17',
      today: '2026-07-18',
      maxDailyHours: 4,
    })
    expect(earnedMinutesTodayFor(240, '2026-07-17', '2026-07-18')).toBe(0)
    expect(result.applied).toBe(20)
    expect(result.earnedMinutesToday).toBe(20)
    expect(result.earnedDate).toBe('2026-07-18')
  })

  it('applies zero once cap is reached', () => {
    const result = applyDailyEarnCap({
      rawEarned: 15,
      earnedMinutesToday: 240,
      earnedDate: '2026-07-18',
      today: '2026-07-18',
      maxDailyHours: 4,
    })
    expect(result.applied).toBe(0)
    expect(result.earnedMinutesToday).toBe(240)
  })
})

describe('usage byApp aggregation', () => {
  const apps: LockedApp[] = [
    {
      id: 'ig',
      name: 'Instagram',
      icon: '',
      color: '#E1306C',
      dailyLimitMinutes: 30,
      usedMinutes: 12,
      isLocked: true,
      unlockedUntil: null,
    },
    {
      id: 'tt',
      name: 'TikTok',
      icon: '',
      color: '#000',
      dailyLimitMinutes: 30,
      usedMinutes: 8,
      isLocked: true,
      unlockedUntil: null,
    },
  ]

  it('builds per-app rows from live apps', () => {
    expect(buildUsageByApp(apps)).toEqual([
      { id: 'ig', name: 'Instagram', color: '#E1306C', unlockedMinutes: 12 },
      { id: 'tt', name: 'TikTok', color: '#000', unlockedMinutes: 8 },
    ])
  })

  it('sums per-app minutes across a week', () => {
    let history: UsageDayRecord[] = []
    history = upsertUsageDay(history, '2026-07-16', 10, 1, [
      { id: 'ig', name: 'Instagram', color: '#E1306C', unlockedMinutes: 10 },
    ])
    history = upsertUsageDay(history, '2026-07-18', 20, 2, [
      { id: 'ig', name: 'Instagram', color: '#E1306C', unlockedMinutes: 12 },
      { id: 'tt', name: 'TikTok', color: '#000', unlockedMinutes: 8 },
    ])
    const rows = aggregateByAppForPeriod(history, 'week', '2026-07-18')
    expect(rows.find((r) => r.id === 'ig')?.unlockedMinutes).toBe(22)
    expect(rows.find((r) => r.id === 'tt')?.unlockedMinutes).toBe(8)
  })
})
