import { Capacitor, registerPlugin } from '@capacitor/core'
import {
  getIosControlsStatus,
  isIosControlsAvailable,
  isRepLockControlsPluginReady,
  requestIosControlsAuthorizationDetailed,
  refreshIosControlsAuthorization,
} from '@/lib/replock-controls'

export type IosScreenTimeAuthResult =
  | { ok: true; authorized: boolean; status: string }
  | {
      ok: false
      reason: 'unsupported' | 'plugin_missing' | 'denied' | 'notDetermined' | 'failed'
      status?: string
    }

export interface ScreenTimeResult {
  hours: number
  minutes: number
}

export interface AppUsageRow {
  packageName: string
  label: string
  minutes: number
}

interface ScreenTimePlugin {
  checkPermission(): Promise<{ granted: boolean }>
  requestPermission(): Promise<void>
  getDailyScreenTimeHours(): Promise<ScreenTimeResult>
  getDailyAppUsage(options?: { packageNames?: string[] }): Promise<{ apps: AppUsageRow[] }>
}

const ScreenTimeNative = registerPlugin<ScreenTimePlugin>('ScreenTime', {
  web: () => ({
    checkPermission: async () => ({ granted: false }),
    requestPermission: async () => {},
    getDailyScreenTimeHours: async () => {
      throw new Error('unavailable')
    },
    getDailyAppUsage: async () => ({ apps: [] }),
  }),
})

export type ScreenTimePlatform = 'android' | 'ios' | 'web'

export function getScreenTimePlatform(): ScreenTimePlatform {
  if (!Capacitor.isNativePlatform()) return 'web'
  if (Capacitor.getPlatform() === 'ios') return 'ios'
  return 'android'
}

export async function checkScreenTimePermission(): Promise<boolean> {
  if (getScreenTimePlatform() === 'ios') {
    if (!isIosControlsAvailable()) return false
    const status = await getIosControlsStatus()
    return status.authorized
  }

  if (getScreenTimePlatform() !== 'android') return false
  try {
    const { granted } = await ScreenTimeNative.checkPermission()
    return granted
  } catch {
    return false
  }
}

export async function requestScreenTimePermission(): Promise<void> {
  if (getScreenTimePlatform() === 'ios') {
    await requestIosScreenTimeAccess()
    return
  }

  if (getScreenTimePlatform() !== 'android') return
  await ScreenTimeNative.requestPermission()
}

/** iOS Family Controls authorization (blocking + picker — not daily usage totals yet). */
export async function requestIosScreenTimeAccess(): Promise<IosScreenTimeAuthResult> {
  if (!isIosControlsAvailable()) return { ok: false, reason: 'unsupported' }

  const ready = await isRepLockControlsPluginReady()
  if (!ready) return { ok: false, reason: 'plugin_missing' }

  try {
    const result = await requestIosControlsAuthorizationDetailed()
    if (result.ok) {
      return { ok: true, authorized: true, status: result.status }
    }
    if (!result.ok && 'detail' in result && result.detail) {
      console.warn('[ScreenTime] iOS auth failed', {
        reason: result.reason,
        status: result.status,
        code: result.code,
        detail: result.detail,
      })
    }
    // Do not collapse notDetermined into denied — user may still be able to retry.
    return { ok: false, reason: result.reason, status: result.status }
  } catch (err) {
    console.warn('[ScreenTime] iOS auth threw', err)
    return { ok: false, reason: 'failed' }
  }
}

/** Re-check after user returns from Settings → Screen Time. */
export async function refreshIosScreenTimeAccess(): Promise<IosScreenTimeAuthResult> {
  if (!isIosControlsAvailable()) return { ok: false, reason: 'unsupported' }
  const ready = await isRepLockControlsPluginReady()
  if (!ready) return { ok: false, reason: 'plugin_missing' }

  const status = await refreshIosControlsAuthorization()
  if (status.authorized) {
    return { ok: true, authorized: true, status: status.status || 'approved' }
  }
  if (status.status === 'denied') {
    return { ok: false, reason: 'denied', status: status.status }
  }
  if (status.status === 'notDetermined') {
    return { ok: false, reason: 'notDetermined', status: status.status }
  }
  return { ok: false, reason: 'failed', status: status.status }
}

export async function fetchDailyScreenTimeHours(): Promise<ScreenTimeResult | null> {
  if (getScreenTimePlatform() === 'ios') {
    // Phase 3: Device Activity Report extension
    return null
  }

  if (getScreenTimePlatform() !== 'android') return null
  try {
    const granted = await checkScreenTimePermission()
    if (!granted) return null
    return await ScreenTimeNative.getDailyScreenTimeHours()
  } catch {
    return null
  }
}

/** Android UsageStats per-app minutes for today. iOS returns null until DeviceActivityReport. */
export async function fetchDailyAppUsage(
  packageNames?: string[]
): Promise<AppUsageRow[] | null> {
  if (getScreenTimePlatform() !== 'android') return null
  try {
    const granted = await checkScreenTimePermission()
    if (!granted) return null
    const { apps } = await ScreenTimeNative.getDailyAppUsage(
      packageNames?.length ? { packageNames } : undefined
    )
    return apps ?? []
  } catch {
    return null
  }
}
