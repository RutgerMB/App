import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { AppState, ExerciseSession, ExerciseType, LockedApp, WorkoutPlanSession } from '@/types'
import { DEFAULT_APPS, WORKOUT_PLANS } from '@/types'
import { canAddMoreApps, getAppLimit } from '@/lib/trial'
import { detectLocale } from '@/i18n'
import { computeEarnedMinutes, FREE_DIFFICULTY } from '@/lib/earning'
import { scheduleBlockingSync } from '@/lib/blocking-sync'
import type { Locale, Difficulty } from '@/types'

function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`
}

function todayString(): string {
  return new Date().toISOString().split('T')[0]
}

function updateStreak(lastDate: string | null, currentStreak: number): { streak: number; longest: number } {
  const today = todayString()
  if (lastDate === today) return { streak: currentStreak, longest: currentStreak }

  const yesterday = new Date()
  yesterday.setDate(yesterday.getDate() - 1)
  const yesterdayStr = yesterday.toISOString().split('T')[0]

  if (lastDate === yesterdayStr) {
    return { streak: currentStreak + 1, longest: Math.max(currentStreak + 1, currentStreak) }
  }
  return { streak: 1, longest: Math.max(1, currentStreak) }
}

function enforceAppLimit(state: AppState): LockedApp[] {
  const limit = getAppLimit(state.profile)
  if (limit === Infinity || state.apps.length <= limit) return state.apps
  return state.apps.slice(0, limit)
}

const initialState: AppState = {
  profile: {
    name: '',
    locale: detectLocale(),
    difficulty: 'medium',
    onboardingComplete: false,
    isPro: false,
    stripeCustomerId: null,
    subscriptionId: null,
    subscriptionStatus: null,
    notificationsEnabled: true,
    createdAt: Date.now(),
  },
  screenTimeBalance: 0,
  totalEarnedMinutes: 0,
  totalExercises: 0,
  currentStreak: 0,
  longestStreak: 0,
  lastExerciseDate: null,
  apps: DEFAULT_APPS.map((app) => ({ ...app, id: generateId() })),
  sessions: [],
  workoutPlanSessions: [],
}

interface StoreActions {
  completeOnboarding: (name: string, difficulty?: Difficulty) => void
  setLocale: (locale: Locale) => void
  setDifficulty: (difficulty: Difficulty) => void
  setNotificationsEnabled: (enabled: boolean) => void
  completeExercise: (type: ExerciseType, amount: number, durationSeconds: number) => number
  unlockApp: (appId: string, minutes: number) => boolean
  useAppTime: (appId: string, minutes: number) => void
  addApp: (app: Omit<LockedApp, 'id' | 'usedMinutes' | 'isLocked' | 'unlockedUntil'>) => boolean
  removeApp: (appId: string) => void
  updateAppLimit: (appId: string, limit: number) => void
  setProStatus: (isPro: boolean, customerId?: string, subscriptionId?: string, status?: 'active' | 'canceled' | 'past_due') => void
  resetDailyUsage: () => void
  getEarnedMinutes: (type: ExerciseType, amount: number) => number
  completeWorkoutPlan: (
    planId: string,
    results: { type: ExerciseType; amount: number; durationSeconds: number }[]
  ) => { total: number; bonus: number }
}

export const useStore = create<AppState & StoreActions>()(
  persist(
    (set, get) => ({
      ...initialState,

      completeOnboarding: (name, difficulty = 'medium') =>
        set((s) => ({
          profile: { ...s.profile, name, difficulty, onboardingComplete: true, createdAt: Date.now() },
        })),

      setLocale: (locale) =>
        set((s) => ({
          profile: { ...s.profile, locale },
        })),

      setDifficulty: (difficulty) => {
        const { profile } = get()
        if (!profile.isPro && difficulty !== FREE_DIFFICULTY) return
        set((s) => ({
          profile: { ...s.profile, difficulty },
        }))
      },

      setNotificationsEnabled: (enabled) =>
        set((s) => ({
          profile: { ...s.profile, notificationsEnabled: enabled },
        })),

      getEarnedMinutes: (type, amount) => {
        const { profile } = get()
        const difficulty = profile.isPro ? (profile.difficulty ?? FREE_DIFFICULTY) : FREE_DIFFICULTY
        return computeEarnedMinutes(type, amount, difficulty)
      },

      completeExercise: (type, amount, durationSeconds) => {
        const earned = get().getEarnedMinutes(type, amount)
        const today = todayString()
        const { lastExerciseDate, currentStreak, longestStreak } = get()
        const { streak, longest } = updateStreak(lastExerciseDate, currentStreak)

        const session: ExerciseSession = {
          id: generateId(),
          type,
          amount,
          earnedMinutes: earned,
          completedAt: Date.now(),
          durationSeconds,
        }

        set((s) => ({
          screenTimeBalance: s.screenTimeBalance + earned,
          totalEarnedMinutes: s.totalEarnedMinutes + earned,
          totalExercises: s.totalExercises + 1,
          currentStreak: lastExerciseDate === today ? currentStreak : streak,
          longestStreak: Math.max(longestStreak, longest),
          lastExerciseDate: today,
          sessions: [session, ...s.sessions].slice(0, 100),
        }))

        return earned
      },

      completeWorkoutPlan: (planId, results) => {
        const plan = WORKOUT_PLANS.find((p) => p.id === planId)
        if (!plan) return { total: 0, bonus: 0 }

        const today = todayString()
        const { lastExerciseDate, currentStreak, longestStreak } = get()
        const { streak, longest } = updateStreak(lastExerciseDate, currentStreak)

        let base = 0
        const newSessions: ExerciseSession[] = results.map((r) => {
          const earned = get().getEarnedMinutes(r.type, r.amount)
          base += earned
          return {
            id: generateId(),
            type: r.type,
            amount: r.amount,
            earnedMinutes: earned,
            completedAt: Date.now(),
            durationSeconds: r.durationSeconds,
            workoutPlanId: planId,
          }
        })

        const bonus = Math.round(base * (plan.bonusPercent / 100) * 10) / 10
        const total = base + bonus
        const totalDuration = results.reduce((s, r) => s + r.durationSeconds, 0)

        const planSession: WorkoutPlanSession = {
          id: generateId(),
          planId,
          earnedMinutes: total,
          bonusMinutes: bonus,
          completedAt: Date.now(),
          durationSeconds: totalDuration,
        }

        set((s) => ({
          screenTimeBalance: s.screenTimeBalance + total,
          totalEarnedMinutes: s.totalEarnedMinutes + total,
          totalExercises: s.totalExercises + results.length,
          currentStreak: lastExerciseDate === today ? currentStreak : streak,
          longestStreak: Math.max(longestStreak, longest),
          lastExerciseDate: today,
          sessions: [...newSessions, ...s.sessions].slice(0, 150),
          workoutPlanSessions: [planSession, ...s.workoutPlanSessions].slice(0, 50),
        }))

        return { total, bonus }
      },

      unlockApp: (appId, minutes) => {
        const { screenTimeBalance, apps } = get()
        if (screenTimeBalance < minutes) return false

        const app = apps.find((a) => a.id === appId)
        if (!app) return false

        const unlockUntil = Date.now() + minutes * 60 * 1000

        set((s) => ({
          screenTimeBalance: s.screenTimeBalance - minutes,
          apps: s.apps.map((a) =>
            a.id === appId
              ? { ...a, isLocked: false, unlockedUntil: unlockUntil }
              : a
          ),
        }))
        return true
      },

      useAppTime: (appId, minutes) => {
        set((s) => ({
          apps: s.apps.map((a) => {
            if (a.id !== appId) return a
            const newUsed = a.usedMinutes + minutes
            const limitReached = newUsed >= a.dailyLimitMinutes
            return {
              ...a,
              usedMinutes: newUsed,
              isLocked: limitReached,
              unlockedUntil: limitReached ? null : a.unlockedUntil,
            }
          }),
        }))
      },

      addApp: (appData) => {
        const state = get()
        if (!canAddMoreApps(state.profile, state.apps.length)) return false

        const newApp: LockedApp = {
          ...appData,
          id: generateId(),
          usedMinutes: 0,
          isLocked: true,
          unlockedUntil: null,
        }
        set((s) => ({ apps: [...s.apps, newApp] }))
        return true
      },

      removeApp: (appId) =>
        set((s) => ({ apps: s.apps.filter((a) => a.id !== appId) })),

      updateAppLimit: (appId, limit) =>
        set((s) => ({
          apps: s.apps.map((a) =>
            a.id === appId ? { ...a, dailyLimitMinutes: limit } : a
          ),
        })),

      setProStatus: (isPro, customerId, subscriptionId, status) =>
        set((s) => ({
          profile: {
            ...s.profile,
            isPro,
            difficulty: isPro ? s.profile.difficulty : FREE_DIFFICULTY,
            stripeCustomerId: customerId ?? s.profile.stripeCustomerId,
            subscriptionId: subscriptionId ?? s.profile.subscriptionId,
            subscriptionStatus: status ?? (isPro ? 'active' : null),
          },
        })),

      resetDailyUsage: () =>
        set((s) => ({
          apps: s.apps.map((a) => ({
            ...a,
            usedMinutes: 0,
            isLocked: true,
            unlockedUntil: null,
          })),
        })),
    }),
    {
      name: 'replock-storage',
      version: 8,
      migrate: (persisted, version) => {
        const state = persisted as AppState
        if (version < 2) {
          state.apps = enforceAppLimit(state)
        }
        if (version < 3) {
          state.profile = { ...state.profile, locale: state.profile.locale ?? detectLocale() }
        }
        if (version < 4) {
          state.workoutPlanSessions = state.workoutPlanSessions ?? []
          state.apps = state.apps.map((a) => {
            if (a.name === 'Twitter') return { ...a, name: 'Twitter / X', brand: 'x' as const, icon: '' }
            if (a.name === 'Instagram' && !a.brand) return { ...a, brand: 'instagram' as const, icon: '' }
            if (a.name === 'TikTok' && !a.brand) return { ...a, brand: 'tiktok' as const, icon: '' }
            return a
          })
        }
        if (version < 5) {
          state.profile = { ...state.profile, difficulty: state.profile.difficulty ?? 'medium' }
        }
        if (version < 6) {
          state.profile = {
            ...state.profile,
            difficulty:
              state.profile.isPro ? (state.profile.difficulty ?? FREE_DIFFICULTY) : FREE_DIFFICULTY,
          }
        }
        if (version < 7) {
          state.profile = {
            ...state.profile,
            notificationsEnabled: state.profile.notificationsEnabled ?? true,
          }
        }
        if (version < 8) {
          const brandPackages: Record<string, string> = {
            instagram: 'com.instagram.android',
            tiktok: 'com.zhiliaoapp.musically',
            x: 'com.twitter.android',
          }
          state.apps = state.apps.map((a) => {
            if (!a.packageName && a.brand && brandPackages[a.brand]) {
              return { ...a, packageName: brandPackages[a.brand] }
            }
            return a
          })
        }
        return state as AppState & StoreActions
      },
      onRehydrateStorage: () => (state) => {
        if (state) {
          const trimmed = enforceAppLimit(state)
          if (trimmed.length !== state.apps.length) {
            state.apps = trimmed
          }
        }
      },
    }
  )
)

// Check unlock expiry every 30 seconds
if (typeof window !== 'undefined') {
  setInterval(() => {
    const state = useStore.getState()
    const now = Date.now()
    const needsUpdate = state.apps.some(
      (a) => !a.isLocked && a.unlockedUntil && a.unlockedUntil < now
    )
    if (needsUpdate) {
      useStore.setState({
        apps: state.apps.map((a) =>
          a.unlockedUntil && a.unlockedUntil < now
            ? { ...a, isLocked: true, unlockedUntil: null }
            : a
        ),
      })
      scheduleBlockingSync()
    }

    // Enforce app limit when trial expires
    const trimmed = enforceAppLimit(state)
    if (trimmed.length !== state.apps.length) {
      useStore.setState({ apps: trimmed })
    }
  }, 30_000)
}
