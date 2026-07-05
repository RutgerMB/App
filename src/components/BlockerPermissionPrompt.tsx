import { useCallback, useEffect, useRef, useState } from 'react'
import { useLocation } from 'react-router-dom'
import { Shield } from 'lucide-react'
import { Modal } from '@/components/ui/Modal'
import { MotionButton } from '@/components/ui/Button'
import {
  getBlockerStatus,
  openAccessibilitySettings,
  syncAppBlockingRules,
  isAndroidBlockingAvailable,
} from '@/lib/app-blocker'
import { useStore } from '@/store'
import { useAuthStore } from '@/store/auth'
import { useToast } from '@/components/ui/Toast'
import { useTranslation } from '@/i18n/context'

const SESSION_DISMISS_KEY = 'replock-blocker-prompt-dismissed'

export function BlockerPermissionPrompt() {
  const location = useLocation()
  const { t } = useTranslation()
  const { toast } = useToast()
  const apps = useStore((s) => s.apps)
  const token = useAuthStore((s) => s.token)
  const initialized = useAuthStore((s) => s.initialized)
  const onboardingComplete = useStore((s) => s.profile.onboardingComplete)

  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [waitingForReturn, setWaitingForReturn] = useState(false)
  const checkedRef = useRef(false)

  const forceFromNavigation = Boolean(
    (location.state as { showBlockerPrompt?: boolean } | null)?.showBlockerPrompt
  )

  const evaluatePrompt = useCallback(async () => {
    if (!isAndroidBlockingAvailable()) return
    if (!token || !onboardingComplete) return
    if (sessionStorage.getItem(SESSION_DISMISS_KEY) === '1' && !forceFromNavigation) return

    const status = await getBlockerStatus()
    if (status.ready) {
      setOpen(false)
      setWaitingForReturn(false)
      await syncAppBlockingRules(apps)
      return
    }

    setOpen(true)
  }, [apps, forceFromNavigation, onboardingComplete, token])

  useEffect(() => {
    if (!initialized) return
    if (checkedRef.current && !forceFromNavigation) return

    checkedRef.current = true
    void evaluatePrompt()
  }, [initialized, evaluatePrompt, forceFromNavigation])

  useEffect(() => {
    if (!isAndroidBlockingAvailable()) return

    const onVisible = () => {
      if (document.visibilityState !== 'visible') return
      void (async () => {
        const status = await getBlockerStatus()
        if (status.ready) {
          if (waitingForReturn || open) {
            toast(t('blocker.promptSuccess'), 'success')
          }
          setOpen(false)
          setWaitingForReturn(false)
          sessionStorage.removeItem(SESSION_DISMISS_KEY)
          await syncAppBlockingRules(apps)
          return
        }
        if (waitingForReturn) {
          setOpen(true)
        }
      })()
    }

    window.addEventListener('focus', onVisible)
    document.addEventListener('visibilitychange', onVisible)
    return () => {
      window.removeEventListener('focus', onVisible)
      document.removeEventListener('visibilitychange', onVisible)
    }
  }, [apps, open, toast, t, waitingForReturn])

  const handleGrant = async () => {
    setLoading(true)
    try {
      setWaitingForReturn(true)
      await openAccessibilitySettings()
    } finally {
      setLoading(false)
    }
  }

  const handleSkip = () => {
    sessionStorage.setItem(SESSION_DISMISS_KEY, '1')
    setOpen(false)
    setWaitingForReturn(false)
  }

  if (!isAndroidBlockingAvailable() || !token || !onboardingComplete) return null

  return (
    <Modal open={open} onClose={handleSkip} title={t('blocker.promptTitle')} position="bottom">
      <div className="flex flex-col items-center text-center mb-5">
        <div className="w-16 h-16 rounded-2xl bg-indigo-500/15 border border-indigo-500/25 flex items-center justify-center mb-4">
          <Shield size={32} className="text-indigo-400" />
        </div>
        <p className="text-sm text-white/55 leading-relaxed">{t('blocker.promptDesc')}</p>
      </div>

      <ol className="space-y-3 mb-6 text-left">
        {[t('blocker.promptStep1'), t('blocker.promptStep2'), t('blocker.promptStep3')].map((step, i) => (
          <li key={step} className="flex gap-3 text-sm text-white/70">
            <span className="shrink-0 w-6 h-6 rounded-full bg-white/10 text-xs font-semibold flex items-center justify-center">
              {i + 1}
            </span>
            <span className="pt-0.5 leading-relaxed">{step}</span>
          </li>
        ))}
      </ol>

      <p className="text-[11px] text-white/35 leading-relaxed mb-5">{t('blocker.promptPrivacy')}</p>

      <MotionButton fullWidth size="lg" onClick={handleGrant} loading={loading} className="mb-3">
        {waitingForReturn ? t('blocker.promptWaiting') : t('blocker.grantButton')}
      </MotionButton>

      <button
        type="button"
        onClick={handleSkip}
        className="w-full py-3 text-sm text-white/40 hover:text-white/60 transition-colors"
      >
        {t('blocker.skipButton')}
      </button>
    </Modal>
  )
}
