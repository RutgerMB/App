/** Notification types to implement with push/local notifications (see onboarding preview). */
export const PLANNED_NOTIFICATION_TYPES = [
  {
    id: 'workout',
    description: 'Remind user to train and earn screen time',
  },
  {
    id: 'streak',
    description: 'Warn when streak is at risk',
  },
  {
    id: 'earned',
    description: 'Celebrate earned screen time after a workout',
  },
] as const

export type PlannedNotificationId = (typeof PLANNED_NOTIFICATION_TYPES)[number]['id']
