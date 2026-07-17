import { useEffect } from 'react'
import { App } from '@capacitor/app'
import { Capacitor } from '@capacitor/core'
import { syncLocalReminders, disableAndClearReminders } from '@/lib/planned-notifications'
import { useStore } from '@/store'

/**
 * Keeps local reminder notifications aligned with streak / balance / trial state.
 * Runs on mount, on relevant store changes, and when the app returns to foreground.
 */
export function NotificationReminderSync() {
  const profile = useStore((s) => s.profile)
  const currentStreak = useStore((s) => s.currentStreak)
  const lastExerciseDate = useStore((s) => s.lastExerciseDate)
  const screenTimeBalance = useStore((s) => s.screenTimeBalance)

  useEffect(() => {
    if (!profile.onboardingComplete) return

    const run = () => {
      if (profile.notificationsEnabled === false) {
        void disableAndClearReminders()
        return
      }
      void syncLocalReminders({
        profile,
        currentStreak,
        lastExerciseDate,
        screenTimeBalance,
        locale: profile.locale ?? 'en',
      })
    }

    run()

    if (!Capacitor.isNativePlatform()) return

    let handle: { remove: () => Promise<void> } | undefined
    void App.addListener('appStateChange', ({ isActive }) => {
      if (isActive) run()
    }).then((h) => {
      handle = h
    })

    return () => {
      void handle?.remove()
    }
  }, [
    profile,
    profile.onboardingComplete,
    profile.notificationsEnabled,
    profile.locale,
    profile.isPro,
    profile.createdAt,
    currentStreak,
    lastExerciseDate,
    screenTimeBalance,
  ])

  return null
}
