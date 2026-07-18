import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { AppState, ExerciseSession, ExerciseType, LockedApp, WorkoutPlanSession } from '@/types'
import { DEFAULT_DAILY_OPENINGS, DEFAULT_MAX_DAILY_HOURS, WORKOUT_PLANS } from '@/types'
import { localDateString } from '@/lib/dates'
import { reconcileStreak, restoredStreakState, updateStreak } from '@/lib/streaks'
import { canAddMoreApps, getAppLimit } from '@/lib/trial'
import { detectLocale } from '@/i18n'
import { computeEarnedMinutes, FREE_DIFFICULTY } from '@/lib/earning'
import { scheduleBlockingSync } from '@/lib/blocking-sync'
import {
  applyUsageDayBoundary,
  upsertUsageDay,
  sumUnlockedMinutes,
  buildUsageByApp,
} from '@/lib/usage-history'
import { applyDailyEarnCap, clampMaxDailyHours } from '@/lib/daily-earn-cap'
import { clampUnlocksLeft } from '@/lib/numeric-input'
import {
  consumeStreakResetToken,
  localMonthKey,
  refillStreakResetTokensIfNeeded,
  STREAK_RESET_TOKENS_MAX,
} from '@/lib/streak-tokens'
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
    maxDailyHours: DEFAULT_MAX_DAILY_HOURS,
    earnedMinutesToday: 0,
    earnedDate: null,
    streakResetTokens: 0,
    streakResetTokensMonth: localMonthKey(),
    createdAt: Date.now(),
  },
  screenTimeBalance: 0,
  totalEarnedMinutes: 0,
  totalExercises: 0,
  currentStreak: 0,
  longestStreak: 0,
  lastExerciseDate: null,
  lastLostStreak: 0,
  apps: [],
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
  /**
   * Merge Apple FamilyActivityPicker results (with nicknames) into the lock list.
   * Replaces prior iOS-token apps; keeps Android/package apps untouched.
   * Returns how many apps ended up in the iOS lock set (capped by plan limit).
   */
  syncIosPickedApps: (
    picked: DeviceAppDefinition[],
    dailyLimitMinutes?: number
  ) => { synced: number; truncated: boolean }
  setBlockingGoal: (openings: number, minutesPerOpening?: number) => void
  /** Set how many blocked-app openings remain today (adjusts dailyOpenings around openingsUsedToday). */
  setOpeningsLeftToday: (remaining: number) => void
  /** Cap on minutes earnable per calendar day (1–12h, minute precision). */
  setMaxDailyHours: (hours: number) => void
  /** Ensure Pro streak-reset tokens are refilled for the current local month. */
  ensureStreakTokensRefilled: () => void
  /**
   * Restore lastLostStreak for Pro users (consumes 1 token). Returns false if not allowed.
   * Free users should be sent to pricing by the UI instead.
   */
  restoreLostStreak: () => boolean
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

      syncIosPickedApps: (picked, dailyLimitMinutes) => {
        const state = get()
        const limitMins =
          dailyLimitMinutes ??
          (state.profile.dailyOpenings ?? DEFAULT_DAILY_OPENINGS) *
            (state.profile.minutesPerOpening ?? 5)

        const nonIos = state.apps.filter((a) => !a.iosTokenId)
        const byToken = new Map(
          state.apps.filter((a) => a.iosTokenId).map((a) => [a.iosTokenId!, a])
        )

        const nextIos: LockedApp[] = []
        const names: Record<string, string> = {}

        for (const appData of picked) {
          const tokenId = appData.iosTokenId || appData.id
          if (!tokenId) continue
          const rawName = (appData.name || '').trim()
          const isPlaceholder = /^App \d+$/i.test(rawName)
          const name = isPlaceholder ? rawName : rawName || 'App'
          const existing = byToken.get(tokenId)
          if (existing) {
            nextIos.push({
              ...existing,
              name: isPlaceholder ? existing.name : name,
              color: appData.color || existing.color,
              brand: appData.brand ?? existing.brand,
            })
          } else {
            nextIos.push({
              id: generateId(),
              name,
              icon: '',
              brand: appData.brand,
              packageName: appData.packageName,
              iosTokenId: tokenId,
              color: appData.color,
              dailyLimitMinutes: limitMins,
              usedMinutes: 0,
              isLocked: true,
              unlockedUntil: null,
            })
          }
          if (!isPlaceholder && name) names[tokenId] = name
        }

        const planLimit = getAppLimit(state.profile)
        const roomForIos =
          planLimit === Infinity
            ? nextIos.length
            : Math.max(0, planLimit - nonIos.length)
        const truncated = nextIos.length > roomForIos
        const cappedIos = nextIos.slice(0, roomForIos)

        set({ apps: [...nonIos, ...cappedIos] })
        scheduleBlockingSync()

        if (Object.keys(names).length > 0) {
          void import('@/lib/replock-controls').then(({ setIosDisplayNames }) =>
            setIosDisplayNames(names)
          )
        }

        return { synced: cappedIos.length, truncated }
      },

      setBlockingGoal: (openings, minutesPerOpening = 5) =>
        set((s) => ({
          profile: { ...s.profile, dailyOpenings: openings, minutesPerOpening },
          apps: s.apps.map((a) => ({
            ...a,
            dailyLimitMinutes: openings * minutesPerOpening,
          })),
        })),

      setOpeningsLeftToday: (remaining) => {
        const today = localDateString()
        const { profile } = get()
        const used =
          profile.openingsDate === today ? (profile.openingsUsedToday ?? 0) : 0
        const left = clampUnlocksLeft(Number(remaining) || 1)
        const minutesPerOpening = profile.minutesPerOpening ?? 5
        // remaining = dailyOpenings − used → keep used, raise/lower the daily cap
        const dailyOpenings = used + left
        set((s) => ({
          profile: {
            ...s.profile,
            dailyOpenings,
            minutesPerOpening,
            openingsUsedToday: used,
            openingsDate: today,
          },
          apps: s.apps.map((a) => ({
            ...a,
            dailyLimitMinutes: dailyOpenings * minutesPerOpening,
          })),
        }))
      },

      setMaxDailyHours: (hours) => {
        set((s) => ({
          profile: {
            ...s.profile,
            maxDailyHours: clampMaxDailyHours(hours),
          },
        }))
      },

      ensureStreakTokensRefilled: () => {
        const { profile } = get()
        const next = refillStreakResetTokensIfNeeded({
          isPro: profile.isPro,
          tokens: profile.streakResetTokens,
          tokensMonth: profile.streakResetTokensMonth,
        })
        if (
          next.tokens !== (profile.streakResetTokens ?? 0) ||
          next.tokensMonth !== (profile.streakResetTokensMonth ?? null)
        ) {
          set((s) => ({
            profile: {
              ...s.profile,
              streakResetTokens: next.tokens,
              streakResetTokensMonth: next.tokensMonth,
            },
          }))
        }
      },

      restoreLostStreak: () => {
        const state = get()
        const lost = state.lastLostStreak
        if (lost <= 1 || state.currentStreak > 0) return false
        if (!state.profile.isPro) return false

        const refilled = refillStreakResetTokensIfNeeded({
          isPro: true,
          tokens: state.profile.streakResetTokens,
          tokensMonth: state.profile.streakResetTokensMonth,
        })
        if (refilled.tokens < 1) return false

        const restored = restoredStreakState(lost)
        set((s) => ({
          currentStreak: restored.streak,
          longestStreak: Math.max(s.longestStreak, restored.streak),
          lastExerciseDate: restored.lastExerciseDate,
          lastLostStreak: 0,
          profile: {
            ...s.profile,
            streakResetTokens: consumeStreakResetToken(refilled.tokens),
            streakResetTokensMonth: refilled.tokensMonth,
          },
        }))
        return true
      },

      getEarnedMinutes: (type, amount) => {
        const { profile } = get()
        const difficulty = profile.isPro ? (profile.difficulty ?? FREE_DIFFICULTY) : FREE_DIFFICULTY
        return computeEarnedMinutes(type, amount, difficulty)
      },

      completeExercise: (type, amount, durationSeconds) => {
        const rawEarned = get().getEarnedMinutes(type, amount)
        const today = localDateString()
        const { lastExerciseDate, currentStreak, longestStreak, lastLostStreak, profile } = get()
        const { streak, longest, lostStreak } = updateStreak(
          lastExerciseDate,
          currentStreak,
          longestStreak,
          today,
        )
        const capped = applyDailyEarnCap({
          rawEarned,
          earnedMinutesToday: profile.earnedMinutesToday,
          earnedDate: profile.earnedDate,
          today,
          maxDailyHours: profile.maxDailyHours,
        })
        const earned = capped.applied

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
          lastLostStreak:
            lastExerciseDate === today
              ? lastLostStreak
              : lostStreak != null
                ? lostStreak
                : 0,
          sessions: [session, ...s.sessions].slice(0, 100),
          profile: {
            ...s.profile,
            earnedMinutesToday: capped.earnedMinutesToday,
            earnedDate: capped.earnedDate,
          },
        }))

        return earned
      },

      completeWorkoutPlan: (planId, results) => {
        const plan = WORKOUT_PLANS.find((p) => p.id === planId)
        if (!plan) return { total: 0, bonus: 0 }

        const today = localDateString()
        const { lastExerciseDate, currentStreak, longestStreak, lastLostStreak, profile } = get()
        const { streak, longest, lostStreak } = updateStreak(
          lastExerciseDate,
          currentStreak,
          longestStreak,
          today,
        )

        let base = 0
        const uncappedSessions: ExerciseSession[] = results.map((r) => {
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

        const bonusRaw = Math.round(base * (plan.bonusPercent / 100) * 10) / 10
        const uncappedTotal = base + bonusRaw
        const capped = applyDailyEarnCap({
          rawEarned: uncappedTotal,
          earnedMinutesToday: profile.earnedMinutesToday,
          earnedDate: profile.earnedDate,
          today,
          maxDailyHours: profile.maxDailyHours,
        })
        const total = capped.applied
        const scale = uncappedTotal > 0 ? total / uncappedTotal : 0
        const bonus = Math.round(bonusRaw * scale * 10) / 10
        const newSessions = uncappedSessions.map((s) => ({
          ...s,
          earnedMinutes: Math.round(s.earnedMinutes * scale * 10) / 10,
        }))
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
          lastLostStreak:
            lastExerciseDate === today
              ? lastLostStreak
              : lostStreak != null
                ? lostStreak
                : 0,
          sessions: [...newSessions, ...s.sessions].slice(0, 150),
          workoutPlanSessions: [planSession, ...s.workoutPlanSessions].slice(0, 50),
          profile: {
            ...s.profile,
            earnedMinutesToday: capped.earnedMinutesToday,
            earnedDate: capped.earnedDate,
          },
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
            nextOpenings,
            buildUsageByApp(apps)
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
        scheduleBlockingSync()
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
            usageHistory: upsertUsageDay(
              s.usageHistory,
              today,
              sumUnlockedMinutes(apps),
              openings,
              buildUsageByApp(apps)
            ),
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
        scheduleBlockingSync()
        return true
      },

      removeApp: (appId) => {
        const removed = get().apps.find((a) => a.id === appId)
        set((s) => ({ apps: s.apps.filter((a) => a.id !== appId) }))
        // Same path as picker save: rebuild shields from the remaining lock list.
        scheduleBlockingSync()
        // Prune FamilyActivitySelection + clear ManagedSettings for this opaque token.
        if (removed?.iosTokenId) {
          void import('@/lib/replock-controls').then(({ removeIosTokens }) =>
            removeIosTokens([removed.iosTokenId!])
          )
        }
      },

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
        set((s) => {
          const tokens = refillStreakResetTokensIfNeeded({
            isPro,
            tokens: isPro
              ? (s.profile.streakResetTokens ?? STREAK_RESET_TOKENS_MAX)
              : 0,
            tokensMonth: s.profile.streakResetTokensMonth,
          })
          return {
            profile: {
              ...s.profile,
              isPro,
              difficulty: isPro ? s.profile.difficulty : FREE_DIFFICULTY,
              stripeCustomerId: customerId ?? s.profile.stripeCustomerId,
              subscriptionId: subscriptionId ?? s.profile.subscriptionId,
              subscriptionStatus: status ?? (isPro ? 'active' : null),
              streakResetTokens: isPro ? tokens.tokens : 0,
              streakResetTokensMonth: tokens.tokensMonth,
            },
          }
        }),

      resetDailyUsage: () =>
        set((s) => {
          const today = localDateString()
          return {
            profile: {
              ...s.profile,
              openingsUsedToday: 0,
              openingsDate: today,
              earnedMinutesToday: 0,
              earnedDate: today,
            },
            apps: s.apps.map((a) => ({
              ...a,
              usedMinutes: 0,
              isLocked: true,
              unlockedUntil: null,
            })),
            usageHistory: upsertUsageDay(s.usageHistory, today, 0, 0, []),
          }
        }),
    }),
    {
      name: 'replock-storage',
      version: 13,
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
            openings,
            buildUsageByApp(state.apps ?? [])
          )
        }
        if (version < 12) {
          state.profile = {
            ...state.profile,
            maxDailyHours: clampMaxDailyHours(state.profile.maxDailyHours),
            earnedMinutesToday: state.profile.earnedMinutesToday ?? 0,
            earnedDate: state.profile.earnedDate ?? null,
          }
          // Backfill per-app breakdown for today from live apps.
          const today = localDateString()
          const openings =
            state.profile.openingsDate === today ? (state.profile.openingsUsedToday ?? 0) : 0
          state.usageHistory = upsertUsageDay(
            state.usageHistory,
            today,
            sumUnlockedMinutes(state.apps ?? []),
            openings,
            buildUsageByApp(state.apps ?? [])
          )
        }
        if (version < 13) {
          const tokens = refillStreakResetTokensIfNeeded({
            isPro: state.profile.isPro,
            tokens: state.profile.isPro ? STREAK_RESET_TOKENS_MAX : 0,
            tokensMonth: null,
          })
          state.lastLostStreak = Math.max(0, Math.floor(state.lastLostStreak ?? 0))
          state.profile = {
            ...state.profile,
            streakResetTokens: tokens.tokens,
            streakResetTokensMonth: tokens.tokensMonth,
          }
        }
        return state as AppState & StoreActions
      },
      onRehydrateStorage: () => (state) => {
        if (state) {
          const trimmed = enforceAppLimit(state)
          if (trimmed.length !== state.apps.length) {
            state.apps = trimmed
          }
          const { streak, longest, justLostStreak } = reconcileStreak(
            state.lastExerciseDate,
            state.currentStreak,
            state.longestStreak,
          )
          state.currentStreak = streak
          state.longestStreak = longest
          if (justLostStreak != null) {
            state.lastLostStreak = justLostStreak
          } else {
            state.lastLostStreak = Math.max(0, Math.floor(state.lastLostStreak ?? 0))
          }
          const tokens = refillStreakResetTokensIfNeeded({
            isPro: state.profile.isPro,
            tokens: state.profile.streakResetTokens,
            tokensMonth: state.profile.streakResetTokensMonth,
          })
          state.profile = {
            ...state.profile,
            streakResetTokens: tokens.tokens,
            streakResetTokensMonth: tokens.tokensMonth,
          }
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
    const { streak, longest, justLostStreak } = reconcileStreak(
      state.lastExerciseDate,
      state.currentStreak,
      state.longestStreak,
    )
    const tokens = refillStreakResetTokensIfNeeded({
      isPro: state.profile.isPro,
      tokens: state.profile.streakResetTokens,
      tokensMonth: state.profile.streakResetTokensMonth,
    })
    const tokenChanged =
      tokens.tokens !== (state.profile.streakResetTokens ?? 0) ||
      tokens.tokensMonth !== (state.profile.streakResetTokensMonth ?? null)
    if (
      streak !== state.currentStreak ||
      longest !== state.longestStreak ||
      justLostStreak != null ||
      tokenChanged
    ) {
      useStore.setState({
        currentStreak: streak,
        longestStreak: longest,
        ...(justLostStreak != null ? { lastLostStreak: justLostStreak } : {}),
        ...(tokenChanged
          ? {
              profile: {
                ...state.profile,
                streakResetTokens: tokens.tokens,
                streakResetTokensMonth: tokens.tokensMonth,
              },
            }
          : {}),
      })
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
          openings,
          buildUsageByApp(nextApps)
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
