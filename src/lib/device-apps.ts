import { registerPlugin, Capacitor } from '@capacitor/core'
import type { DeviceAppDefinition } from '@/data/device-apps'
import { enrichDeviceApp } from '@/data/device-apps'
import {
  getIosSelectedApps,
  isIosControlsAvailable,
  isRepLockControlsPluginReady,
  presentIosActivityPicker,
  requestIosControlsAuthorization,
  getIosControlsStatus,
} from '@/lib/replock-controls'

export type IosPickAppsResult =
  | { ok: true; apps: DeviceAppDefinition[] }
  | { ok: false; reason: 'unsupported' | 'denied' | 'plugin_missing' | 'auth_required' | 'failed' }

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
    color: '#6366F1',
    packageName: app.packageName,
    category: 'other',
  })
}

function mapIosSelectedApp(app: { id: string; name: string }): DeviceAppDefinition {
  return enrichDeviceApp({
    id: app.id,
    name: app.name,
    color: '#6366F1',
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
  await presentIosActivityPicker()
  return getDeviceApps()
}

/** Authorize (if needed) and open Apple's app picker — with explicit error reasons. */
export async function pickIosAppsWithAuth(): Promise<IosPickAppsResult> {
  if (!isNativeIos()) return { ok: false, reason: 'unsupported' }

  const ready = await isRepLockControlsPluginReady()
  if (!ready) return { ok: false, reason: 'plugin_missing' }

  try {
    let status = await getIosControlsStatus()
    if (!status.authorized) {
      const authorized = await requestIosControlsAuthorization()
      if (!authorized) return { ok: false, reason: 'denied' }
      status = await getIosControlsStatus()
      if (!status.authorized) return { ok: false, reason: 'denied' }
    }

    await presentIosActivityPicker()
    const apps = (await getIosSelectedApps()).map(mapIosSelectedApp)
    return { ok: true, apps }
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    if (msg === 'PLUGIN_NOT_IMPLEMENTED') return { ok: false, reason: 'plugin_missing' }
    if (msg === 'AUTH_REQUIRED') return { ok: false, reason: 'auth_required' }
    return { ok: false, reason: 'failed' }
  }
}
