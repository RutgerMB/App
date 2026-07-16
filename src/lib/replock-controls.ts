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

export type IosAuthRequestResult =
  | { ok: true; authorized: true; status: string }
  | { ok: false; authorized: false; status: string; reason: 'denied' | 'notDetermined' | 'failed' }

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

function pluginErrorMeta(err: unknown): { message: string; code: string } {
  const anyErr = err as { message?: string; code?: string }
  const message = err instanceof Error ? err.message : String(anyErr?.message ?? err)
  const code = typeof anyErr?.code === 'string' ? anyErr.code : ''
  return { message, code }
}

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
      authorized: auth.authorized === true || auth.status === 'approved',
      status: auth.status,
    }
  } catch {
    return { supported: false, authorized: false, status: 'error' }
  }
}

/** Re-check Family Controls after returning from Settings. */
export async function refreshIosControlsAuthorization(): Promise<IosControlsStatus> {
  return getIosControlsStatus()
}

/**
 * Request Family Controls. Apple: non-throwing request = user allowed.
 * Never map `notDetermined` / lag to "denied".
 */
export async function requestIosControlsAuthorizationDetailed(): Promise<IosAuthRequestResult> {
  if (!isIosControlsAvailable()) {
    return { ok: false, authorized: false, status: 'unsupported', reason: 'failed' }
  }
  try {
    const result = await RepLockControlsNative.requestAuthorization()
    const status = result.status || (result.authorized ? 'approved' : 'unknown')
    // Native reports authorized after a successful (non-throwing) request even if
    // AuthorizationCenter briefly lags on `.notDetermined`.
    if (result.authorized || status === 'approved') {
      return { ok: true, authorized: true, status: status === 'notDetermined' ? 'approved' : status }
    }
    if (status === 'denied') {
      return { ok: false, authorized: false, status, reason: 'denied' }
    }
    if (status === 'notDetermined') {
      // Stale intermediate — re-check once before treating as failure.
      const again = await getIosControlsStatus()
      if (again.authorized || again.status === 'approved') {
        return { ok: true, authorized: true, status: 'approved' }
      }
      return { ok: false, authorized: false, status: again.status, reason: 'notDetermined' }
    }
    return { ok: false, authorized: false, status, reason: 'failed' }
  } catch (err) {
    const { message, code } = pluginErrorMeta(err)
    // User may have allowed in Settings while the dialog errored — refresh.
    const again = await getIosControlsStatus()
    if (again.authorized || again.status === 'approved') {
      return { ok: true, authorized: true, status: 'approved' }
    }
    if (code === 'DENIED' || again.status === 'denied' || /denied/i.test(message)) {
      return { ok: false, authorized: false, status: again.status || 'denied', reason: 'denied' }
    }
    if (code === 'NOT_DETERMINED' || again.status === 'notDetermined') {
      return { ok: false, authorized: false, status: 'notDetermined', reason: 'notDetermined' }
    }
    return { ok: false, authorized: false, status: again.status || 'error', reason: 'failed' }
  }
}

export async function requestIosControlsAuthorization(): Promise<boolean> {
  const result = await requestIosControlsAuthorizationDetailed()
  return result.ok && result.authorized
}

export async function presentIosActivityPicker(): Promise<number> {
  if (!isIosControlsAvailable()) return 0
  try {
    const { count } = await RepLockControlsNative.presentActivityPicker()
    return count
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    if (msg.includes('not implemented')) {
      throw new Error('PLUGIN_NOT_IMPLEMENTED')
    }
    if (msg.includes('authorization required')) {
      throw new Error('AUTH_REQUIRED')
    }
    throw err
  }
}

export async function isRepLockControlsPluginReady(): Promise<boolean> {
  if (!isIosControlsAvailable()) return false
  try {
    const { supported } = await RepLockControlsNative.isSupported()
    return supported === true
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    // Capacitor web stub / missing native registration
    if (
      /not implemented|plugin is not implemented|UNIMPLEMENTED|"RepLockControls"/i.test(msg) ||
      msg.toLowerCase().includes('not available')
    ) {
      console.warn(
        '[RepLockControls] native plugin not loaded — on Mac run: npm run cap:ios:sync, then rebuild in Xcode'
      )
    }
    return false
  }
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
