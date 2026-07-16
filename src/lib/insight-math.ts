/** Shared onboarding insight math — all values derive from the user's daily hours. */

export const INSIGHT_HORIZON_YEARS = 30

/** Average rep tempo during a RepLock workout (push-ups, squats, etc.). */
const REPS_PER_ACTIVE_MINUTE = 15

/**
 * Product goal: gate distracting apps behind workouts and cut daily screen time
 * by this fraction of the user's baseline (guess or measured).
 */
export const REPLOCK_TARGET_REDUCTION = 0.55

/** Default first-goal unlock budget used in onboarding projections. */
export const DEFAULT_DAILY_OPENINGS = 3
export const DEFAULT_MINUTES_PER_OPENING = 5

export interface LifetimeScrollStats {
  dailyHours: number
  /** Calendar years of 24h days equivalent to lifetime scroll at this daily rate. */
  yearsOnPhone: number
  /** Reps if the same minutes were spent training instead of scrolling. */
  repsIfTrainedInstead: number
  totalScrollHours: number
}

export function computeLifetimeScrollStats(dailyHours: number): LifetimeScrollStats {
  const hours = Math.max(0.25, dailyHours)
  const totalScrollHours = hours * 365 * INSIGHT_HORIZON_YEARS
  const yearsOnPhone = Math.round(((hours * INSIGHT_HORIZON_YEARS) / 24) * 10) / 10
  const totalActiveMinutes = hours * 60 * 365 * INSIGHT_HORIZON_YEARS
  const repsIfTrainedInstead = Math.round(totalActiveMinutes * REPS_PER_ACTIVE_MINUTE)

  return {
    dailyHours: hours,
    yearsOnPhone,
    repsIfTrainedInstead,
    totalScrollHours,
  }
}

export interface WithRepLockProjection {
  baselineHours: number
  withRepLockHours: number
  reductionPct: number
  /** Hours unlocked per day via the default openings × minutes model. */
  earnedAllowanceHours: number
  earnedAllowanceMinutes: number
  targetReduction: number
}

/**
 * Project daily screen time with RepLock.
 *
 * Formula:
 *   earnedAllowanceHours = openings × minutesPerOpening / 60
 *   withRepLockHours = max(earnedAllowanceHours, baseline × (1 − targetReduction))
 *
 * Default targetReduction = 55% (product goal). Floor is the daily unlock budget
 * so the projection stays consistent with the openings/minutes earn model.
 * Never invents identical "before/after" numbers.
 */
export function computeWithRepLockProjection(
  baselineHours: number,
  options?: {
    openings?: number
    minutesPerOpening?: number
    targetReduction?: number
  }
): WithRepLockProjection {
  const openings = options?.openings ?? DEFAULT_DAILY_OPENINGS
  const minutesPerOpening = options?.minutesPerOpening ?? DEFAULT_MINUTES_PER_OPENING
  const targetReduction = options?.targetReduction ?? REPLOCK_TARGET_REDUCTION
  const baseline = Math.max(0.25, baselineHours)
  const earnedAllowanceMinutes = openings * minutesPerOpening
  const earnedAllowanceHours = earnedAllowanceMinutes / 60
  const reduced = baseline * (1 - targetReduction)
  // Round to the nearest minute so the earn-model floor stays exact (e.g. 15m).
  const withRepLockHours =
    Math.round(Math.max(earnedAllowanceHours, reduced) * 60) / 60
  const reductionPct = Math.max(
    0,
    Math.round(((baseline - withRepLockHours) / baseline) * 100)
  )

  return {
    baselineHours: Math.round(baseline * 10) / 10,
    withRepLockHours: Math.round(withRepLockHours * 100) / 100,
    reductionPct,
    earnedAllowanceHours: Math.round(earnedAllowanceHours * 100) / 100,
    earnedAllowanceMinutes,
    targetReduction,
  }
}

/** Compact display for large rep counts (e.g. 1.2M, 84K). */
export function formatInsightCount(value: number): string {
  if (value >= 1_000_000) {
    const millions = Math.round((value / 1_000_000) * 10) / 10
    return `${millions.toLocaleString()}M`
  }
  if (value >= 10_000) {
    return `${Math.round(value / 1000).toLocaleString()}K`
  }
  return value.toLocaleString()
}
