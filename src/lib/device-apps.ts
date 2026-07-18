import { registerPlugin, Capacitor } from '@capacitor/core'
import type { DeviceAppDefinition } from '@/data/device-apps'
import { enrichDeviceApp } from '@/data/device-apps'
import {
  getIosSelectedApps,
  isIosControlsAvailable,
  isRepLockControlsPluginReady,
  presentIosActivityPicker,
  requestIosControlsAuthorization,
  requestIosControlsAuthorizationDetailed,
  getIosControlsStatus,
} from '@/lib/replock-controls'

export type IosPickAppsResult =
  | { ok: true; apps: DeviceAppDefinition[] }
  | {
      ok: false
      reason: 'unsupported' | 'denied' | 'notDetermined' | 'plugin_missing' | 'auth_required' | 'failed'
    }

export interface NativeInstalledApp {
  packageName: string
  name: string
}

interface InstalledAppsPlugin {
  getInstalled(): Promise<{ apps: NativeInstalledApp[] }>
}

const InstalledAppsNative = registerPlugin<InstalledAppsPlugin>('InstalledApps')

function mapInstalledApp(app: NativeInstalledApp): DeviceAppDefinition {
  return enrichDeviceApp({
    id: app.packageName,
    name: app.name,
    color: '#1B8A5E',
    packageName: app.packageName,
    category: 'other',
  })
}

function mapIosSelectedApp(app: {
  id: string
  name: string
  hasCustomName?: boolean
}): DeviceAppDefinition {
  const raw = (app.name || '').trim()
  const placeholder = /^App \d+$/i.test(raw)
  // Prefer user nickname; keep placeholder only when no custom name was saved.
  const name =
    app.hasCustomName && raw
      ? raw
      : placeholder && !app.hasCustomName
        ? raw || 'App'
        : raw || 'App'
  return enrichDeviceApp({
    id: app.id,
    name,
    color: '#1B8A5E',
    iosTokenId: app.id,
    category: 'other',
  })
}

/** Android: installed launcher apps. iOS: Family Activity picker selection. Web: demo catalog. */
export async function getDeviceApps(): Promise<DeviceAppDefinition[]> {
  if (Capacitor.isNativePlatform() && Capacitor.getPlatform() === 'android') {
    try {
      const { apps } = await InstalledAppsNative.getInstalled()
      return apps.map(mapInstalledApp).sort((a, b) => a.name.localeCompare(b.name))
    } catch {
      return []
    }
  }

  if (isIosControlsAvailable()) {
    const apps = await getIosSelectedApps()
    return apps.map(mapIosSelectedApp)
  }

  if (!Capacitor.isNativePlatform()) {
    const { DEVICE_APPS } = await import('@/data/device-apps')
    return DEVICE_APPS
  }

  return []
}

export function isNativeAndroid(): boolean {
  return Capacitor.isNativePlatform() && Capacitor.getPlatform() === 'android'
}

export function isNativeIos(): boolean {
  return Capacitor.isNativePlatform() && Capacitor.getPlatform() === 'ios'
}

export function canPickInstalledApps(): boolean {
  return isNativeAndroid()
}

export function usesIosActivityPicker(): boolean {
  return isNativeIos()
}

export async function ensureIosAuthorization(): Promise<boolean> {
  if (!isNativeIos()) return false
  return requestIosControlsAuthorization()
}

export async function openIosActivityPicker(): Promise<DeviceAppDefinition[]> {
  if (!isNativeIos()) return []
  const rows = await presentIosActivityPicker()
  return rows.map(mapIosSelectedApp)
}

/** Authorize (if needed) and open Apple's app picker — with explicit error reasons. */
export async function pickIosAppsWithAuth(): Promise<IosPickAppsResult> {
  if (!isNativeIos()) return { ok: false, reason: 'unsupported' }

  const ready = await isRepLockControlsPluginReady()
  if (!ready) return { ok: false, reason: 'plugin_missing' }

  try {
    const status = await getIosControlsStatus()
    if (!status.authorized) {
      const auth = await requestIosControlsAuthorizationDetailed()
      if (!auth.ok || !auth.authorized) {
        if (auth.reason === 'denied') return { ok: false, reason: 'denied' }
        if (auth.reason === 'notDetermined') return { ok: false, reason: 'notDetermined' }
        return { ok: false, reason: 'failed' }
      }
      // Confirm approved before opening the picker (avoids false-positive auth).
      const confirmed = await getIosControlsStatus()
      if (!confirmed.authorized) {
        return { ok: false, reason: confirmed.status === 'denied' ? 'denied' : 'auth_required' }
      }
    }

    const rows = await presentIosActivityPicker()
    const apps = rows.map(mapIosSelectedApp)
    return { ok: true, apps }
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    if (msg === 'PLUGIN_NOT_IMPLEMENTED') return { ok: false, reason: 'plugin_missing' }
    if (msg === 'AUTH_REQUIRED') return { ok: false, reason: 'auth_required' }
    return { ok: false, reason: 'failed' }
  }
}
