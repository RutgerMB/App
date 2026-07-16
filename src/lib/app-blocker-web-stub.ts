import type { WebPlugin } from '@capacitor/core'
import type { BlockAttemptsToday, BlockerRule, BlockerStatus } from '@/lib/app-blocker'

const stub = {
  isSupported: async () => ({ supported: false }),
  getStatus: async () => ({ supported: false, accessibility: false, ready: false }),
  openAccessibilitySettings: async () => {},
  applyRules: async () => ({ ok: false }),
  getBlockAttemptsToday: async (): Promise<BlockAttemptsToday> => ({ total: 0, apps: [] }),
} as unknown as WebPlugin & {
  isSupported(): Promise<{ supported: boolean }>
  getStatus(): Promise<BlockerStatus>
  openAccessibilitySettings(): Promise<void>
  applyRules(_options: { rules: BlockerRule[] }): Promise<{ ok: boolean }>
  getBlockAttemptsToday(): Promise<BlockAttemptsToday>
}

export default stub
