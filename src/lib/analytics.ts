import type { ExerciseSession } from '@/types'
import { localDateString, parseLocalDateString } from '@/lib/dates'

export type StatsPeriod = 'week' | 'month' | 'year'

export interface DayStats {
  date: string
  label: string
  earnedMinutes: number
  workoutCount: number
}

function dateKey(d: Date): string {
  return localDateString(d)
}

export function getEarnedForDate(sessions: ExerciseSession[], date: Date): number {
  const key = dateKey(date)
  return sessions
    .filter((s) => dateKey(new Date(s.completedAt)) === key)
    .reduce((sum, s) => sum + s.earnedMinutes, 0)
}

export function getWorkoutCountForDate(sessions: ExerciseSession[], date: Date): number {
  const key = dateKey(date)
  return sessions.filter((s) => dateKey(new Date(s.completedAt)) === key).length
}

export function getTodayVsYesterday(sessions: ExerciseSession[]) {
  const today = new Date()
  const yesterday = new Date()
  yesterday.setDate(yesterday.getDate() - 1)
  const todayEarned = getEarnedForDate(sessions, today)
  const yesterdayEarned = getEarnedForDate(sessions, yesterday)
  const change = todayEarned - yesterdayEarned
  const changePercent =
    yesterdayEarned > 0 ? Math.round((change / yesterdayEarned) * 100) : todayEarned > 0 ? 100 : 0
  return { today: todayEarned, yesterday: yesterdayEarned, change, changePercent }
}

function aggregateWeekly(daily: DayStats[]): DayStats[] {
  const weeks: DayStats[] = []
  for (let i = 0; i < daily.length; i += 7) {
    const chunk = daily.slice(i, i + 7)
    if (!chunk.length) continue
    weeks.push({
      date: chunk[0].date,
      label: `W${weeks.length + 1}`,
      earnedMinutes: chunk.reduce((s, d) => s + d.earnedMinutes, 0),
      workoutCount: chunk.reduce((s, d) => s + d.workoutCount, 0),
    })
  }
  return weeks
}

function monthShortLabel(monthKey: string, locale?: string): string {
  const d = parseLocalDateString(`${monthKey}-01`)
  return d.toLocaleDateString(locale || undefined, { month: 'short' })
}

function aggregateMonthly(daily: DayStats[]): DayStats[] {
  const monthly = new Map<string, DayStats>()
  for (const day of daily) {
    const monthKey = day.date.slice(0, 7)
    const existing = monthly.get(monthKey)
    if (existing) {
      existing.earnedMinutes += day.earnedMinutes
      existing.workoutCount += day.workoutCount
    } else {
      monthly.set(monthKey, {
        date: monthKey,
        label: monthShortLabel(monthKey),
        earnedMinutes: day.earnedMinutes,
        workoutCount: day.workoutCount,
      })
    }
  }
  return Array.from(monthly.values()).slice(-12)
}

export function getPeriodStats(sessions: ExerciseSession[], period: StatsPeriod): DayStats[] {
  const now = new Date()
  const days = period === 'week' ? 7 : period === 'month' ? 30 : 365
  const daily: DayStats[] = []

  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(now)
    d.setDate(d.getDate() - i)
    daily.push({
      date: dateKey(d),
      label: d.toLocaleDateString([], {
        weekday: period === 'week' ? 'short' : undefined,
        day: 'numeric',
        month: period === 'month' ? 'short' : undefined,
      }),
      earnedMinutes: getEarnedForDate(sessions, d),
      workoutCount: getWorkoutCountForDate(sessions, d),
    })
  }

  if (period === 'week') return daily
  if (period === 'month') return aggregateWeekly(daily)
  return aggregateMonthly(daily)
}

export function getPeriodTotals(stats: DayStats[]) {
  const fallback: DayStats = { earnedMinutes: 0, label: '-', date: '', workoutCount: 0 }
  if (!stats.length) {
    return { totalEarned: 0, totalWorkouts: 0, avgDaily: 0, bestDay: fallback }
  }
  return {
    totalEarned: stats.reduce((s, d) => s + d.earnedMinutes, 0),
    totalWorkouts: stats.reduce((s, d) => s + d.workoutCount, 0),
    avgDaily: stats.reduce((s, d) => s + d.earnedMinutes, 0) / stats.length,
    bestDay: stats.reduce((best, d) => (d.earnedMinutes > best.earnedMinutes ? d : best), stats[0]),
  }
}

export function getCategoryBreakdown(
  sessions: ExerciseSession[],
  getCategory: (type: string) => string
): { category: string; minutes: number }[] {
  const map = new Map<string, number>()
  for (const s of sessions) {
    const cat = getCategory(s.type)
    map.set(cat, (map.get(cat) ?? 0) + s.earnedMinutes)
  }
  return Array.from(map.entries())
    .map(([category, minutes]) => ({ category, minutes }))
    .sort((a, b) => b.minutes - a.minutes)
}

/** Activity score for heatmap: combines workout count + minutes earned. */
export function dayActivityScore(workoutCount: number, earnedMinutes: number): number {
  return Math.max(0, workoutCount) * 10 + Math.max(0, earnedMinutes)
}

/** Map score → 0–4 intensity levels (GitHub-style). */
export function activityIntensityLevel(score: number, maxScore: number): 0 | 1 | 2 | 3 | 4 {
  if (score <= 0 || maxScore <= 0) return 0
  const ratio = score / maxScore
  if (ratio <= 0.2) return 1
  if (ratio <= 0.4) return 2
  if (ratio <= 0.7) return 3
  return 4
}

/** Jade green intensity scale for contribution heatmap. */
export const HEATMAP_JADE_LEVELS = [
  'rgba(27,138,94,0.08)',
  'rgba(27,138,94,0.28)',
  'rgba(27,138,94,0.48)',
  'rgba(27,138,94,0.72)',
  '#1B8A5E',
] as const
