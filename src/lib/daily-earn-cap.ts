import { DEFAULT_MAX_DAILY_HOURS } from '@/types'

/** Bounds for onboarding max daily earn hours. */
export { DEFAULT_MAX_DAILY_HOURS }
export const MIN_MAX_DAILY_HOURS = 1
export const MAX_MAX_DAILY_HOURS = 12

export function clampMaxDailyHours(hours: number | null | undefined): number {
  if (hours == null || !Number.isFinite(hours)) return DEFAULT_MAX_DAILY_HOURS
  return Math.min(MAX_MAX_DAILY_HOURS, Math.max(MIN_MAX_DAILY_HOURS, Math.round(hours)))
}

export function dailyEarnCapMinutes(maxDailyHours: number | null | undefined): number {
  return clampMaxDailyHours(maxDailyHours) * 60
}

/** Minutes already counted toward today's earn cap (resets when date rolls). */
export function earnedMinutesTodayFor(
  earnedMinutesToday: number | null | undefined,
  earnedDate: string | null | undefined,
  today: string
): number {
  if (earnedDate !== today) return 0
  return Math.max(0, earnedMinutesToday ?? 0)
}

/**
 * Cap exercise rewards so balance can't grow from earning past maxDailyHours * 60
 * minutes earned on the same calendar day. Existing balance is not clamped.
 */
export function applyDailyEarnCap(opts: {
  rawEarned: number
  earnedMinutesToday: number | null | undefined
  earnedDate: string | null | undefined
  today: string
  maxDailyHours: number | null | undefined
}): { applied: number; earnedMinutesToday: number; earnedDate: string; remaining: number } {
  const cap = dailyEarnCapMinutes(opts.maxDailyHours)
  const todayEarned = earnedMinutesTodayFor(opts.earnedMinutesToday, opts.earnedDate, opts.today)
  const remaining = Math.max(0, cap - todayEarned)
  const raw = Math.max(0, opts.rawEarned)
  const applied = Math.min(raw, remaining)
  return {
    applied,
    earnedMinutesToday: todayEarned + applied,
    earnedDate: opts.today,
    remaining: Math.max(0, remaining - applied),
  }
}
