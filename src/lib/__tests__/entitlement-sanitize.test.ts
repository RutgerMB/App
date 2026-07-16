import { describe, expect, it } from 'vitest'
import type { AppState } from '@/types'
import { stripProFieldsFromSnapshot } from '../entitlement-sanitize'

function makeAppState(profileOverrides: Partial<AppState['profile']> = {}): AppState {
  return {
    profile: {
      name: 'Test User',
      email: 'test@example.com',
      locale: 'en',
      difficulty: 'medium',
      onboardingComplete: true,
      isPro: true,
      stripeCustomerId: 'cus_client',
      subscriptionId: 'sub_client',
      subscriptionStatus: 'active',
      notificationsEnabled: true,
      createdAt: Date.now(),
      ...profileOverrides,
    },
    screenTimeBalance: 15,
    totalEarnedMinutes: 20,
    totalExercises: 3,
    currentStreak: 1,
    longestStreak: 4,
    lastExerciseDate: null,
    apps: [],
    sessions: [],
    workoutPlanSessions: [],
    usageHistory: [],
  }
}

describe('stripProFieldsFromSnapshot', () => {
  it('removes Pro and billing fields from the snapshot', () => {
    const snapshot = makeAppState()

    const stripped = stripProFieldsFromSnapshot(snapshot)

    expect(stripped.profile.isPro).toBe(false)
    expect(stripped.profile.stripeCustomerId).toBeNull()
    expect(stripped.profile.subscriptionId).toBeNull()
    expect(stripped.profile.subscriptionStatus).toBeNull()
  })

  it('keeps other profile and state fields intact', () => {
    const snapshot = makeAppState({
      name: 'RepLock User',
      difficulty: 'unstoppable',
    })

    const stripped = stripProFieldsFromSnapshot(snapshot)

    expect(stripped.profile.name).toBe('RepLock User')
    expect(stripped.profile.difficulty).toBe('unstoppable')
    expect(stripped.profile.email).toBe('test@example.com')
    expect(stripped.screenTimeBalance).toBe(15)
    expect(stripped.totalEarnedMinutes).toBe(20)
  })
})
