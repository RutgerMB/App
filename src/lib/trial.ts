import type { UserProfile } from '@/types'
import { FREE_APP_LIMIT, TRIAL_APP_LIMIT, TRIAL_DAYS } from '@/types'

export function isTrialActive(createdAt: number): boolean {
  const elapsed = Date.now() - createdAt
  return elapsed < TRIAL_DAYS * 24 * 60 * 60 * 1000
}

export function getTrialDaysRemaining(createdAt: number): number {
  const end = createdAt + TRIAL_DAYS * 24 * 60 * 60 * 1000
  const remaining = Math.ceil((end - Date.now()) / (24 * 60 * 60 * 1000))
  return Math.max(0, remaining)
}

export function getTrialHoursRemaining(createdAt: number): number {
  const end = createdAt + TRIAL_DAYS * 24 * 60 * 60 * 1000
  return Math.max(0, Math.ceil((end - Date.now()) / (60 * 60 * 1000)))
}

export function getAppLimit(profile: UserProfile): number {
  if (profile.isPro) return Infinity
  if (isTrialActive(profile.createdAt)) return TRIAL_APP_LIMIT
  return FREE_APP_LIMIT
}

export function getAppLimitLabel(profile: UserProfile): string {
  const limit = getAppLimit(profile)
  if (limit === Infinity) return '∞'
  return String(limit)
}

export function canAddMoreApps(profile: UserProfile, currentCount: number): boolean {
  return currentCount < getAppLimit(profile)
}

export function getTrialStatus(profile: UserProfile): 'pro' | 'trial' | 'expired' {
  if (profile.isPro) return 'pro'
  if (isTrialActive(profile.createdAt)) return 'trial'
  return 'expired'
}
