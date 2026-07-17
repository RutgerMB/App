import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { AppState } from '@/types'
import { normalizeAppState } from '@/lib/app-state'
import { loginAccount, registerAccount, syncAppState, deleteAccount, type AuthUser } from '@/lib/auth-api'
import { isDevToken, DEV_TOKEN } from '@/lib/dev-auth'
import { isFirebaseConfigured } from '@/lib/firebase'
import {
  firebaseRegister,
  firebaseLogin,
  firebaseLogout,
  firebaseDeleteAccount,
  firebaseChangePassword,
  firebaseIsEmailPasswordUser,
  firebaseSaveAppState,
  firebaseGetIdToken,
  firebaseSendPasswordReset,
  subscribeToAuthState,
  restoreFirebaseSession,
} from '@/lib/firebase-auth'
import { stripProFieldsFromSnapshot } from '@/lib/entitlement-sanitize'
import { syncEntitlementOnLaunch } from '@/lib/entitlement'
import { initMobilePurchases } from '@/lib/mobile-purchases'
import { mapAuthError } from '@/lib/auth-errors'
import { useStore } from '@/store'

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
    usageHistory: s.usageHistory ?? [],
  }
}

export function applyAppState(state: AppState) {
  const normalized = normalizeAppState(state)
  useStore.setState(normalized)
}

interface AuthState {
  token: string | null
  user: AuthUser | null
  initialized: boolean
  usesFirebase: boolean
  initAuth: () => Promise<void>
  register: (email: string, password: string, name: string) => Promise<void>
  login: (email: string, password: string) => Promise<void>
  sendPasswordReset: (email: string) => Promise<void>
  changePassword: (currentPassword: string, newPassword: string) => Promise<void>
  canChangePassword: () => boolean
  devLogin: () => void
  logout: () => Promise<void>
  deleteAccount: (password: string) => Promise<void>
  syncNow: () => Promise<void>
  refreshToken: () => Promise<string | null>
}

let syncTimer: ReturnType<typeof setTimeout> | null = null
let unsubscribeAuth: (() => void) | null = null

async function linkMobilePurchases(userId: string) {
  await initMobilePurchases(userId).catch(() => {})
  await syncEntitlementOnLaunch().catch(() => {})
}

