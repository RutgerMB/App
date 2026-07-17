import { AppLauncher } from '@capacitor/app-launcher'
import { Capacitor } from '@capacitor/core'
import { LocalNotifications } from '@capacitor/local-notifications'

export type NotificationPermissionStatus = 'granted' | 'denied' | 'prompt'

function mapDisplayStatus(
  display: 'prompt' | 'prompt-with-rationale' | 'granted' | 'denied'
): NotificationPermissionStatus {
  if (display === 'granted') return 'granted'
  if (display === 'denied') return 'denied'
  return 'prompt'
}

function mapWebPermission(): NotificationPermissionStatus {
  if (typeof window === 'undefined' || !('Notification' in window)) return 'denied'
  if (Notification.permission === 'granted') return 'granted'
  if (Notification.permission === 'denied') return 'denied'
  return 'prompt'
}

/** Read current OS notification permission without prompting. */
export async function checkNotificationPermission(): Promise<NotificationPermissionStatus> {
  try {
    if (Capacitor.isNativePlatform()) {
      const { display } = await LocalNotifications.checkPermissions()
      return mapDisplayStatus(display)
    }
    return mapWebPermission()
  } catch {
    return mapWebPermission()
  }
}

/**
 * Request notification permission when the OS still allows a prompt.
 * If already granted, returns true. If permanently denied, returns false
 * without prompting (caller should open system settings).
 */
export async function requestNotificationPermission(): Promise<boolean> {
  const current = await checkNotificationPermission()
  if (current === 'granted') return true
  if (current === 'denied') return false

  try {
    if (Capacitor.isNativePlatform()) {
      const { display } = await LocalNotifications.requestPermissions()
      return display === 'granted'
    }
    if (typeof window !== 'undefined' && 'Notification' in window) {
      const result = await Notification.requestPermission()
      return result === 'granted'
    }
    return false
  } catch {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      const result = await Notification.requestPermission()
      return result === 'granted'
    }
    return false
  }
}

/** @deprecated Prefer requestNotificationPermission — same behavior. */
export async function requestPushPermission(): Promise<boolean> {
  return requestNotificationPermission()
}

/** Open the OS app/notification settings so the user can re-enable permission. */
export async function openNotificationSettings(): Promise<void> {
  const platform = Capacitor.getPlatform()
  try {
    if (platform === 'ios') {
      await AppLauncher.openUrl({ url: 'app-settings:' })
      return
    }
    if (platform === 'android') {
      const pkg = 'com.replock.app'
      await AppLauncher.openUrl({
        url: `intent:#Intent;action=android.settings.APP_NOTIFICATION_SETTINGS;S.android.provider.extra.APP_PACKAGE=${pkg};end`,
      })
      return
    }
  } catch {
    try {
      if (platform === 'android') {
        await AppLauncher.openUrl({ url: 'package:com.replock.app' })
      }
    } catch {
      // No-op on web / unsupported
    }
  }
}

export function isPushSupported(): boolean {
  if (Capacitor.isNativePlatform()) return true
  return typeof window !== 'undefined' && 'Notification' in window
}

export function isNotificationSupported(): boolean {
  return isPushSupported()
}
