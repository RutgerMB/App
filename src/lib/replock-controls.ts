import { Capacitor, registerPlugin } from '@capacitor/core'

export interface IosSelectedApp {
  id: string
  name: string
}

export interface IosBlockerRule {
  tokenId: string
  blocked: boolean
  unlockedUntil: number
}

export interface IosControlsStatus {
  supported: boolean
  authorized: boolean
  status: string
}

interface RepLockControlsPlugin {
  isSupported(): Promise<{ supported: boolean }>
  checkAuthorization(): Promise<{ authorized: boolean; status: string }>
  requestAuthorization(): Promise<{ authorized: boolean; status: string }>
  presentActivityPicker(): Promise<{ count: number }>
  getSelectedApps(): Promise<{ apps: IosSelectedApp[] }>
  applyRules(options: { rules: IosBlockerRule[] }): Promise<{ ok: boolean }>
  clearShields(): Promise<{ ok: boolean }>
  getDailyScreenTimeHours(): Promise<{ hours: number; minutes: number }>
}

const RepLockControlsNative = registerPlugin<RepLockControlsPlugin>('RepLockControls')

export function isIosControlsAvailable(): boolean {
  return Capacitor.isNativePlatform() && Capacitor.getPlatform() === 'ios'
}

export async function getIosControlsStatus(): Promise<IosControlsStatus> {
  if (!isIosControlsAvailable()) {
    return { supported: false, authorized: false, status: 'unsupported' }
  }
  try {
    const [{ supported }, auth] = await Promise.all([
      RepLockControlsNative.isSupported(),
      RepLockControlsNative.checkAuthorization(),
    ])
    return {
      supported: supported,
      authorized: auth.authorized,
      status: auth.status,
    }
  } catch {
    return { supported: false, authorized: false, status: 'error' }
  }
}

export async function requestIosControlsAuthorization(): Promise<boolean> {
  if (!isIosControlsAvailable()) return false
  try {
    const { authorized } = await RepLockControlsNative.requestAuthorization()
    return authorized
  } catch {
    return false
  }
}

export async function presentIosActivityPicker(): Promise<number> {
  if (!isIosControlsAvailable()) return 0
  const { count } = await RepLockControlsNative.presentActivityPicker()
  return count
}

export async function getIosSelectedApps(): Promise<IosSelectedApp[]> {
  if (!isIosControlsAvailable()) return []
  try {
    const { apps } = await RepLockControlsNative.getSelectedApps()
    return apps ?? []
  } catch {
    return []
  }
}

export async function syncIosBlockingRules(rules: IosBlockerRule[]): Promise<void> {
  if (!isIosControlsAvailable()) return
  const status = await getIosControlsStatus()
  if (!status.authorized) return
  await RepLockControlsNative.applyRules({ rules })
}

export async function clearIosShields(): Promise<void> {
  if (!isIosControlsAvailable()) return
  await RepLockControlsNative.clearShields()
}
