import bcrypt from 'bcryptjs'
import { FieldValue } from 'firebase-admin/firestore'
import {
  createUser,
  createEmptyAppState,
  findUserByEmail,
  findUserById,
  updateUserAppState,
  updateUserPassword,
  setEntitlement,
  ensureExternalUser,
} from './db.js'
import { getFirebaseAdminAuth, getFirebaseAdminFirestore } from './firebase-admin.js'
import type { AppState } from '../src/types/index.js'

function grantReviewPro(userId: string): void {
  setEntitlement(userId, {
    isPro: true,
    stripeCustomerId: null,
    subscriptionId: null,
    subscriptionStatus: 'active',
    source: 'review',
  })
}

function withReviewOnboarding(appState: AppState, email: string): AppState {
  return {
    ...appState,
    profile: {
      ...appState.profile,
      name: 'App Review',
      email,
      onboardingComplete: true,
    },
    screenTimeBalance: Math.max(appState.screenTimeBalance ?? 0, 30),
  }
}

/** Ensures an App Store review account exists when env vars are set. */
export async function ensureAppReviewAccount(): Promise<void> {
  const email = process.env.APP_REVIEW_EMAIL?.trim().toLowerCase()
  const password = process.env.APP_REVIEW_PASSWORD
  if (!email || !password) return

  // JWT / Express path (used when the store build does not bake Firebase client config)
  const passwordHash = await bcrypt.hash(password, 10)
  let jwtUser = findUserByEmail(email)
  if (!jwtUser) {
    jwtUser = createUser({
      id: `review-${Date.now()}`,
      email,
      passwordHash,
      name: 'App Review',
      createdAt: Date.now(),
    })
  } else {
    updateUserPassword(jwtUser.id, passwordHash)
  }

  grantReviewPro(jwtUser.id)
  updateUserAppState(jwtUser.id, withReviewOnboarding(jwtUser.appState, email))

  // Firebase path (required when VITE_FIREBASE_* is baked into the store build)
  const adminAuth = getFirebaseAdminAuth()
  if (adminAuth) {
    try {
      let firebaseUser
      try {
        firebaseUser = await adminAuth.getUserByEmail(email)
        await adminAuth.updateUser(firebaseUser.uid, {
          password,
          displayName: 'App Review',
          emailVerified: true,
        })
      } catch {
        firebaseUser = await adminAuth.createUser({
          email,
          password,
          displayName: 'App Review',
          emailVerified: true,
        })
      }

      ensureExternalUser(firebaseUser.uid, email, 'App Review')
      grantReviewPro(firebaseUser.uid)

      const stored = findUserById(firebaseUser.uid)
      if (stored) {
        updateUserAppState(firebaseUser.uid, withReviewOnboarding(stored.appState, email))
      }

      // Onboarding lives in Firestore for Firebase logins — seed/update that doc too.
      const firestore = getFirebaseAdminFirestore()
      if (firestore) {
        const ref = firestore.collection('users').doc(firebaseUser.uid)
        const snap = await ref.get()
        const existing = snap.exists ? (snap.data() as { appState?: AppState } | undefined) : undefined
        const base = existing?.appState ?? stored?.appState ?? createEmptyAppState('App Review', email)
        const appState = withReviewOnboarding(base, email)
        // Never store isPro in Firestore — server entitlement is authoritative.
        appState.profile.isPro = false
        appState.profile.stripeCustomerId = null
        appState.profile.subscriptionId = null
        appState.profile.subscriptionStatus = null

        await ref.set(
          {
            email,
            name: 'App Review',
            appState,
            updatedAt: FieldValue.serverTimestamp(),
          },
          { merge: true }
        )
      } else {
        console.warn('App Review: Firestore Admin unavailable — onboarding may still be required on login')
      }

      console.log(`✅ App Review Firebase account ready: ${email} (uid ${firebaseUser.uid})`)
    } catch (err) {
      console.warn(
        'App Review Firebase user could not be created/updated:',
        err instanceof Error ? err.message : err
      )
    }
  } else {
    console.log(
      `✅ App Review JWT account ready: ${email} (add FIREBASE_SERVICE_ACCOUNT_JSON if the store build uses Firebase Auth)`
    )
  }
}
