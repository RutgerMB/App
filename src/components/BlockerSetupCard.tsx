import { useEffect, useState, useCallback } from 'react'
import { Shield, ShieldCheck, ShieldAlert } from 'lucide-react'
import { MotionCard } from '@/components/ui/Card'
import { MotionButton } from '@/components/ui/Button'
import {
  getBlockerStatus,
  openAccessibilitySettings,
  syncAppBlockingRules,
  isNativeBlockingAvailable,
  isIosBlockingAvailable,
  type BlockerStatus,
} from '@/lib/app-blocker'
import { requestIosScreenTimeAccess } from '@/lib/screen-time'
import { useStore } from '@/store'
import { useTranslation } from '@/i18n/context'
import { useToast } from '@/components/ui/Toast'

export function BlockerSetupCard({
  compact,
  hideWhenReady,
}: {
  compact?: boolean
  /** Apps tab: only show the warning/setup state, not the “active” banner. */
  hideWhenReady?: boolean
}) {
  const { t } = useTranslation()
  const { toast } = useToast()
  const apps = useStore((s) => s.apps)
  const [status, setStatus] = useState<BlockerStatus | null>(null)
  const [loading, setLoading] = useState(false)
  const onIos = isIosBlockingAvailable()

  const refresh = useCallback(async () => {
    if (!isNativeBlockingAvailable()) return
    const next = await getBlockerStatus()
    setStatus(next)
    if (next.ready) {
      await syncAppBlockingRules(apps)
    }
  }, [apps])

  useEffect(() => {
    void refresh()
  }, [refresh])

  useEffect(() => {
    if (!isNativeBlockingAvailable()) return

    const onVisible = () => {
      if (document.visibilityState === 'visible') void refresh()
    }
    window.addEventListener('focus', onVisible)
    document.addEventListener('visibilitychange', onVisible)
    return () => {
      window.removeEventListener('focus', onVisible)
      document.removeEventListener('visibilitychange', onVisible)
    }
  }, [refresh])

  if (!isNativeBlockingAvailable()) return null

  const ready = status?.ready ?? false
  if (hideWhenReady && ready) return null

  const appsConfigured = apps.filter((a) => a.packageName || a.iosTokenId).length

  const handleEnable = async () => {
    setLoading(true)
    try {
      if (onIos) {
        const result = await requestIosScreenTimeAccess()
        if (!result.ok) {
          if (result.reason === 'denied') {
            toast(t('onboarding.screenTimeIosError_denied'), 'error')
          } else if (result.reason === 'notDetermined') {
            toast(t('onboarding.screenTimeIosError_notDetermined'), 'error')
          } else {
            const key = `onboarding.screenTimeIosError_${result.reason}` as const
            const msg = t(key as 'onboarding.screenTimeIosError_failed')
            toast(msg !== key ? msg : t('onboarding.screenTimeIosError_failed'), 'error')
          }
        } else {
          toast(t('onboarding.screenTimeIosAuthorized'), 'success')
        }
        await refresh()
      } else {
        await openAccessibilitySettings()
      }
    } finally {
      setLoading(false)
    }
  }

  const Icon = ready ? ShieldCheck : appsConfigured > 0 ? ShieldAlert : Shield
  const iconClass = ready
    ? 'text-emerald-400'
    : appsConfigured > 0
      ? 'text-amber-400'
      : 'text-white/40'

  const title = ready
    ? t('blocker.readyTitle')
    : onIos
      ? t('blocker.iosSetupTitle')
      : t('blocker.setupTitle')

  const desc = ready
    ? t('blocker.readyDesc')
    : appsConfigured > 0
      ? onIos
        ? t('blocker.iosSetupDesc')
        : t('blocker.setupDesc')
      : onIos
        ? t('blocker.iosSetupNoApps')
        : t('blocker.setupNoApps')

  const enableLabel = onIos ? t('blocker.iosEnableButton') : t('blocker.enableButton')

  return (
    <MotionCard
      className={`border ${ready ? 'border-emerald-500/25 bg-emerald-500/5' : 'border-emerald-500/20 bg-emerald-500/5'} ${compact ? 'p-4 mb-4' : 'p-4 mb-6'}`}
    >
      <div className="flex items-start gap-3">
        <div className={`w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center shrink-0 ${iconClass}`}>
          <Icon size={20} />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-semibold text-white/90 mb-1">{title}</h3>
          <p className="text-xs text-white/50 leading-relaxed">{desc}</p>
          {!ready && (
            <MotionButton
              size="sm"
              className="mt-3 h-10 text-sm"
              onClick={handleEnable}
              loading={loading}
            >
              {enableLabel}
            </MotionButton>
          )}
        </div>
      </div>
    </MotionCard>
  )
}
