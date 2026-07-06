import { useStore } from '@/store'
import { syncAppBlockingRules, isNativeBlockingAvailable } from '@/lib/app-blocker'

let subscribed = false

export function scheduleBlockingSync() {
  if (!isNativeBlockingAvailable()) return
  const apps = useStore.getState().apps
  void syncAppBlockingRules(apps)
}

export function initBlockingSync() {
  if (!isNativeBlockingAvailable() || subscribed) return
  subscribed = true
  useStore.subscribe((state, prev) => {
    if (state.apps !== prev.apps) {
      scheduleBlockingSync()
    }
  })
}
