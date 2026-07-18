/** YYYY-MM-DD in the user's local timezone (en-CA locale formats as ISO date). */
export function localDateString(date: Date = new Date()): string {
  return date.toLocaleDateString('en-CA')
}

/** Add calendar days in local time and return YYYY-MM-DD. */
export function offsetLocalDateString(days: number, from: Date = new Date()): string {
  const d = new Date(from)
  d.setDate(d.getDate() + days)
  return localDateString(d)
}

/** Parse a YYYY-MM-DD string as local midnight. */
export function parseLocalDateString(dateStr: string): Date {
  const [year, month, day] = dateStr.split('-').map(Number)
  return new Date(year, month - 1, day)
}

/**
 * When the real "current" month advances, keep browsing history intact:
 * only follow forward if the user was still on the previous current month.
 */
export function reconcileCalendarMonthKey(
  viewMonthKey: string,
  previousCurrentMonthKey: string,
  currentMonthKey: string,
): string {
  if (currentMonthKey === previousCurrentMonthKey) return viewMonthKey
  if (viewMonthKey === previousCurrentMonthKey) return currentMonthKey
  return viewMonthKey
}

/** Milliseconds until the next local midnight (at least 1ms). */
export function msUntilNextLocalMidnight(now: Date = new Date()): number {
  const next = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1)
  return Math.max(1, next.getTime() - now.getTime())
}
