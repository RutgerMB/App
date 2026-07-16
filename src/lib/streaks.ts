import { localDateString, offsetLocalDateString, parseLocalDateString } from '@/lib/dates'

export function updateStreak(
  lastDate: string | null,
  currentStreak: number,
  longestStreak: number,
  today: string = localDateString(),
): { streak: number; longest: number } {
  if (lastDate === today) {
    return { streak: currentStreak, longest: longestStreak }
  }

  const yesterdayStr = offsetLocalDateString(-1, parseLocalDateString(today))

  if (lastDate === yesterdayStr) {
    const newStreak = currentStreak + 1
    return { streak: newStreak, longest: Math.max(longestStreak, newStreak) }
  }

  return { streak: 1, longest: Math.max(longestStreak, 1) }
}

/**
 * Display reconcile: if the user skipped at least one calendar day since lastExerciseDate,
 * show streak 0 until they complete an exercise today (updateStreak then starts at 1).
 */
export function reconcileStreak(
  lastDate: string | null,
  currentStreak: number,
  longestStreak: number,
  today: string = localDateString(),
): { streak: number; longest: number } {
  if (!lastDate) {
    return { streak: 0, longest: longestStreak }
  }

  if (lastDate === today) {
    return { streak: currentStreak, longest: longestStreak }
  }

  const yesterdayStr = offsetLocalDateString(-1, parseLocalDateString(today))
  if (lastDate === yesterdayStr) {
    return { streak: currentStreak, longest: longestStreak }
  }

  return { streak: 0, longest: longestStreak }
}
