import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { X } from 'lucide-react'
import { MotionButton } from '@/components/ui/Button'
import { useTranslation } from '@/i18n/context'

export function CancelPage() {
  const navigate = useNavigate()
  const { t } = useTranslation()

  return (
    <div className="min-h-dvh bg-surface-0 noise flex flex-col items-center justify-center px-6 safe-top safe-bottom">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="text-center max-w-sm"
      >
        <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-white/5 flex items-center justify-center">
          <X size={32} className="text-white/30" />
        </div>
        <h1 className="text-2xl font-bold mb-2">{t('cancel.title')}</h1>
        <p className="text-white/40 mb-8">
          {t('cancel.desc')}
        </p>
        <MotionButton fullWidth size="xl" onClick={() => navigate('/')}>
          {t('cancel.backHome')}
        </MotionButton>
      </motion.div>
    </div>
  )
}
