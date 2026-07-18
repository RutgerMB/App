/** Shared clamps for numeric entry surfaces (unlocks, exercises, app limits). */

export const MIN_UNLOCKS_LEFT = 1
export const MAX_UNLOCKS_LEFT = 500

export const MIN_EXERCISE_AMOUNT = 1
export const MAX_EXERCISE_AMOUNT = 500

export const MIN_SET_COUNT = 1
/** Hard ceiling; also capped by total reps/seconds so each set has ≥1 unit. */
export const MAX_SET_COUNT = 50

export const MIN_APP_DAILY_LIMIT = 5
export const MAX_APP_DAILY_LIMIT = 180

export const MIN_UNLOCK_MINUTES = 1
export const MAX_UNLOCK_MINUTES = 500

/** Digits only; empty string when no digits. */
export function digitsOnly(raw: string, maxLen = 6): string {
  return raw.replace(/\D/g, '').slice(0, maxLen)
}

export function parseDigitInt(raw: string): number | null {
  const digits = digitsOnly(raw)
  if (!digits) return null
  const n = Number.parseInt(digits, 10)
  return Number.isFinite(n) ? n : null
}

export function clampInt(value: number, min: number, max: number): number {
  if (!Number.isFinite(value)) return min
  return Math.min(max, Math.max(min, Math.floor(value)))
}

export function clampUnlocksLeft(value: number): number {
  return clampInt(value, MIN_UNLOCKS_LEFT, MAX_UNLOCKS_LEFT)
}

export function clampExerciseAmount(value: number): number {
  return clampInt(value, MIN_EXERCISE_AMOUNT, MAX_EXERCISE_AMOUNT)
}

/**
 * Sets must be ≤ total reps/seconds (each set needs ≥1) and ≤ MAX_SET_COUNT.
 * While drafting, 0 is allowed for empty input.
 */
export function clampSetCount(value: number, totalAmount: number, allowZero = false): number {
  const maxForTotal = Math.max(1, Math.min(MAX_SET_COUNT, Math.floor(totalAmount) || 1))
  if (!Number.isFinite(value)) return allowZero ? 0 : MIN_SET_COUNT
  const floor = Math.floor(value)
  if (allowZero && floor <= 0) return 0
  return clampInt(floor, MIN_SET_COUNT, maxForTotal)
}

export function maxSetsForAmount(totalAmount: number): number {
  return Math.max(1, Math.min(MAX_SET_COUNT, Math.floor(totalAmount) || 1))
}

export function clampAppDailyLimit(value: number): number {
  return clampInt(value, MIN_APP_DAILY_LIMIT, MAX_APP_DAILY_LIMIT)
}

export function clampUnlockMinutes(value: number, balanceCap?: number): number {
  const capped =
    balanceCap != null && Number.isFinite(balanceCap)
      ? Math.min(MAX_UNLOCK_MINUTES, Math.floor(balanceCap))
      : MAX_UNLOCK_MINUTES
  return clampInt(value, MIN_UNLOCK_MINUTES, Math.max(MIN_UNLOCK_MINUTES, capped))
}
