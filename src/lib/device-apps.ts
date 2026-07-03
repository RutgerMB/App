import { registerPlugin } from '@capacitor/core'
import { Capacitor } from '@capacitor/core'
import { DEVICE_APPS, type DeviceAppDefinition } from '@/data/device-apps'

export interface NativeInstalledApp {
  packageName: string
  name: string
}

interface InstalledAppsPlugin {
  getInstalled(): Promise<{ apps: NativeInstalledApp[] }>
}

const InstalledAppsNative = registerPlugin<InstalledAppsPlugin>('InstalledApps')

export async function getDeviceApps(): Promise<DeviceAppDefinition[]> {
  if (!Capacitor.isNativePlatform() || Capacitor.getPlatform() !== 'android') {
    return DEVICE_APPS
  }

  try {
    const { apps } = await InstalledAppsNative.getInstalled()
    const installedPackages = new Set(apps.map((a) => a.packageName))

    const matched = DEVICE_APPS.filter(
      (app) => app.packageName && installedPackages.has(app.packageName)
    )

    // Add unknown installed apps not in catalog
    const catalogPackages = new Set(DEVICE_APPS.map((a) => a.packageName).filter(Boolean))
    const unknown = apps
      .filter((a) => !catalogPackages.has(a.packageName))
      .map((a) => ({
        id: a.packageName,
        name: a.name,
        color: '#6366F1',
        packageName: a.packageName,
        category: 'social' as const,
      }))

    const combined = [...matched, ...unknown]
    return combined.length > 0 ? combined : DEVICE_APPS
  } catch {
    return DEVICE_APPS
  }
}

export function isNativeAndroid(): boolean {
  return Capacitor.isNativePlatform() && Capacitor.getPlatform() === 'android'
}
