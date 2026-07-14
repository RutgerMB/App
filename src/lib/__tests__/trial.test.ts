import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { UserProfile } from '@/types'
import { FREE_APP_LIMIT, TRIAL_APP_LIMIT, TRIAL_DAYS } from '@/types'
import {
  canAddMoreApps,
  getAppLimit,
  getAppLimitLabel,
  getTrialStatus,
  isTrialActive,
} from '../trial'

function makeProfile(overrides: Partial<UserProfile> = {}): UserProfile {
  return {
    name: 'Test',
    locale: 'en',
    difficulty: 'medium',
    onboardingComplete: true,
    isPro: false,
    stripeCustomerId: null,
    subscriptionId: null,
    subscriptionStatus: null,
    notificationsEnabled: true,
    createdAt: Date.now(),
    ...overrides,
  }
}

describe('isTrialActive', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-07-14T12:00:00Z'))
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('returns true within the trial window', () => {
    const createdAt = Date.now() - (TRIAL_DAYS - 1) * 24 * 60 * 60 * 1000
    expect(isTrialActive(createdAt)).toBe(true)
  })

  it('returns false after the trial window', () => {
    const createdAt = Date.now() - (TRIAL_DAYS + 1) * 24 * 60 * 60 * 1000
    expect(isTrialActive(createdAt)).toBe(false)
  })
})

describe('getAppLimit', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-07-14T12:00:00Z'))
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('returns Infinity for Pro users', () => {
    expect(getAppLimit(makeProfile({ isPro: true }))).toBe(Infinity)
  })

  it('returns trial limit during an active trial', () => {
    const createdAt = Date.now() - 2 * 24 * 60 * 60 * 1000
    expect(getAppLimit(makeProfile({ createdAt }))).toBe(TRIAL_APP_LIMIT)
  })

  it('returns free limit after trial expires', () => {
    const createdAt = Date.now() - (TRIAL_DAYS + 1) * 24 * 60 * 60 * 1000
    expect(getAppLimit(makeProfile({ createdAt }))).toBe(FREE_APP_LIMIT)
  })
})

describe('canAddMoreApps', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-07-14T12:00:00Z'))
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('allows adding apps below the trial limit', () => {
    const profile = makeProfile({ createdAt: Date.now() })
    expect(canAddMoreApps(profile, TRIAL_APP_LIMIT - 1)).toBe(true)
  })

  it('blocks adding apps at the trial limit', () => {
    const profile = makeProfile({ createdAt: Date.now() })
    expect(canAddMoreApps(profile, TRIAL_APP_LIMIT)).toBe(false)
  })

  it('blocks free users from adding more than one app after trial', () => {
    const createdAt = Date.now() - (TRIAL_DAYS + 1) * 24 * 60 * 60 * 1000
    const profile = makeProfile({ createdAt })
    expect(canAddMoreApps(profile, FREE_APP_LIMIT)).toBe(false)
  })

  it('allows Pro users regardless of app count', () => {
    const profile = makeProfile({ isPro: true })
    expect(canAddMoreApps(profile, 100)).toBe(true)
  })
})

describe('getAppLimitLabel', () => {
  it('shows infinity symbol for Pro users', () => {
    expect(getAppLimitLabel(makeProfile({ isPro: true }))).toBe('∞')
  })

  it('shows numeric limit for non-Pro users', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-07-14T12:00:00Z'))
    expect(getAppLimitLabel(makeProfile({ createdAt: Date.now() }))).toBe(String(TRIAL_APP_LIMIT))
    vi.useRealTimers()
  })
})

describe('getTrialStatus', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-07-14T12:00:00Z'))
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('returns pro for Pro users', () => {
    expect(getTrialStatus(makeProfile({ isPro: true }))).toBe('pro')
  })

  it('returns trial during active trial', () => {
    expect(getTrialStatus(makeProfile({ createdAt: Date.now() }))).toBe('trial')
  })

  it('returns expired after trial ends', () => {
    const createdAt = Date.now() - (TRIAL_DAYS + 1) * 24 * 60 * 60 * 1000
    expect(getTrialStatus(makeProfile({ createdAt }))).toBe('expired')
  })
})
