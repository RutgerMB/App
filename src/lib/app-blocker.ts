import { registerPlugin } from '@capacitor/core'
import { Capacitor } from '@capacitor/core'
import type { LockedApp } from '@/types'
import {
  getIosControlsStatus,
  requestIosControlsAuthorization,
  syncIosBlockingRules,
  type IosBlockerRule,
} from '@/lib/replock-controls'

export interface BlockerRule {
  packageName: string
  blocked: boolean
  unlockedUntil: number
}

export interface BlockerStatus {
  supported: boolean
  accessibility: boolean
  familyControlsAuthorized?: boolean
  ready: boolean
}

export interface BlockAttemptRow {
  packageName: string
  label: string
  count: number
}

export interface BlockAttemptsToday {
  total: number
  apps: BlockAttemptRow[]
}

interface AppBlockerPlugin {
  isSupported(): Promise<{ supported: boolean }>
  getStatus(): Promise<BlockerStatus>
  openAccessibilitySettings(): Promise<void>
  applyRules(options: { rules: BlockerRule[] }): Promise<{ ok: boolean }>
  getBlockAttemptsToday(): Promise<BlockAttemptsToday>
}

const AppBlockerNative = registerPlugin<AppBlockerPlugin>('AppBlocker', {
  web: () => import('./app-blocker-web-stub').then((m) => m.default),
})

export function isAndroidBlockingAvailable(): boolean {
  return Capacitor.isNativePlatform() && Capacitor.getPlatform() === 'android'
}

export function isIosBlockingAvailable(): boolean {
  return Capacitor.isNativePlatform() && Capacitor.getPlatform() === 'ios'
}

export function isNativeBlockingAvailable(): boolean {
  return isAndroidBlockingAvailable() || isIosBlockingAvailable()
}

export async function getBlockerStatus(): Promise<BlockerStatus> {
  if (isIosBlockingAvailable()) {
    const ios = await getIosControlsStatus()
    return {
      supported: ios.supported,
      accessibility: false,
      familyControlsAuthorized: ios.authorized,
      ready: ios.supported && ios.authorized,
    }
  }

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

export async function requestBlockingAuthorization(): Promise<boolean> {
  if (isIosBlockingAvailable()) {
    return requestIosControlsAuthorization()
  }
  if (isAndroidBlockingAvailable()) {
    await openAccessibilitySettings()
    return false
  }
  return false
}

export function shouldBlockOnDevice(app: LockedApp, now = Date.now()): boolean {
  if (!app.packageName && !app.iosTokenId) return false
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

export function buildIosBlockerRules(apps: LockedApp[]): IosBlockerRule[] {
  const now = Date.now()
  return apps
    .filter((app) => app.iosTokenId)
    .map((app) => ({
      tokenId: app.iosTokenId!,
      blocked: shouldBlockOnDevice(app, now),
      unlockedUntil: app.unlockedUntil ?? 0,
    }))
}

export async function syncAppBlockingRules(apps: LockedApp[]): Promise<void> {
  if (isIosBlockingAvailable()) {
    const status = await getBlockerStatus()
    if (!status.ready) return
    const rules = buildIosBlockerRules(apps)
    // Empty rules must still apply — native clears ManagedSettings shields.
    // (Previously an early return left removed apps blocked until next picker save.)
    await syncIosBlockingRules(rules)
    return
  }

  if (!isAndroidBlockingAvailable()) return
  const status = await getBlockerStatus()
  if (!status.ready) return

  const rules = buildBlockerRules(apps)
  await AppBlockerNative.applyRules({ rules })
}

/** Android only — counts accessibility intercepts of locked apps today. */
export async function fetchBlockAttemptsToday(): Promise<BlockAttemptsToday | null> {
  if (!isAndroidBlockingAvailable()) return null
  try {
    return await AppBlockerNative.getBlockAttemptsToday()
  } catch {
    return null
  }
}
