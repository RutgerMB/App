/**
 * Light accountability so sessions encourage real effort without being punitive.
 * Timed holds use a hard countdown; rep sets use estimated dwell + confirm.
 */

/** Minimum seconds before a rep set can be confirmed complete. */
export const REP_DWELL_MIN_SECONDS = 5

/** Cap so very large sets don't force an overly long wait. */
export const REP_DWELL_MAX_SECONDS = 60

/** Rough seconds per rep for dwell estimates (~40 rpm). */
export const SECONDS_PER_REP = 1.4

/** Brief pause between sets — user starts the next set when ready. */
export const SET_REST_SECONDS = 5

/**
 * Estimated wall-clock time for a rep set before "I did these" unlocks.
 * Fair floor/ceiling keeps short and long sets reasonable.
 */
export function estimateRepDwellSeconds(reps: number): number {
  const n = Math.max(0, Math.floor(reps))
  if (n <= 0) return REP_DWELL_MIN_SECONDS
  return Math.min(
    REP_DWELL_MAX_SECONDS,
    Math.max(REP_DWELL_MIN_SECONDS, Math.round(n * SECONDS_PER_REP)),
  )
}

export function formatSessionTimer(seconds: number): string {
  const safe = Math.max(0, Math.floor(seconds))
  const m = Math.floor(safe / 60)
  const s = safe % 60
  return `${m}:${s.toString().padStart(2, '0')}`
}
