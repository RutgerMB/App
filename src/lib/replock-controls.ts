import { Capacitor, registerPlugin } from '@capacitor/core'

export interface IosSelectedApp {
  id: string
  name: string
  /** True when the user set a nickname (Apple never exposes the real app name to JS). */
  hasCustomName?: boolean
  placeholderName?: string
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
  | {
      ok: false
      authorized: false
      status: string
      reason: 'denied' | 'notDetermined' | 'failed'
      detail?: string
      code?: string
    }

interface RepLockControlsPlugin {
  isSupported(): Promise<{ supported: boolean }>
  checkAuthorization(): Promise<{ authorized: boolean; status: string }>
  requestAuthorization(): Promise<{ authorized: boolean; status: string }>
  presentActivityPicker(): Promise<{ count: number; apps?: IosSelectedApp[] }>
  presentSelectedAppsSheet(): Promise<{ count: number; apps: IosSelectedApp[] }>
  getSelectedApps(): Promise<{ apps: IosSelectedApp[] }>
  setDisplayNames(options: { names: Record<string, string> }): Promise<{ ok: boolean }>
  applyRules(options: { rules: IosBlockerRule[] }): Promise<{ ok: boolean }>
  clearShields(): Promise<{ ok: boolean }>
  getDailyScreenTimeHours(options?: {
    force?: boolean
  }): Promise<{
    hours: number
    minutes: number
    totalMinutes?: number
    hoursWhole?: number
    day?: string
    updatedAt?: number
    source?: string
  }>
}

const RepLockControlsNative = registerPlugin<RepLockControlsPlugin>('RepLockControls')

function pluginErrorMeta(err: unknown): { message: string; code: string } {
  const anyErr = err as { message?: string; code?: string; errorMessage?: string }
  const message =
    err instanceof Error
      ? err.message
      : String(anyErr?.message ?? anyErr?.errorMessage ?? err)
  const code = typeof anyErr?.code === 'string' ? anyErr.code : ''
  return { message, code }
}

/** Native normalizes approvedWithDataAccess → "approved"; accept both for safety. */
function isApprovedAuth(authorized: boolean | undefined, status: string | undefined): boolean {
  if (authorized === true) return true
  const s = (status || '').toLowerCase()
  return s === 'approved' || s === 'approvedwithdataaccess' || s.includes('approved')
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
    const approved = isApprovedAuth(auth.authorized, auth.status)
    return {
      supported: supported,
      authorized: approved,
      status: approved ? 'approved' : auth.status,
    }
  } catch (err) {
    console.warn('[RepLockControls] checkAuthorization failed', pluginErrorMeta(err))
    return { supported: false, authorized: false, status: 'error' }
  }
}

/** Re-check Family Controls after returning from Settings. */
export async function refreshIosControlsAuthorization(): Promise<IosControlsStatus> {
  return getIosControlsStatus()
}

/**
 * Request Family Controls. Success only when status is actually approved
 * (including approvedWithDataAccess, normalized to approved).
 */
export async function requestIosControlsAuthorizationDetailed(): Promise<IosAuthRequestResult> {
  if (!isIosControlsAvailable()) {
    return { ok: false, authorized: false, status: 'unsupported', reason: 'failed' }
  }
  try {
    const result = await RepLockControlsNative.requestAuthorization()
    const again = await getIosControlsStatus()
    if (isApprovedAuth(again.authorized, again.status) || isApprovedAuth(result.authorized, result.status)) {
      return { ok: true, authorized: true, status: 'approved' }
    }
    const status = again.status || result.status || 'unknown'
    if (status === 'denied') {
      return { ok: false, authorized: false, status, reason: 'denied' }
    }
    if (status === 'notDetermined') {
      return { ok: false, authorized: false, status, reason: 'notDetermined' }
    }
    console.warn('[RepLockControls] auth request resolved without approval', { result, again })
    return {
      ok: false,
      authorized: false,
      status,
      reason: 'failed',
      detail: `native status=${result.status} authorized=${String(result.authorized)}`,
    }
  } catch (err) {
    const { message, code } = pluginErrorMeta(err)
    console.warn('[RepLockControls] auth request rejected', { code, message })

    const again = await getIosControlsStatus()
    if (isApprovedAuth(again.authorized, again.status)) {
      return { ok: true, authorized: true, status: 'approved' }
    }

    if (
      code === 'DENIED' ||
      again.status === 'denied' ||
      /denied/i.test(message)
    ) {
      return {
        ok: false,
        authorized: false,
        status: again.status || 'denied',
        reason: 'denied',
        detail: message,
        code,
      }
    }

    if (
      code === 'CANCELED' ||
      code === 'NOT_DETERMINED' ||
      again.status === 'notDetermined' ||
      /cancel/i.test(message)
    ) {
      return {
        ok: false,
        authorized: false,
        status: 'notDetermined',
        reason: 'notDetermined',
        detail: message,
        code,
      }
    }

    return {
      ok: false,
      authorized: false,
      status: again.status || 'error',
      reason: 'failed',
      detail: message,
      code: code || 'FAILED',
    }
  }
}

