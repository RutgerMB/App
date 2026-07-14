import { describe, expect, it } from 'vitest'
import type { AppState } from '../../src/types/index.js'
import { sanitizeAppStateForSync } from '../entitlement.js'

function makeAppState(profileOverrides: Partial<AppState['profile']> = {}): AppState {
  return {
    profile: {
      name: 'Test User',
      email: 'test@example.com',
      locale: 'en',
      difficulty: 'medium',
      onboardingComplete: true,
      isPro: false,
      stripeCustomerId: null,
      subscriptionId: null,
      subscriptionStatus: null,
      notificationsEnabled: true,
      createdAt: Date.now(),
      ...profileOverrides,
    },
    screenTimeBalance: 42,
    totalEarnedMinutes: 10,
    totalExercises: 5,
    currentStreak: 2,
    longestStreak: 7,
    lastExerciseDate: '2026-07-14',
    apps: [],
    sessions: [],
    workoutPlanSessions: [],
  }
}

describe('sanitizeAppStateForSync', () => {
  it('strips client isPro:true when server has no entitlement', () => {
    const existing = makeAppState({ isPro: false })
    const incoming = makeAppState({
      isPro: true,
      stripeCustomerId: 'cus_hacked',
      subscriptionId: 'sub_hacked',
      subscriptionStatus: 'active',
    })

    const sanitized = sanitizeAppStateForSync(existing, incoming)

    expect(sanitized.profile.isPro).toBe(false)
    expect(sanitized.profile.stripeCustomerId).toBeNull()
    expect(sanitized.profile.subscriptionId).toBeNull()
    expect(sanitized.profile.subscriptionStatus).toBeNull()
  })

  it('strips client isPro:true when server entitlement is free', () => {
    const existing = makeAppState({ isPro: false })
    const incoming = makeAppState({
      isPro: true,
      stripeCustomerId: 'cus_hacked',
      subscriptionId: 'sub_hacked',
      subscriptionStatus: 'active',
    })

    const sanitized = sanitizeAppStateForSync(existing, incoming, {
      isPro: false,
      stripeCustomerId: null,
      subscriptionId: null,
      subscriptionStatus: null,
    })

    expect(sanitized.profile.isPro).toBe(false)
    expect(sanitized.profile.stripeCustomerId).toBeNull()
    expect(sanitized.profile.subscriptionId).toBeNull()
    expect(sanitized.profile.subscriptionStatus).toBeNull()
  })

  it('preserves server Pro entitlement over client isPro:false', () => {
    const existing = makeAppState({
      isPro: true,
      stripeCustomerId: 'cus_server',
      subscriptionId: 'sub_server',
      subscriptionStatus: 'active',
    })
    const incoming = makeAppState({
      isPro: false,
      stripeCustomerId: null,
      subscriptionId: null,
      subscriptionStatus: null,
    })

    const sanitized = sanitizeAppStateForSync(existing, incoming)

    expect(sanitized.profile.isPro).toBe(true)
    expect(sanitized.profile.stripeCustomerId).toBe('cus_server')
    expect(sanitized.profile.subscriptionId).toBe('sub_server')
    expect(sanitized.profile.subscriptionStatus).toBe('active')
  })

  it('preserves non-entitlement profile fields from incoming state', () => {
    const existing = makeAppState({ isPro: false })
    const incoming = makeAppState({
      name: 'Updated Name',
      isPro: true,
      difficulty: 'hard',
    })

    const sanitized = sanitizeAppStateForSync(existing, incoming)

    expect(sanitized.profile.name).toBe('Updated Name')
    expect(sanitized.profile.difficulty).toBe('hard')
    expect(sanitized.screenTimeBalance).toBe(42)
    expect(sanitized.totalEarnedMinutes).toBe(10)
  })
})
