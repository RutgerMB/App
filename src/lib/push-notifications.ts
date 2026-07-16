import { Capacitor, registerPlugin } from '@capacitor/core'

/**
 * Thin wrapper around @capacitor/push-notifications.
 * Onboarding "Allow notifications" calls requestPushPermission() — this hits
 * UNUserNotificationCenter via the native plugin when synced (not a no-op).
 * Reminder content itself is still "coming soon"; we only request OS permission.
 */
interface PushNotificationsPlugin {
  requestPermissions: () => Promise<{ receive: 'prompt' | 'prompt-with-rationale' | 'granted' | 'denied' }>
  register: () => Promise<void>
  checkPermissions?: () => Promise<{ receive: 'prompt' | 'prompt-with-rationale' | 'granted' | 'denied' }>
}

const PushNotifications = registerPlugin<PushNotificationsPlugin>('PushNotifications', {
  web: () => ({
    requestPermissions: async () => {
      if (typeof window !== 'undefined' && 'Notification' in window) {
        const result = await Notification.requestPermission()
        return { receive: result === 'granted' ? 'granted' : 'denied' }
      }
      return { receive: 'denied' }
    },
    register: async () => {},
    checkPermissions: async () => {
      if (typeof window !== 'undefined' && 'Notification' in window) {
        if (Notification.permission === 'granted') return { receive: 'granted' }
        if (Notification.permission === 'denied') return { receive: 'denied' }
        return { receive: 'prompt' }
      }
      return { receive: 'denied' }
    },
  }),
})

/** Request push notification permission — native plugin when synced, else web Notification API. */
export async function requestPushPermission(): Promise<boolean> {
  try {
    const perm = await PushNotifications.requestPermissions()
    if (perm.receive === 'granted') {
      // register() may no-op without APNs; still triggers device token flow when configured.
      try {
        await PushNotifications.register()
      } catch {
        // Permission was granted; token registration is optional for local permission UX.
      }
      return true
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

export function isPushSupported(): boolean {
  if (Capacitor.isNativePlatform()) return true
  return typeof window !== 'undefined' && 'Notification' in window
}