export async function requestIosControlsAuthorization(): Promise<boolean> {
  const result = await requestIosControlsAuthorizationDetailed()
  return result.ok && result.authorized
}

export async function presentIosActivityPicker(): Promise<IosSelectedApp[]> {
  if (!isIosControlsAvailable()) return []
  try {
    const result = await RepLockControlsNative.presentActivityPicker()
    if (Array.isArray(result.apps) && result.apps.length > 0) {
      return result.apps
    }
    // Fallback if native build predates apps payload.
    return getIosSelectedApps()
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

/**
 * Native sheet with FamilyControls Label(token) — real name+icon on-device only.
 * Returns nicknames the user typed (still cannot export Apple’s real labels to JS).
 */
export async function presentIosSelectedAppsSheet(): Promise<IosSelectedApp[]> {
  if (!isIosControlsAvailable()) return []
  try {
    const { apps } = await RepLockControlsNative.presentSelectedAppsSheet()
    return apps ?? []
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    if (msg.includes('authorization required')) {
      throw new Error('AUTH_REQUIRED')
    }
    throw err
  }
}

/** Persist user nicknames for opaque ApplicationTokens (App Group). */
export async function setIosDisplayNames(names: Record<string, string>): Promise<void> {
  if (!isIosControlsAvailable()) return
  try {
    await RepLockControlsNative.setDisplayNames({ names })
  } catch {
    // Non-fatal — web store still keeps the rename.
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

/**
 * Today's OS Screen Time from the DeviceActivityReport extension via App Group.
 * Returns null if unauthorized, extension missing, or no report written yet.
 * Onboarding should poll — the first probe after authorize can take several seconds.
 */
export async function fetchIosDailyScreenTimeHours(options?: {
  force?: boolean
}): Promise<{ hours: number; minutes: number; totalMinutes?: number } | null> {
  if (!isIosControlsAvailable()) return null
  try {
    const ready = await isRepLockControlsPluginReady()
    if (!ready) return null
    const status = await getIosControlsStatus()
    if (!status.authorized) return null
    const result = await RepLockControlsNative.getDailyScreenTimeHours(
      options?.force !== false ? { force: true } : undefined
    )
    if (typeof result?.hours !== 'number') return null
    return {
      hours: result.hours,
      minutes: result.minutes ?? 0,
      totalMinutes: result.totalMinutes,
    }
  } catch (err) {
    console.warn('[RepLockControls] getDailyScreenTimeHours failed', pluginErrorMeta(err))
    return null
  }
}

/** Poll the report probe until data appears or attempts are exhausted. */
export async function fetchIosDailyScreenTimeHoursWithRetry(options?: {
  attempts?: number
  delayMs?: number
}): Promise<{ hours: number; minutes: number; totalMinutes?: number } | null> {
  const attempts = options?.attempts ?? 4
  const delayMs = options?.delayMs ?? 1500
  for (let i = 0; i < attempts; i++) {
    const data = await fetchIosDailyScreenTimeHours({ force: true })
    if (data) return data
    if (i < attempts - 1) {
      await new Promise((r) => setTimeout(r, delayMs))
    }
  }
  return null
}
