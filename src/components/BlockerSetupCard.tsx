import { useEffect, useState, useCallback } from 'react'
import { Shield, ShieldCheck, ShieldAlert } from 'lucide-react'
import { MotionCard } from '@/components/ui/Card'
import { MotionButton } from '@/components/ui/Button'
import {
  getBlockerStatus,
  openAccessibilitySettings,
  syncAppBlockingRules,
  isAndroidBlockingAvailable,
  type BlockerStatus,
} from '@/lib/app-blocker'
import { useStore } from '@/store'
import { useTranslation } from '@/i18n/context'

export function BlockerSetupCard({ compact }: { compact?: boolean }) {
  const { t } = useTranslation()
  const apps = useStore((s) => s.apps)
  const [status, setStatus] = useState<BlockerStatus | null>(null)
  const [loading, setLoading] = useState(false)

  const refresh = useCallback(async () => {
    if (!isAndroidBlockingAvailable()) return
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
    if (!isAndroidBlockingAvailable()) return

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

  if (!isAndroidBlockingAvailable()) return null

  const ready = status?.ready ?? false
  const appsWithPackage = apps.filter((a) => a.packageName).length

  const handleEnable = async () => {
    setLoading(true)
    try {
      await openAccessibilitySettings()
    } finally {
      setLoading(false)
    }
  }

  const Icon = ready ? ShieldCheck : appsWithPackage > 0 ? ShieldAlert : Shield
  const iconClass = ready
    ? 'text-emerald-400'
    : appsWithPackage > 0
      ? 'text-amber-400'
      : 'text-white/40'

  return (
    <MotionCard
      className={`border ${ready ? 'border-emerald-500/25 bg-emerald-500/5' : 'border-indigo-500/20 bg-indigo-500/5'} ${compact ? 'p-4 mb-4' : 'p-4 mb-6'}`}
    >
      <div className="flex items-start gap-3">
        <div className={`w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center shrink-0 ${iconClass}`}>
          <Icon size={20} />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-semibold text-white/90 mb-1">
            {ready ? t('blocker.readyTitle') : t('blocker.setupTitle')}
          </h3>
          <p className="text-xs text-white/50 leading-relaxed">
            {ready
              ? t('blocker.readyDesc')
              : appsWithPackage > 0
                ? t('blocker.setupDesc')
                : t('blocker.setupNoApps')}
          </p>
          {!ready && (
            <MotionButton
              size="sm"
              className="mt-3 h-10 text-sm"
              onClick={handleEnable}
              loading={loading}
            >
              {t('blocker.enableButton')}
            </MotionButton>
          )}
        </div>
      </div>
    </MotionCard>
  )
}
