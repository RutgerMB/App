import type { AppState } from '@/types'
import { DEFAULT_DAILY_OPENINGS } from '@/types'

export function normalizeAppState(state: AppState): AppState {
  return {
    ...state,
    apps: state.apps ?? [],
    sessions: state.sessions ?? [],
    workoutPlanSessions: state.workoutPlanSessions ?? [],
    usageHistory: state.usageHistory ?? [],
    profile: {
      ...state.profile,
      difficulty: state.profile.difficulty ?? 'medium',
      dailyOpenings: state.profile.dailyOpenings ?? DEFAULT_DAILY_OPENINGS,
      minutesPerOpening: state.profile.minutesPerOpening ?? 5,
      openingsUsedToday: state.profile.openingsUsedToday ?? 0,
      openingsDate: state.profile.openingsDate ?? null,
    },
  }
}
