import { Capacitor, registerPlugin } from '@capacitor/core'
import { getIosControlsStatus, isIosControlsAvailable } from '@/lib/replock-controls'

export interface ScreenTimeResult {
  hours: number
  minutes: number
}

interface ScreenTimePlugin {
  checkPermission(): Promise<{ granted: boolean }>
  requestPermission(): Promise<void>
  getDailyScreenTimeHours(): Promise<ScreenTimeResult>
}

const ScreenTimeNative = registerPlugin<ScreenTimePlugin>('ScreenTime', {
  web: () => ({
    checkPermission: async () => ({ granted: false }),
    requestPermission: async () => {},
    getDailyScreenTimeHours: async () => {
      throw new Error('unavailable')
    },
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
    const { requestIosControlsAuthorization } = await import('@/lib/replock-controls')
    await requestIosControlsAuthorization()
    return
  }

  if (getScreenTimePlatform() !== 'android') return
  await ScreenTimeNative.requestPermission()
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
