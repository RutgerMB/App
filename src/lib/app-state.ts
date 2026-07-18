import type { AppState } from '@/types'
import { DEFAULT_DAILY_OPENINGS } from '@/types'
import { clampMaxDailyHours } from '@/lib/daily-earn-cap'
import { clampStreakResetTokens, localMonthKey } from '@/lib/streak-tokens'

export function normalizeAppState(state: AppState): AppState {
  return {
    ...state,
    apps: state.apps ?? [],
    sessions: state.sessions ?? [],
    workoutPlanSessions: state.workoutPlanSessions ?? [],
    usageHistory: state.usageHistory ?? [],
    lastLostStreak: Math.max(0, Math.floor(state.lastLostStreak ?? 0)),
    profile: {
      ...state.profile,
      difficulty: state.profile.difficulty ?? 'medium',
      dailyOpenings: state.profile.dailyOpenings ?? DEFAULT_DAILY_OPENINGS,
      minutesPerOpening: state.profile.minutesPerOpening ?? 5,
      openingsUsedToday: state.profile.openingsUsedToday ?? 0,
      openingsDate: state.profile.openingsDate ?? null,
      maxDailyHours: clampMaxDailyHours(state.profile.maxDailyHours),
      earnedMinutesToday: state.profile.earnedMinutesToday ?? 0,
      earnedDate: state.profile.earnedDate ?? null,
      streakResetTokens: clampStreakResetTokens(state.profile.streakResetTokens),
      streakResetTokensMonth: state.profile.streakResetTokensMonth ?? localMonthKey(),
    },
  }
}
