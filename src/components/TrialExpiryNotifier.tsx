import { useEffect, useRef } from 'react'
import { useStore } from '@/store'
import { getTrialStatus } from '@/lib/trial'
import { useToast } from '@/components/ui/Toast'
import { useTranslation } from '@/i18n/context'

/** Shows a toast when trial expiry trims apps via enforceAppLimit. */
export function TrialExpiryNotifier() {
  const { toast } = useToast()
  const { t } = useTranslation()
  const prevCountRef = useRef(useStore.getState().apps.length)
  const notifiedRef = useRef(false)

  useEffect(() => {
    return useStore.subscribe((state) => {
      const newCount = state.apps.length
      const prevCount = prevCountRef.current
      if (newCount < prevCount && getTrialStatus(state.profile) === 'expired') {
        const removed = prevCount - newCount
        if (!notifiedRef.current || removed > 0) {
          toast(t('trial.appsRemoved', { count: removed }), 'error')
          notifiedRef.current = true
        }
      }
      prevCountRef.current = newCount
    })
  }, [toast, t])

  return null
}
