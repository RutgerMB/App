import type { AppState, LockedApp, UsageDayRecord, UserProfile } from '@/types'
import { localDateString, offsetLocalDateString } from '@/lib/dates'

export type UsagePeriod = 'day' | 'week' | 'month'

const HISTORY_LIMIT = 90

export function sumUnlockedMinutes(apps: LockedApp[]): number {
  return apps.reduce((sum, a) => sum + Math.max(0, Math.round(a.usedMinutes)), 0)
}

export function upsertUsageDay(
  history: UsageDayRecord[] | undefined,
  date: string,
  unlockedMinutes: number,
  unlockOpenings: number
): UsageDayRecord[] {
  const next = [...(history ?? [])]
  const idx = next.findIndex((r) => r.date === date)
  const row: UsageDayRecord = {
    date,
    unlockedMinutes: Math.max(0, Math.round(unlockedMinutes)),
    unlockOpenings: Math.max(0, Math.round(unlockOpenings)),
  }
  if (idx >= 0) next[idx] = row
  else next.push(row)
  next.sort((a, b) => (a.date < b.date ? -1 : a.date > b.date ? 1 : 0))
  return next.slice(-HISTORY_LIMIT)
}

/** Archive previous calendar day into history and reset per-app used minutes when the day rolls. */
export function applyUsageDayBoundary(state: {
  profile: UserProfile
  apps: LockedApp[]
  usageHistory?: UsageDayRecord[]
}): {
  profile: UserProfile
  apps: LockedApp[]
  usageHistory: UsageDayRecord[]
  rolled: boolean
} {
  const today = localDateString()
  const openingsDate = state.profile.openingsDate ?? null
  let history = state.usageHistory ?? []
  let apps = state.apps
  let profile = state.profile
  let rolled = false

  if (openingsDate && openingsDate !== today) {
    history = upsertUsageDay(
      history,
      openingsDate,
      sumUnlockedMinutes(apps),
      profile.openingsUsedToday ?? 0
    )
    apps = apps.map((a) => ({
      ...a,
      usedMinutes: 0,
      isLocked: true,
      unlockedUntil: null,
      unlockedAt: null,
      usedMinutesAtUnlock: null,
    }))
    profile = {
      ...profile,
      openingsUsedToday: 0,
      openingsDate: today,
    }
    rolled = true
  }

  // Keep today's snapshot fresh for period views.
  const openingsToday =
    profile.openingsDate === today ? (profile.openingsUsedToday ?? 0) : 0
  history = upsertUsageDay(history, today, sumUnlockedMinutes(apps), openingsToday)

  return { profile, apps, usageHistory: history, rolled }
}

export function sumUsagePeriod(
  history: UsageDayRecord[] | undefined,
  period: UsagePeriod,
  today: string = localDateString()
): { unlockedMinutes: number; unlockOpenings: number; days: number } {
  const rows = history ?? []
  let from = today
  if (period === 'week') from = offsetLocalDateString(-6)
  if (period === 'month') from = offsetLocalDateString(-29)

  const matched = rows.filter((r) => r.date >= from && r.date <= today)
  return {
    unlockedMinutes: matched.reduce((s, r) => s + r.unlockedMinutes, 0),
    unlockOpenings: matched.reduce((s, r) => s + r.unlockOpenings, 0),
    days: matched.length,
  }
}

export function syncUsageHistoryIntoState(state: AppState): Partial<AppState> {
  const { profile, apps, usageHistory, rolled } = applyUsageDayBoundary(state)
  if (
    !rolled &&
    profile === state.profile &&
    apps === state.apps &&
    JSON.stringify(usageHistory) === JSON.stringify(state.usageHistory ?? [])
  ) {
    return {}
  }
  return { profile, apps, usageHistory }
}
