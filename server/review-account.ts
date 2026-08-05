import bcrypt from 'bcryptjs'
import {
  createUser,
  findUserByEmail,
  updateUserAppState,
  updateUserPassword,
  setEntitlement,
  ensureExternalUser,
} from './db.js'
import { getFirebaseAdminAuth } from './firebase-admin.js'

function grantReviewPro(userId: string): void {
  setEntitlement(userId, {
    isPro: true,
    stripeCustomerId: null,
    subscriptionId: null,
    subscriptionStatus: 'active',
    source: 'review',
  })
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
  updateUserAppState(jwtUser.id, {
    ...jwtUser.appState,
    profile: {
      ...jwtUser.appState.profile,
      onboardingComplete: true,
    },
    screenTimeBalance: 30,
  })

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

      ensureExternalUser(firebaseUser.uid, email)
      grantReviewPro(firebaseUser.uid)
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
