import bcrypt from 'bcryptjs'
import { createUser, findUserByEmail, updateUserAppState } from './db.js'

/** Ensures an App Store review account exists when env vars are set. */
export async function ensureAppReviewAccount(): Promise<void> {
  const email = process.env.APP_REVIEW_EMAIL?.trim().toLowerCase()
  const password = process.env.APP_REVIEW_PASSWORD
  if (!email || !password) return

  if (findUserByEmail(email)) return

  const passwordHash = await bcrypt.hash(password, 10)
  const user = createUser({
    id: `review-${Date.now()}`,
    email,
    passwordHash,
    name: 'App Review',
    createdAt: Date.now(),
  })

  updateUserAppState(user.id, {
    ...user.appState,
    profile: {
      ...user.appState.profile,
      onboardingComplete: true,
      isPro: true,
      subscriptionStatus: 'active',
    },
    screenTimeBalance: 30,
  })

  console.log(`✅ App Review account ready: ${email}`)
}
