import { localDateString, offsetLocalDateString, parseLocalDateString } from '@/lib/dates'

export function updateStreak(
  lastDate: string | null,
  currentStreak: number,
  longestStreak: number,
  today: string = localDateString(),
): { streak: number; longest: number; lostStreak: number | null } {
  if (lastDate === today) {
    return { streak: currentStreak, longest: longestStreak, lostStreak: null }
  }

  const yesterdayStr = offsetLocalDateString(-1, parseLocalDateString(today))

  if (lastDate === yesterdayStr) {
    const newStreak = currentStreak + 1
    return {
      streak: newStreak,
      longest: Math.max(longestStreak, newStreak),
      lostStreak: null,
    }
  }

  const lostStreak = currentStreak > 1 ? currentStreak : null
  return { streak: 1, longest: Math.max(longestStreak, 1), lostStreak }
}

/**
 * Display reconcile: if the user skipped at least one calendar day since lastExerciseDate,
 * show streak 0 until they complete an exercise today (updateStreak then starts at 1).
 * When a streak > 1 breaks, `justLostStreak` carries the value to restore.
 */
export function reconcileStreak(
  lastDate: string | null,
  currentStreak: number,
  longestStreak: number,
  today: string = localDateString(),
): { streak: number; longest: number; justLostStreak: number | null } {
  if (!lastDate) {
    return { streak: 0, longest: longestStreak, justLostStreak: null }
  }

  if (lastDate === today) {
    return { streak: currentStreak, longest: longestStreak, justLostStreak: null }
  }

  const yesterdayStr = offsetLocalDateString(-1, parseLocalDateString(today))
  if (lastDate === yesterdayStr) {
    return { streak: currentStreak, longest: longestStreak, justLostStreak: null }
  }

  const justLostStreak = currentStreak > 1 ? currentStreak : null
  return { streak: 0, longest: longestStreak, justLostStreak }
}

/** Restore a lost streak: set lastExerciseDate to yesterday so the streak stays active today. */
export function restoredStreakState(
  lostStreak: number,
  today: string = localDateString(),
): { streak: number; lastExerciseDate: string } {
  const safe = Math.max(1, Math.floor(lostStreak))
  return {
    streak: safe,
    lastExerciseDate: offsetLocalDateString(-1, parseLocalDateString(today)),
  }
}
