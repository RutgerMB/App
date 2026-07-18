import { useEffect, useState } from 'react'
import { useNavigate, useSearchParams, useLocation } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Check, Loader2 } from 'lucide-react'
import { MotionButton } from '@/components/ui/Button'
import { verifySession } from '@/lib/utils'
import { syncEntitlementAfterPurchase, syncEntitlementOnLaunch } from '@/lib/entitlement'
import { useTranslation } from '@/i18n/context'

export function SuccessPage() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const location = useLocation()
  const onboardingReturn = location.state as { from?: string; step?: number } | null
  const { t } = useTranslation()
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading')

  useEffect(() => {
    if (searchParams.get('native') === '1') {
      syncEntitlementAfterPurchase()
        .then((result) => setStatus(result.isPro ? 'success' : 'error'))
        .catch(() => {
          syncEntitlementOnLaunch()
            .then((isPro) => setStatus(isPro ? 'success' : 'error'))
            .catch(() => setStatus('error'))
        })
      return
    }

    const sessionId = searchParams.get('session_id')
    if (!sessionId) {
      setStatus('error')
      return
    }

    verifySession(sessionId)
      .then(async (data) => {
        if (data.isPro) {
          await syncEntitlementAfterPurchase()
          setStatus('success')
        } else {
          setStatus('error')
        }
      })
      .catch(() => setStatus('error'))
  }, [searchParams])

  const handleContinue = () => {
    if (onboardingReturn?.from === 'onboarding' && typeof onboardingReturn.step === 'number') {
      navigate('/onboarding', { state: { step: onboardingReturn.step } })
      return
    }
    navigate('/')
  }

  return (
    <div className="min-h-dvh bg-surface-0 noise flex flex-col items-center justify-center px-6 safe-top safe-bottom">
      {status === 'loading' && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center">
          <Loader2 size={40} className="mx-auto text-emerald-400 animate-spin mb-4" />
          <p className="text-white/50">{t('success.confirming')}</p>
        </motion.div>
      )}

      {status === 'success' && (
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center max-w-sm"
        >
          <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-emerald-500/20 flex items-center justify-center">
            <Check size={40} className="text-emerald-400" />
          </div>
          <h1 className="text-2xl font-bold mb-2">{t('success.welcome')}</h1>
          <p className="text-white/40 mb-8">
            {t('success.welcomeDesc')}
          </p>
          <MotionButton fullWidth size="xl" onClick={handleContinue}>
            {onboardingReturn?.from === 'onboarding'
              ? t('common.continue')
              : t('success.startEarning')}
          </MotionButton>
        </motion.div>
      )}

      {status === 'error' && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center max-w-sm">
          <h1 className="text-2xl font-bold mb-2">{t('success.error')}</h1>
          <p className="text-white/40 mb-8">
            {t('success.errorDesc')}
          </p>
          <MotionButton fullWidth size="xl" onClick={() => navigate('/pricing')}>
            {t('success.backToPricing')}
          </MotionButton>
        </motion.div>
      )}
    </div>
  )
}
