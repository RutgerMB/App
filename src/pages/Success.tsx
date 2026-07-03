import { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Check, Loader2 } from 'lucide-react'
import { MotionButton } from '@/components/ui/Button'
import { verifySession } from '@/lib/utils'
import { useStore } from '@/store'
import { useTranslation } from '@/i18n/context'

export function SuccessPage() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const { t } = useTranslation()
  const setProStatus = useStore((s) => s.setProStatus)
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading')

  useEffect(() => {
    const sessionId = searchParams.get('session_id')
    if (!sessionId) {
      setStatus('error')
      return
    }

    verifySession(sessionId)
      .then((data) => {
        if (data.isPro) {
          setProStatus(true, data.customerId, data.subscriptionId, 'active')
          setStatus('success')
        } else {
          setStatus('error')
        }
      })
      .catch(() => setStatus('error'))
  }, [searchParams, setProStatus])

  return (
    <div className="min-h-dvh bg-surface-0 noise flex flex-col items-center justify-center px-6 safe-top safe-bottom">
      {status === 'loading' && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center">
          <Loader2 size={40} className="mx-auto text-indigo-400 animate-spin mb-4" />
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
          <MotionButton fullWidth size="xl" onClick={() => navigate('/')}>
            {t('success.startEarning')}
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
