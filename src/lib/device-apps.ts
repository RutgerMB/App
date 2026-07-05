import { registerPlugin, Capacitor } from '@capacitor/core'
import type { DeviceAppDefinition } from '@/data/device-apps'

export interface NativeInstalledApp {
  packageName: string
  name: string
}

interface InstalledAppsPlugin {
  getInstalled(): Promise<{ apps: NativeInstalledApp[] }>
}

const InstalledAppsNative = registerPlugin<InstalledAppsPlugin>('InstalledApps')

function mapInstalledApp(app: NativeInstalledApp): DeviceAppDefinition {
  return {
    id: app.packageName,
    name: app.name,
    color: '#6366F1',
    packageName: app.packageName,
    category: 'social',
  }
}

/** Android: installed launcher apps. iOS: empty (not allowed by Apple). Web: demo catalog. */
export async function getDeviceApps(): Promise<DeviceAppDefinition[]> {
  if (Capacitor.isNativePlatform() && Capacitor.getPlatform() === 'android') {
    try {
      const { apps } = await InstalledAppsNative.getInstalled()
      return apps.map(mapInstalledApp).sort((a, b) => a.name.localeCompare(b.name))
    } catch {
      return []
    }
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
