import { registerPlugin } from '@capacitor/core'
import { Capacitor } from '@capacitor/core'
import type { LockedApp } from '@/types'

export interface BlockerRule {
  packageName: string
  blocked: boolean
  unlockedUntil: number
}

export interface BlockerStatus {
  supported: boolean
  accessibility: boolean
  ready: boolean
}

interface AppBlockerPlugin {
  isSupported(): Promise<{ supported: boolean }>
  getStatus(): Promise<BlockerStatus>
  openAccessibilitySettings(): Promise<void>
  applyRules(options: { rules: BlockerRule[] }): Promise<{ ok: boolean }>
}

const AppBlockerNative = registerPlugin<AppBlockerPlugin>('AppBlocker', {
  web: () => import('./app-blocker-web-stub').then((m) => m.default),
})

export function isAndroidBlockingAvailable(): boolean {
  return Capacitor.isNativePlatform() && Capacitor.getPlatform() === 'android'
}

export async function getBlockerStatus(): Promise<BlockerStatus> {
  if (!isAndroidBlockingAvailable()) {
    return { supported: false, accessibility: false, ready: false }
  }
  try {
    return await AppBlockerNative.getStatus()
  } catch {
    return { supported: false, accessibility: false, ready: false }
  }
}

export async function openAccessibilitySettings(): Promise<void> {
  if (!isAndroidBlockingAvailable()) return
  await AppBlockerNative.openAccessibilitySettings()
}

export function shouldBlockOnDevice(app: LockedApp, now = Date.now()): boolean {
  if (!app.packageName) return false
  if (!app.isLocked && app.unlockedUntil != null && app.unlockedUntil > now) return false
  return true
}

export function buildBlockerRules(apps: LockedApp[]): BlockerRule[] {
  const now = Date.now()
  return apps
    .filter((app) => app.packageName)
    .map((app) => ({
      packageName: app.packageName!,
      blocked: shouldBlockOnDevice(app, now),
      unlockedUntil: app.unlockedUntil ?? 0,
    }))
}

export async function syncAppBlockingRules(apps: LockedApp[]): Promise<void> {
  if (!isAndroidBlockingAvailable()) return
  const status = await getBlockerStatus()
  if (!status.ready) return

  const rules = buildBlockerRules(apps)
  await AppBlockerNative.applyRules({ rules })
}
