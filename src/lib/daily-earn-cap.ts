import { DEFAULT_MAX_DAILY_HOURS } from '@/types'

/** Bounds for max daily earn (hours + minutes UX, stored as fractional hours). */
export { DEFAULT_MAX_DAILY_HOURS }
export const MIN_MAX_DAILY_HOURS = 1
export const MAX_MAX_DAILY_HOURS = 12
export const MIN_MAX_DAILY_MINUTES = MIN_MAX_DAILY_HOURS * 60
export const MAX_MAX_DAILY_MINUTES = MAX_MAX_DAILY_HOURS * 60

export function hoursToMinutes(hours: number): number {
  if (!Number.isFinite(hours)) return MIN_MAX_DAILY_MINUTES
  return Math.round(hours * 60)
}

export function minutesToHours(minutes: number): number {
  return minutes / 60
}

export function clampMaxDailyMinutes(minutes: number | null | undefined): number {
  if (minutes == null || !Number.isFinite(minutes)) {
    return hoursToMinutes(DEFAULT_MAX_DAILY_HOURS)
  }
  return Math.min(MAX_MAX_DAILY_MINUTES, Math.max(MIN_MAX_DAILY_MINUTES, Math.round(minutes)))
}

/** Clamp to 1h–12h at 1-minute precision (fractional hours OK). */
export function clampMaxDailyHours(hours: number | null | undefined): number {
  if (hours == null || !Number.isFinite(hours)) return DEFAULT_MAX_DAILY_HOURS
  return minutesToHours(clampMaxDailyMinutes(hoursToMinutes(hours)))
}

export function splitMaxDailyHours(hours: number | null | undefined): { hours: number; minutes: number } {
  const total = clampMaxDailyMinutes(hoursToMinutes(hours ?? DEFAULT_MAX_DAILY_HOURS))
  return { hours: Math.floor(total / 60), minutes: total % 60 }
}

export function combineMaxDailyHours(hours: number, minutes: number): number {
  const h = Number.isFinite(hours) ? Math.max(0, Math.floor(hours)) : 0
  const m = Number.isFinite(minutes) ? Math.max(0, Math.floor(minutes)) : 0
  return minutesToHours(clampMaxDailyMinutes(h * 60 + m))
}

export function dailyEarnCapMinutes(maxDailyHours: number | null | undefined): number {
  return clampMaxDailyMinutes(hoursToMinutes(maxDailyHours ?? DEFAULT_MAX_DAILY_HOURS))
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
