import { describe, expect, it } from 'vitest'
import type { LockedApp } from '@/types'
import { buildIosBlockerRules, shouldBlockOnDevice } from '../app-blocker'

function lockedApp(partial: Partial<LockedApp> & Pick<LockedApp, 'id' | 'name'>): LockedApp {
  return {
    icon: '',
    color: '#000',
    dailyLimitMinutes: 30,
    usedMinutes: 0,
    isLocked: true,
    unlockedUntil: null,
    ...partial,
  }
}

describe('buildIosBlockerRules', () => {
  it('only includes apps that still have an iosTokenId (post-remove list)', () => {
    const remaining = lockedApp({
      id: 'keep',
      name: 'Kept',
      iosTokenId: 'token-keep',
    })
    const rules = buildIosBlockerRules([remaining])
    expect(rules).toEqual([
      { tokenId: 'token-keep', blocked: true, unlockedUntil: 0 },
    ])
  })

  it('returns an empty rules array when the lock list has no iOS tokens', () => {
    // syncAppBlockingRules must still call applyRules([]) so native clears shields.
    expect(buildIosBlockerRules([])).toEqual([])
    expect(
      buildIosBlockerRules([
        lockedApp({ id: 'android-only', name: 'Android', packageName: 'com.example' }),
      ])
    ).toEqual([])
  })

  it('marks temporarily unlocked apps as not blocked', () => {
    const until = Date.now() + 60_000
    const app = lockedApp({
      id: 'temp',
      name: 'Temp',
      iosTokenId: 'token-temp',
      isLocked: false,
      unlockedUntil: until,
    })
    expect(shouldBlockOnDevice(app)).toBe(false)
    expect(buildIosBlockerRules([app])[0]).toMatchObject({
      tokenId: 'token-temp',
      blocked: false,
      unlockedUntil: until,
    })
  })
})
