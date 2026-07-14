import type { WebPlugin } from '@capacitor/core'
import type { BlockerRule, BlockerStatus } from '@/lib/app-blocker'

const stub = {
  isSupported: async () => ({ supported: false }),
  getStatus: async () => ({ supported: false, accessibility: false, ready: false }),
  openAccessibilitySettings: async () => {},
  applyRules: async () => ({ ok: false }),
} as unknown as WebPlugin & {
  isSupported(): Promise<{ supported: boolean }>
  getStatus(): Promise<BlockerStatus>
  openAccessibilitySettings(): Promise<void>
  applyRules(_options: { rules: BlockerRule[] }): Promise<{ ok: boolean }>
}

export default stub
