import { useStore } from '@/store'
import { syncAppBlockingRules, isAndroidBlockingAvailable } from '@/lib/app-blocker'

let syncTimer: ReturnType<typeof setTimeout> | null = null
let subscribed = false

export function scheduleBlockingSync() {
  if (!isAndroidBlockingAvailable()) return
  if (syncTimer) clearTimeout(syncTimer)
  syncTimer = setTimeout(() => {
    const apps = useStore.getState().apps
    syncAppBlockingRules(apps).catch(() => {})
  }, 400)
}

export function initBlockingSync() {
  if (!isAndroidBlockingAvailable() || subscribed) return
  subscribed = true
  useStore.subscribe((state, prev) => {
    if (state.apps !== prev.apps) {
      scheduleBlockingSync()
    }
  })
  scheduleBlockingSync()
}
