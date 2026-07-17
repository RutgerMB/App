import { Capacitor } from '@capacitor/core'
import { LocalNotifications } from '@capacitor/local-notifications'
import { translate, type Locale } from '@/i18n'
import { localDateString, offsetLocalDateString } from '@/lib/dates'
import {
  checkNotificationPermission,
  requestNotificationPermission,
} from '@/lib/push-notifications'
import { getTrialDaysRemaining, getTrialStatus } from '@/lib/trial'
import type { UserProfile } from '@/types'

/** Stable local notification IDs (cancel + reschedule). */
export const NOTIFICATION_IDS = {
  streakAtRisk: 1001,
  earnMinutes: 1002,
  trialEnding: 1003,
} as const

const CHANNEL_ID = 'replock-reminders'

export const PLANNED_NOTIFICATION_TYPES = [
  { id: 'workout', description: 'Remind user to train and earn screen time' },
  { id: 'streak', description: 'Warn when streak is at risk' },
  { id: 'earned', description: 'Celebrate earned screen time after a workout' },
] as const

export type PlannedNotificationId = (typeof PLANNED_NOTIFICATION_TYPES)[number]['id']

export interface ReminderScheduleInput {
  profile: UserProfile
  currentStreak: number
  lastExerciseDate: string | null
  screenTimeBalance: number
  locale: Locale
}

let channelReady = false

async function ensureAndroidChannel(): Promise<void> {
  if (channelReady || Capacitor.getPlatform() !== 'android') return
  try {
    await LocalNotifications.createChannel({
      id: CHANNEL_ID,
      name: 'Reminders',
      description: 'Streak, workout, and trial reminders',
      importance: 4,
      visibility: 1,
      vibration: true,
    })
    channelReady = true
  } catch {
    // Channel may already exist
    channelReady = true
  }
}

function atLocalHour(hour: number, minute = 0, dayOffset = 0): Date {
  const d = new Date()
  d.setDate(d.getDate() + dayOffset)
  d.setHours(hour, minute, 0, 0)
  if (d.getTime() <= Date.now() + 60_000) {
    d.setDate(d.getDate() + 1)
  }
  return d
}

async function cancelReminderIds(): Promise<void> {
  const ids = Object.values(NOTIFICATION_IDS).map((id) => ({ id }))
  try {
    await LocalNotifications.cancel({ notifications: ids })
  } catch {
    // Ignore cancel failures (nothing scheduled yet)
  }
}

/**
 * Cancel pending local reminders and schedule the next useful ones.
 * No-ops when notifications are off, permission missing, or not native.
 * At most one of each type; never schedules more than a few quiet daily nudges.
 */
export async function syncLocalReminders(input: ReminderScheduleInput): Promise<void> {
  if (!Capacitor.isNativePlatform()) return
  if (input.profile.notificationsEnabled === false) {
    await cancelReminderIds()
    return
  }

  const status = await checkNotificationPermission()
  if (status !== 'granted') {
    await cancelReminderIds()
    return
  }

  await ensureAndroidChannel()
  await cancelReminderIds()

  const today = localDateString()
  const yesterday = offsetLocalDateString(-1)
  const exercisedToday = input.lastExerciseDate === today
  const locale = input.locale
  const notifications: Array<{
    id: number
    title: string
    body: string
    schedule: { at: Date; allowWhileIdle: boolean }
    channelId?: string
  }> = []

  // Streak at risk: active streak, last workout was yesterday, not today yet
  if (input.currentStreak > 0 && !exercisedToday && input.lastExerciseDate === yesterday) {
    notifications.push({
      id: NOTIFICATION_IDS.streakAtRisk,
      title: translate(locale, 'notifications.streakAtRiskTitle'),
      body: translate(locale, 'notifications.streakAtRiskBody', {
        count: input.currentStreak,
      }),
      schedule: { at: atLocalHour(19, 0), allowWhileIdle: true },
      channelId: CHANNEL_ID,
    })
  }

  // Earn minutes: low balance and no workout today — afternoon nudge
  if (!exercisedToday && input.screenTimeBalance < 15) {
    notifications.push({
      id: NOTIFICATION_IDS.earnMinutes,
      title: translate(locale, 'notifications.earnMinutesTitle'),
      body: translate(locale, 'notifications.earnMinutesBody'),
      schedule: { at: atLocalHour(16, 0), allowWhileIdle: true },
      channelId: CHANNEL_ID,
    })
  }

  // Trial ending: 1–2 days left, not Pro
  const trialStatus = getTrialStatus(input.profile)
  if (trialStatus === 'trial') {
    const daysLeft = getTrialDaysRemaining(input.profile.createdAt)
    if (daysLeft >= 1 && daysLeft <= 2) {
      notifications.push({
        id: NOTIFICATION_IDS.trialEnding,
        title: translate(locale, 'notifications.trialEndingTitle'),
        body: translate(locale, 'notifications.trialEndingBody', { days: daysLeft }),
        schedule: { at: atLocalHour(10, 30), allowWhileIdle: true },
        channelId: CHANNEL_ID,
      })
    }
  }

  if (notifications.length === 0) return

  try {
    await LocalNotifications.schedule({
      notifications: notifications.map((n) => ({
        id: n.id,
        title: n.title,
        body: n.body,
        schedule: n.schedule,
        channelId: n.channelId,
        extra: { source: 'replock-local' },
      })),
    })
  } catch (err) {
    console.warn('[notifications] schedule failed', err)
  }
}

/** Ensure permission + schedule after onboarding Allow / Settings enable. */
export async function enableAndSyncReminders(input: ReminderScheduleInput): Promise<boolean> {
  const granted = await requestNotificationPermission()
  if (!granted) return false
  await syncLocalReminders({ ...input, profile: { ...input.profile, notificationsEnabled: true } })
  return true
}

export async function disableAndClearReminders(): Promise<void> {
  if (!Capacitor.isNativePlatform()) return
  await cancelReminderIds()
}
