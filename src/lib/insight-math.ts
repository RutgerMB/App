/** Shared onboarding insight math — all values derive from the user's daily hours. */

export const INSIGHT_HORIZON_YEARS = 30

/** Average rep tempo during a RepLock workout (push-ups, squats, etc.). */
const REPS_PER_ACTIVE_MINUTE = 15

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