export function scheduleCloudSync() {
  const { token, usesFirebase } = useAuthStore.getState()
  if (!token) return
  if (isDevToken(token) && !usesFirebase) return
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
      initialized: false,
      usesFirebase: isFirebaseConfigured(),

      initAuth: async () => {
        if (!isFirebaseConfigured()) {
          set({ initialized: true })
          return
        }

        if (!unsubscribeAuth) {
          unsubscribeAuth = subscribeToAuthState(async (firebaseUser) => {
            if (!firebaseUser) {
              set({ token: null, user: null })
              return
            }

            const session = await restoreFirebaseSession()
            if (!session) return

            set({
              token: session.idToken,
              user: session.user,
              usesFirebase: true,
            })
            // Only apply when Firestore returned a snapshot — never overwrite local with empty defaults.
            if (session.appState) applyAppState(session.appState)
            await linkMobilePurchases(session.user.id)
          })
        }

        const session = await restoreFirebaseSession()
        if (session) {
          set({
            token: session.idToken,
            user: session.user,
            usesFirebase: true,
          })
          if (session.appState) applyAppState(session.appState)
          await linkMobilePurchases(session.user.id)
        } else {
          set({ token: null, user: null, usesFirebase: true })
        }

        set({ initialized: true })
      },

      register: async (email, password, name) => {
        try {
          if (isFirebaseConfigured()) {
            const res = await firebaseRegister(email, password, name)
            set({ token: res.idToken, user: res.user, usesFirebase: true })
            applyAppState(res.appState)
            useStore.setState((s) => ({
              profile: { ...s.profile, name: name.trim(), email: email.trim().toLowerCase() },
            }))
            await linkMobilePurchases(res.user.id)
            return
          }

          const res = await registerAccount(email, password, name)
          set({ token: res.token, user: res.user, usesFirebase: false })
          applyAppState(res.appState)
          await linkMobilePurchases(res.user.id)
          useStore.setState((s) => ({
            profile: { ...s.profile, name: name.trim(), email: email.trim().toLowerCase() },
          }))
        } catch (err) {
          throw mapAuthError(err)
        }
      },

      login: async (email, password) => {
        try {
          if (isFirebaseConfigured()) {
            const res = await firebaseLogin(email, password)
            set({ token: res.idToken, user: res.user, usesFirebase: true })
            applyAppState(res.appState)
            await linkMobilePurchases(res.user.id)
            return
          }

          const res = await loginAccount(email, password)
          set({ token: res.token, user: res.user, usesFirebase: false })
          applyAppState(res.appState)
          await linkMobilePurchases(res.user.id)
        } catch (err) {
          throw mapAuthError(err)
        }
      },

      sendPasswordReset: async (email) => {
        if (!isFirebaseConfigured()) {
          throw new Error('Password reset is only available with Firebase Auth.')
        }
        try {
          await firebaseSendPasswordReset(email)
        } catch (err) {
          throw mapAuthError(err)
        }
      },

      canChangePassword: () => {
        const { token, usesFirebase } = get()
        if (!token || isDevToken(token)) return false
        if (!usesFirebase || !isFirebaseConfigured()) return false
        return firebaseIsEmailPasswordUser()
      },

      changePassword: async (currentPassword, newPassword) => {
        const { token, usesFirebase } = get()
        if (!token || isDevToken(token)) {
          throw new Error('Cannot change password for a local dev session.')
        }
        if (!usesFirebase || !isFirebaseConfigured()) {
          throw new Error('Password change is only available with Firebase Auth.')
        }
        try {
          await firebaseChangePassword(currentPassword, newPassword)
        } catch (err) {
          throw mapAuthError(err)
        }
      },

      devLogin: () => {
        const profile = useStore.getState().profile
        if (!profile.onboardingComplete) {
          useStore.getState().completeOnboarding(profile.name.trim() || 'Dev', profile.difficulty ?? 'medium')
        }
        useStore.setState((s) => ({
          profile: {
            ...s.profile,
            email: s.profile.email || 'dev@replock.local',
          },
        }))
        set({
          token: DEV_TOKEN,
          user: { id: 'dev-user', email: 'dev@replock.local', name: profile.name.trim() || 'Dev' },
          usesFirebase: false,
        })
      },

      logout: async () => {
        const { usesFirebase } = get()
        if (usesFirebase && isFirebaseConfigured()) {
          await firebaseLogout()
        }
        set({ token: null, user: null })
        useStore.persist.clearStorage()
        window.location.href = '/login'
      },

      deleteAccount: async (password) => {
        const { token, usesFirebase } = get()
        if (!token || isDevToken(token)) {
          throw new Error('Cannot delete a local dev session. Sign out instead.')
        }

        if (usesFirebase && isFirebaseConfigured()) {
          try {
            await firebaseDeleteAccount(password)
          } catch (err) {
            throw mapAuthError(err)
          }
        } else {
          await deleteAccount(token, password)
        }

        set({ token: null, user: null })
        useStore.persist.clearStorage()
        window.location.href = '/login'
      },

      refreshToken: async () => {
        const { usesFirebase, token } = get()
        if (usesFirebase && isFirebaseConfigured()) {
          // Force refresh after long native sheets (IAP paywall) so the server
          // does not reject a stale ID token.
          let idToken = await firebaseGetIdToken(true)
          if (!idToken) idToken = await firebaseGetIdToken(false)
          if (idToken) set({ token: idToken })
          return idToken
        }
        return token
      },

      syncNow: async () => {
        const { token, user, usesFirebase } = get()
        if (!token || isDevToken(token)) return

        const snapshot = stripProFieldsFromSnapshot(getAppStateSnapshot())

        if (usesFirebase && isFirebaseConfigured() && user) {
          await firebaseSaveAppState(user.id, snapshot)
          return
        }

        const freshToken = await get().refreshToken()
        if (!freshToken) return
        await syncAppState(freshToken, snapshot)
      },
    }),
    {
      name: 'replock-auth',
      partialize: (state) => ({
        token: state.usesFirebase ? null : state.token,
        user: state.user,
        usesFirebase: state.usesFirebase,
      }),
    }
  )
)

if (typeof window !== 'undefined') {
  useStore.subscribe(() => scheduleCloudSync())
}
