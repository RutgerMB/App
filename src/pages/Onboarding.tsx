import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { ArrowRight, Zap, Shield, TrendingUp } from 'lucide-react'
import { useState } from 'react'
import { MotionButton } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { LanguagePicker } from '@/components/LanguagePicker'
import { DifficultyPicker } from '@/components/DifficultyPicker'
import { useStore } from '@/store'
import { useTranslation } from '@/i18n/context'
import type { Locale, Difficulty } from '@/types'

export function OnboardingPage() {
  const [step, setStep] = useState(0)
  const [name, setName] = useState('')
  const [selectedLocale, setSelectedLocale] = useState<Locale>(
    useStore.getState().profile.locale
  )
  const [selectedDifficulty, setSelectedDifficulty] = useState<Difficulty>('medium')
  const completeOnboarding = useStore((s) => s.completeOnboarding)
  const setLocale = useStore((s) => s.setLocale)
  const navigate = useNavigate()
  const { t } = useTranslation()

  const features = [
    { icon: Zap, title: t('onboarding.feature1Title'), desc: t('onboarding.feature1Desc') },
    { icon: Shield, title: t('onboarding.feature2Title'), desc: t('onboarding.feature2Desc') },
    { icon: TrendingUp, title: t('onboarding.feature3Title'), desc: t('onboarding.feature3Desc') },
  ]

  const handleComplete = () => {
    if (name.trim()) {
      setLocale(selectedLocale)
      completeOnboarding(name.trim(), selectedDifficulty)
      navigate('/')
    }
  }

  if (step === 0) {
    return (
      <div className="min-h-dvh bg-surface-0 noise flex flex-col items-center justify-center px-6 safe-top safe-bottom">
        <div className="pointer-events-none fixed inset-0 overflow-hidden">
          <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl" />
        </div>

        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          className="relative text-center"
        >
          <div className="w-20 h-20 mx-auto mb-8 rounded-3xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center shadow-2xl shadow-indigo-500/30">
            <span className="text-3xl font-bold text-white">R</span>
          </div>

          <h1 className="text-4xl font-bold tracking-tight mb-3">
            <span className="gradient-text">RepLock</span>
          </h1>
          <p className="text-white/50 text-lg max-w-xs mx-auto leading-relaxed">
            {t('onboarding.tagline')}
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.5 }}
          className="mt-16 w-full max-w-sm"
        >
          <MotionButton fullWidth size="xl" onClick={() => setStep(1)}>
            {t('onboarding.getStarted')}
            <ArrowRight size={18} />
          </MotionButton>
        </motion.div>
      </div>
    )
  }

  if (step === 1) {
    return (
      <div className="min-h-dvh bg-surface-0 noise flex flex-col px-6 safe-top safe-bottom">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex-1 flex flex-col justify-center max-w-sm mx-auto w-full py-8"
        >
          <h2 className="text-2xl font-bold mb-2">{t('onboarding.chooseLanguage')}</h2>
          <p className="text-white/40 mb-6">{t('onboarding.chooseLanguageDesc')}</p>
          <LanguagePicker value={selectedLocale} onChange={setSelectedLocale} />
        </motion.div>

        <MotionButton fullWidth size="xl" onClick={() => { setLocale(selectedLocale); setStep(2) }} className="mb-4">
          {t('common.continue')}
          <ArrowRight size={18} />
        </MotionButton>
      </div>
    )
  }

  if (step === 2) {
    return (
      <div className="min-h-dvh bg-surface-0 noise flex flex-col px-6 safe-top safe-bottom">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex-1 flex flex-col justify-center max-w-sm mx-auto w-full"
        >
          <h2 className="text-2xl font-bold mb-2">{t('onboarding.howItWorks')}</h2>
          <p className="text-white/40 mb-10">{t('onboarding.howItWorksDesc')}</p>

          <div className="space-y-4">
            {features.map((f, i) => (
              <motion.div
                key={f.title}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.1 + 0.1 }}
                className="flex items-start gap-4 p-4 rounded-2xl bg-surface-2 border border-border"
              >
                <div className="w-10 h-10 rounded-xl bg-indigo-500/10 flex items-center justify-center shrink-0">
                  <f.icon size={20} className="text-indigo-400" />
                </div>
                <div>
                  <h3 className="font-semibold text-sm">{f.title}</h3>
                  <p className="text-white/40 text-sm mt-0.5">{f.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>

        <MotionButton fullWidth size="xl" onClick={() => setStep(3)} className="mb-4">
          {t('common.continue')}
          <ArrowRight size={18} />
        </MotionButton>
      </div>
    )
  }

  if (step === 3) {
    return (
      <div className="min-h-dvh bg-surface-0 noise flex flex-col px-6 safe-top safe-bottom overflow-y-auto">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex-1 flex flex-col max-w-sm mx-auto w-full py-8"
        >
          <h2 className="text-2xl font-bold mb-2">{t('onboarding.chooseDifficulty')}</h2>
          <p className="text-white/40 mb-6">{t('onboarding.chooseDifficultyDesc')}</p>
          <DifficultyPicker value={selectedDifficulty} onChange={setSelectedDifficulty} />
        </motion.div>

        <MotionButton fullWidth size="xl" onClick={() => setStep(4)} className="mb-4 shrink-0">
          {t('common.continue')}
          <ArrowRight size={18} />
        </MotionButton>
      </div>
    )
  }

  return (
    <div className="min-h-dvh bg-surface-0 noise flex flex-col px-6 safe-top safe-bottom">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="flex-1 flex flex-col justify-center max-w-sm mx-auto w-full"
      >
        <h2 className="text-2xl font-bold mb-2">{t('onboarding.yourName')}</h2>
        <p className="text-white/40 mb-8">{t('onboarding.yourNameDesc')}</p>

        <Input
          id="name"
          label={t('onboarding.nameLabel')}
          placeholder={t('onboarding.namePlaceholder')}
          value={name}
          onChange={(e) => setName(e.target.value)}
          autoFocus
          onKeyDown={(e) => e.key === 'Enter' && name.trim() && handleComplete()}
        />
      </motion.div>

      <MotionButton
        fullWidth
        size="xl"
        onClick={handleComplete}
        disabled={!name.trim()}
        className="mb-4"
      >
        {t('onboarding.startEarning')}
        <ArrowRight size={18} />
      </MotionButton>
    </div>
  )
}
