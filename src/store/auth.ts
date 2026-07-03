import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { AppState } from '@/types'
import { DEFAULT_APPS } from '@/types'
import { loginAccount, registerAccount, syncAppState, type AuthUser } from '@/lib/auth-api'
import { useStore } from '@/store'

function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`
}

function normalizeAppState(state: AppState): AppState {
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
    },
  }
}

export function getAppStateSnapshot(): AppState {
  const s = useStore.getState()
  return {
    profile: s.profile,
    screenTimeBalance: s.screenTimeBalance,
    totalEarnedMinutes: s.totalEarnedMinutes,
    totalExercises: s.totalExercises,
    currentStreak: s.currentStreak,
    longestStreak: s.longestStreak,
    lastExerciseDate: s.lastExerciseDate,
    apps: s.apps,
    sessions: s.sessions,
    workoutPlanSessions: s.workoutPlanSessions,
  }
}

export function applyAppState(state: AppState) {
  const normalized = normalizeAppState(state)
  useStore.setState(normalized)
}

interface AuthState {
  token: string | null
  user: AuthUser | null
  register: (email: string, password: string, name: string) => Promise<void>
  login: (email: string, password: string) => Promise<void>
  logout: () => void
  syncNow: () => Promise<void>
}

let syncTimer: ReturnType<typeof setTimeout> | null = null

export function scheduleCloudSync() {
  const { token } = useAuthStore.getState()
  if (!token) return
  if (syncTimer) clearTimeout(syncTimer)
  syncTimer = setTimeout(() => {
    useAuthStore.getState().syncNow().catch(() => {})
  }, 2000)
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      token: null,
      user: null,

      register: async (email, password, name) => {
        const res = await registerAccount(email, password, name)
        set({ token: res.token, user: res.user })
        applyAppState(res.appState)
      },

      login: async (email, password) => {
        const res = await loginAccount(email, password)
        set({ token: res.token, user: res.user })
        applyAppState(res.appState)
      },

      logout: () => {
        set({ token: null, user: null })
        useStore.persist.clearStorage()
        window.location.href = '/login'
      },

      syncNow: async () => {
        const { token } = get()
        if (!token) return
        await syncAppState(token, getAppStateSnapshot())
      },
    }),
    { name: 'replock-auth' }
  )
)

if (typeof window !== 'undefined') {
  useStore.subscribe(() => scheduleCloudSync())
}
