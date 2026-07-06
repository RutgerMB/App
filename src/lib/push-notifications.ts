import { Capacitor, registerPlugin } from '@capacitor/core'

interface PushNotificationsPlugin {
  requestPermissions: () => Promise<{ receive: 'prompt' | 'prompt-with-rationale' | 'granted' | 'denied' }>
  register: () => Promise<void>
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
  }),
})

/** Request push notification permission — native plugin when synced, else web Notification API. */
export async function requestPushPermission(): Promise<boolean> {
  try {
    const perm = await PushNotifications.requestPermissions()
    if (perm.receive === 'granted') {
      await PushNotifications.register()
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
