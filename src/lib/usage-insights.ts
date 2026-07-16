import type { LockedApp } from '@/types'
import { fetchBlockAttemptsToday, type BlockAttemptsToday } from '@/lib/app-blocker'
import {
  fetchDailyAppUsage,
  fetchDailyScreenTimeHours,
  getScreenTimePlatform,
  type AppUsageRow,
  type ScreenTimeResult,
} from '@/lib/screen-time'

export type UsageInsightsAvailability =
  | 'android'
  | 'ios_limited'
  | 'web'

export interface UsageAppRow {
  id: string
  name: string
  color: string
  /** OS foreground minutes when available (Android UsageStats). */
  screenMinutes: number | null
  /** Minutes consumed during RepLock unlock sessions today. */
  unlockedMinutes: number
  /** Times the blocker intercepted this app today (Android). */
  blockAttempts: number | null
}

export interface UsageInsightsSnapshot {
  platform: UsageInsightsAvailability
  /** Total device screen time today from OS (Android). Null on iOS/web. */
  totalScreenMinutes: number | null
  screenTimePermissionNeeded: boolean
  apps: UsageAppRow[]
  /** Sum of unlock-session usedMinutes across tracked apps. */
  totalUnlockedMinutes: number
  /** In-app unlock openings today (not OS shield hits). */
  unlockOpeningsToday: number
  /** Android accessibility intercepts today. */
  blockAttempts: BlockAttemptsToday | null
  /** True when OS per-app / total screen time is unavailable on this platform. */
  osUsageUnavailable: boolean
  /** True when blocked-open attempt counting needs a future iOS extension. */
  blockAttemptsUnavailable: boolean
}

function todayKey(): string {
  return new Date().toISOString().slice(0, 10)
}

export async function loadUsageInsights(options: {
  apps: LockedApp[]
  openingsUsedToday?: number
  openingsDate?: string | null
}): Promise<UsageInsightsSnapshot> {
  const platformRaw = getScreenTimePlatform()
  const platform: UsageInsightsAvailability =
    platformRaw === 'android' ? 'android' : platformRaw === 'ios' ? 'ios_limited' : 'web'

  const openingsToday =
    options.openingsDate === todayKey() ? (options.openingsUsedToday ?? 0) : 0

  const unlockedRows = options.apps.map((app) => ({
    id: app.id,
    name: app.name,
    color: app.color,
    packageName: app.packageName,
    unlockedMinutes: Math.max(0, Math.round(app.usedMinutes)),
  }))

  const totalUnlockedMinutes = unlockedRows.reduce((sum, a) => sum + a.unlockedMinutes, 0)

  if (platform !== 'android') {
    return {
      platform,
      totalScreenMinutes: null,
      screenTimePermissionNeeded: false,
      apps: unlockedRows.map((a) => ({
        id: a.id,
        name: a.name,
        color: a.color,
        screenMinutes: null,
        unlockedMinutes: a.unlockedMinutes,
        blockAttempts: null,
      })),
      totalUnlockedMinutes,
      unlockOpeningsToday: openingsToday,
      blockAttempts: null,
      osUsageUnavailable: true,
      blockAttemptsUnavailable: platform === 'ios_limited',
    }
  }

  const packageNames = unlockedRows
    .map((a) => a.packageName)
    .filter((p): p is string => Boolean(p))

  const [total, usage, attempts]: [
    ScreenTimeResult | null,
    AppUsageRow[] | null,
    BlockAttemptsToday | null,
  ] = await Promise.all([
    fetchDailyScreenTimeHours(),
    fetchDailyAppUsage(packageNames.length ? packageNames : undefined),
    fetchBlockAttemptsToday(),
  ])

  const usageByPackage = new Map((usage ?? []).map((u) => [u.packageName, u]))
  const attemptsByPackage = new Map((attempts?.apps ?? []).map((a) => [a.packageName, a.count]))

  const apps: UsageAppRow[] = unlockedRows.map((a) => {
    const pkg = a.packageName
    const os = pkg ? usageByPackage.get(pkg) : undefined
    return {
      id: a.id,
      name: a.name,
      color: a.color,
      screenMinutes: os ? Math.round(os.minutes) : pkg ? 0 : null,
      unlockedMinutes: a.unlockedMinutes,
      blockAttempts: pkg ? (attemptsByPackage.get(pkg) ?? 0) : null,
    }
  })

  // Include blocked apps that aren't in the store list but were intercepted today
  if (attempts?.apps?.length) {
    const knownPackages = new Set(
      unlockedRows.map((a) => a.packageName).filter((p): p is string => Boolean(p))
    )
    for (const row of attempts.apps) {
      if (knownPackages.has(row.packageName)) continue
      apps.push({
        id: `pkg:${row.packageName}`,
        name: row.label || row.packageName,
        color: '#5E6AD2',
        screenMinutes: usageByPackage.has(row.packageName)
          ? Math.round(usageByPackage.get(row.packageName)!.minutes)
          : null,
        unlockedMinutes: 0,
        blockAttempts: row.count,
      })
    }
  }

  apps.sort((a, b) => {
    const aScore = (a.screenMinutes ?? 0) + a.unlockedMinutes + (a.blockAttempts ?? 0) * 5
    const bScore = (b.screenMinutes ?? 0) + b.unlockedMinutes + (b.blockAttempts ?? 0) * 5
    return bScore - aScore
  })

  return {
    platform,
    totalScreenMinutes: total ? Math.round(total.minutes) : null,
    screenTimePermissionNeeded: total == null,
    apps,
    totalUnlockedMinutes,
    unlockOpeningsToday: openingsToday,
    blockAttempts: attempts,
    osUsageUnavailable: total == null,
    blockAttemptsUnavailable: false,
  }
}
