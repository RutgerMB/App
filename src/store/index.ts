import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { AppState, ExerciseSession, ExerciseType, LockedApp, WorkoutPlanSession } from '@/types'
import { DEFAULT_APPS, DEFAULT_DAILY_OPENINGS, WORKOUT_PLANS } from '@/types'
import { localDateString } from '@/lib/dates'
import { reconcileStreak, updateStreak } from '@/lib/streaks'
import { canAddMoreApps, getAppLimit } from '@/lib/trial'
import { detectLocale } from '@/i18n'
import { computeEarnedMinutes, FREE_DIFFICULTY } from '@/lib/earning'
import { scheduleBlockingSync } from '@/lib/blocking-sync'
import { applyUsageDayBoundary, upsertUsageDay, sumUnlockedMinutes } from '@/lib/usage-history'
import type { DeviceAppDefinition } from '@/data/device-apps'
import type { Locale, Difficulty } from '@/types'

function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`
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
    dailyOpenings: DEFAULT_DAILY_OPENINGS,
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
  usageHistory: [],
}

export const MAX_DISPLAY_NAME_LENGTH = 40

interface StoreActions {
  completeOnboarding: (name: string, difficulty?: Difficulty) => void
  setDisplayName: (name: string) => void
  setLocale: (locale: Locale) => void
  setDifficulty: (difficulty: Difficulty) => void
  setNotificationsEnabled: (enabled: boolean) => void
  setOnboardingApps: (selectedApps: DeviceAppDefinition[], dailyLimitMinutes: number) => void
  setBlockingGoal: (openings: number, minutesPerOpening?: number) => void
  completeExercise: (type: ExerciseType, amount: number, durationSeconds: number) => number
  unlockApp: (appId: string, minutes: number) => boolean
  useAppTime: (appId: string, minutes: number) => void
  addApp: (app: Omit<LockedApp, 'id' | 'usedMinutes' | 'isLocked' | 'unlockedUntil'>) => boolean
  removeApp: (appId: string) => void
  updateAppLimit: (appId: string, limit: number) => void
  renameApp: (appId: string, name: string, icon?: string) => void
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
          profile: { ...s.profile, name, difficulty, onboardingComplete: true },
        })),

      setDisplayName: (name) => {
        const trimmed = name.trim().slice(0, MAX_DISPLAY_NAME_LENGTH)
        if (!trimmed) return
        set((s) => ({
          profile: { ...s.profile, name: trimmed },
        }))
      },

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

      setOnboardingApps: (selectedApps, dailyLimitMinutes) => {
        if (selectedApps.length === 0) return
        const newApps: LockedApp[] = selectedApps.map((appData) => {
          const rawName = (appData.name || '').trim()
          const isPlaceholder = /^App \d+$/i.test(rawName)
          return {
            id: generateId(),
            // Never persist opaque placeholders when a real label was provided.
            name: isPlaceholder ? rawName : rawName || 'App',
            icon: '',
            brand: appData.brand,
            packageName: appData.packageName,
            iosTokenId: appData.iosTokenId,
            color: appData.color,
            dailyLimitMinutes,
            usedMinutes: 0,
            isLocked: true,
            unlockedUntil: null,
          }
        })
        set({ apps: newApps })
        scheduleBlockingSync()
        // Persist nicknames into native App Group for tokens we just onboarded.
        const names: Record<string, string> = {}
        for (const app of newApps) {
          if (app.iosTokenId && app.name && !/^App \d+$/i.test(app.name)) {
            names[app.iosTokenId] = app.name
          }
        }
        if (Object.keys(names).length > 0) {
          void import('@/lib/replock-controls').then(({ setIosDisplayNames }) =>
            setIosDisplayNames(names)
          )
        }
      },

      setBlockingGoal: (openings, minutesPerOpening = 5) =>
        set((s) => ({
          profile: { ...s.profile, dailyOpenings: openings, minutesPerOpening },
          apps: s.apps.map((a) => ({
            ...a,
            dailyLimitMinutes: openings * minutesPerOpening,
          })),
        })),

      getEarnedMinutes: (type, amount) => {
        const { profile } = get()
        const difficulty = profile.isPro ? (profile.difficulty ?? FREE_DIFFICULTY) : FREE_DIFFICULTY
        return computeEarnedMinutes(type, amount, difficulty)
      },

      completeExercise: (type, amount, durationSeconds) => {
        const earned = get().getEarnedMinutes(type, amount)
        const today = localDateString()
        const { lastExerciseDate, currentStreak, longestStreak } = get()
        const { streak, longest } = updateStreak(lastExerciseDate, currentStreak, longestStreak, today)

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

        const today = localDateString()
        const { lastExerciseDate, currentStreak, longestStreak } = get()
        const { streak, longest } = updateStreak(lastExerciseDate, currentStreak, longestStreak, today)

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
        const boundary = applyUsageDayBoundary(get())
        if (boundary.rolled) {
          set({
            profile: boundary.profile,
            apps: boundary.apps,
            usageHistory: boundary.usageHistory,
          })
        }

        const { screenTimeBalance, apps, profile, usageHistory } = get()
        if (screenTimeBalance < minutes) return false

        const app = apps.find((a) => a.id === appId)
        if (!app) return false

        const today = localDateString()
        let openingsUsed = profile.openingsUsedToday ?? 0
        if (profile.openingsDate !== today) openingsUsed = 0
        const maxOpenings = profile.dailyOpenings ?? DEFAULT_DAILY_OPENINGS
        if (Number.isFinite(maxOpenings) && openingsUsed >= maxOpenings) return false

        const unlockUntil = Date.now() + minutes * 60 * 1000
        const nextOpenings = openingsUsed + 1

        set((s) => ({
          screenTimeBalance: s.screenTimeBalance - minutes,
          profile: {
            ...s.profile,
            openingsUsedToday: nextOpenings,
            openingsDate: today,
          },
          usageHistory: upsertUsageDay(
            usageHistory,
            today,
            sumUnlockedMinutes(apps),
            nextOpenings
          ),
          apps: s.apps.map((a) =>
            a.id === appId
              ? {
                  ...a,
                  isLocked: false,
                  unlockedUntil: unlockUntil,
                  unlockedAt: Date.now(),
                  usedMinutesAtUnlock: a.usedMinutes,
                }
              : a
          ),
        }))
        return true
      },

      useAppTime: (appId, minutes) => {
        set((s) => {
          const apps = s.apps.map((a) => {
            if (a.id !== appId) return a
            const newUsed = a.usedMinutes + minutes
            const limitReached = newUsed >= a.dailyLimitMinutes
            return {
              ...a,
              usedMinutes: newUsed,
              isLocked: limitReached,
              unlockedUntil: limitReached ? null : a.unlockedUntil,
            }
          })
          const today = localDateString()
          const openings =
            s.profile.openingsDate === today ? (s.profile.openingsUsedToday ?? 0) : 0
          return {
            apps,
            usageHistory: upsertUsageDay(s.usageHistory, today, sumUnlockedMinutes(apps), openings),
          }
        })
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

      renameApp: (appId, name, icon) => {
        const trimmed = name.trim()
        if (!trimmed) return
        set((s) => ({
          apps: s.apps.map((a) =>
            a.id === appId
              ? {
                  ...a,
                  name: trimmed,
                  ...(icon !== undefined ? { icon } : {}),
                }
              : a
          ),
        }))
        const app = get().apps.find((a) => a.id === appId)
        if (app?.iosTokenId) {
          void import('@/lib/replock-controls').then(({ setIosDisplayNames }) =>
            setIosDisplayNames({ [app.iosTokenId!]: trimmed })
          )
        }
      },

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
        set((s) => {
          const today = localDateString()
          return {
            profile: {
              ...s.profile,
              openingsUsedToday: 0,
              openingsDate: today,
            },
            apps: s.apps.map((a) => ({
              ...a,
              usedMinutes: 0,
              isLocked: true,
              unlockedUntil: null,
            })),
            usageHistory: upsertUsageDay(s.usageHistory, today, 0, 0),
          }
        }),
    }),
    {
      name: 'replock-storage',
      version: 11,
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
        if (version < 9) {
          state.profile = {
            ...state.profile,
            dailyOpenings: state.profile.dailyOpenings ?? DEFAULT_DAILY_OPENINGS,
            minutesPerOpening: state.profile.minutesPerOpening ?? 5,
          }
        }
        if (version < 10) {
          state.profile = {
            ...state.profile,
            openingsUsedToday: state.profile.openingsUsedToday ?? 0,
            openingsDate: state.profile.openingsDate ?? null,
          }
        }
        if (version < 11) {
          const today = localDateString()
          const openings =
            state.profile.openingsDate === today ? (state.profile.openingsUsedToday ?? 0) : 0
          state.usageHistory = upsertUsageDay(
            state.usageHistory,
            today,
            sumUnlockedMinutes(state.apps ?? []),
            openings
          )
        }
        return state as AppState & StoreActions
      },
      onRehydrateStorage: () => (state) => {
        if (state) {
          const trimmed = enforceAppLimit(state)
          if (trimmed.length !== state.apps.length) {
            state.apps = trimmed
          }
          const { streak, longest } = reconcileStreak(
            state.lastExerciseDate,
            state.currentStreak,
            state.longestStreak,
          )
          state.currentStreak = streak
          state.longestStreak = longest
          const boundary = applyUsageDayBoundary(state)
          state.profile = boundary.profile
          state.apps = boundary.apps
          state.usageHistory = boundary.usageHistory
        }
      },
    }
  )
)

// Check unlock expiry every 30 seconds; also reconcile streak if a day was missed
if (typeof window !== 'undefined') {
  setInterval(() => {
    const state = useStore.getState()
    const now = Date.now()
    const { streak, longest } = reconcileStreak(
      state.lastExerciseDate,
      state.currentStreak,
      state.longestStreak,
    )
    if (streak !== state.currentStreak || longest !== state.longestStreak) {
      useStore.setState({ currentStreak: streak, longestStreak: longest })
    }
    // Timed unlocks set isLocked:false with unlockedUntil; expiry must not require isLocked.
    const needsUpdate = state.apps.some((a) => {
      if (!a.unlockedUntil) return false
      if (a.unlockedUntil < now) return true
      if (a.unlockedAt) {
        const baseline = a.usedMinutesAtUnlock ?? a.usedMinutes
        const elapsed = Math.ceil((now - a.unlockedAt) / 60_000)
        return baseline + elapsed !== a.usedMinutes
      }
      return false
    })
    if (needsUpdate) {
      const nextApps = state.apps.map((a) => {
        if (!a.unlockedUntil) return a

        if (a.unlockedUntil < now) {
          const baseline = a.usedMinutesAtUnlock ?? a.usedMinutes
          const sessionMinutes = a.unlockedAt
            ? Math.max(1, Math.ceil((a.unlockedUntil - a.unlockedAt) / 60_000))
            : 0
          const newUsed = baseline + sessionMinutes
          return {
            ...a,
            usedMinutes: newUsed,
            isLocked: true,
            unlockedUntil: null,
            unlockedAt: null,
            usedMinutesAtUnlock: null,
          }
        }

        if (a.unlockedAt) {
          const baseline = a.usedMinutesAtUnlock ?? a.usedMinutes
          const elapsed = Math.ceil((now - a.unlockedAt) / 60_000)
          const newUsed = baseline + elapsed
          if (newUsed === a.usedMinutes) return a
          const limitReached = newUsed >= a.dailyLimitMinutes
          return {
            ...a,
            usedMinutes: newUsed,
            isLocked: limitReached,
            unlockedUntil: limitReached ? null : a.unlockedUntil,
            unlockedAt: limitReached ? null : a.unlockedAt,
            usedMinutesAtUnlock: limitReached ? null : a.usedMinutesAtUnlock,
          }
        }

        return a
      })
      const today = localDateString()
      const openings =
        state.profile.openingsDate === today ? (state.profile.openingsUsedToday ?? 0) : 0
      useStore.setState({
        apps: nextApps,
        usageHistory: upsertUsageDay(
          state.usageHistory,
          today,
          sumUnlockedMinutes(nextApps),
          openings
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
