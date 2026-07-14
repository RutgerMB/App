import type { AppState } from '@/types'
import { DEFAULT_APPS, DEFAULT_DAILY_OPENINGS } from '@/types'

function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`
}

export function normalizeAppState(state: AppState): AppState {
  const apps =
    state.apps?.length > 0
      ? state.apps
      : DEFAULT_APPS.map((app) => ({ ...app, id: generateId() }))

  return {
    ...state,
    apps,
    sessions: state.sessions ?? [],
    workoutPlanSessions: state.workoutPlanSessions ?? [],
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
