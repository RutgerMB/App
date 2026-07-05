import { motion } from 'framer-motion'
import { useNavigate, useLocation } from 'react-router-dom'
import { ArrowRight, Zap, Shield, TrendingUp } from 'lucide-react'
import { useState, useEffect, useMemo, type ReactNode } from 'react'
import { MotionButton } from '@/components/ui/Button'
import { BackButton } from '@/components/ui/BackButton'
import { Input } from '@/components/ui/Input'
import { LanguagePicker } from '@/components/LanguagePicker'
import { DifficultyPicker } from '@/components/DifficultyPicker'
import { useStore } from '@/store'
import { useAuthStore } from '@/store/auth'
import { useTranslation } from '@/i18n/context'
import type { Locale, Difficulty } from '@/types'
import { cn } from '@/lib/utils'
import { isAndroidBlockingAvailable } from '@/lib/app-blocker'

function StepDots({ step, total }: { step: number; total: number }) {
  if (step === 0) return null
  return (
    <div className="flex items-center justify-center gap-2 mb-6">
      {Array.from({ length: total }, (_, i) => i + 1).map((s) => (
        <div
          key={s}
          className={cn(
            'h-2 rounded-full transition-all duration-300',
            s === step ? 'w-8 bg-indigo-500' : s < step ? 'w-2 bg-indigo-500/50' : 'w-2 bg-white/15'
          )}
        />
      ))}
    </div>
  )
}

function OnboardingLayout({
  step,
  stepCount,
  children,
  footer,
  scrollable,
  onBack,
}: {
  step: number
  stepCount: number
  children: ReactNode
  footer: ReactNode
  scrollable?: boolean
  onBack?: () => void
}) {
  const { t } = useTranslation()

  return (
    <div className="min-h-dvh bg-surface-0 noise flex flex-col px-6 pt-8 pb-10 safe-top safe-bottom">
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[28rem] h-72 bg-indigo-500/8 rounded-full blur-3xl" />
      </div>

      <div className="relative max-w-md mx-auto w-full flex flex-col flex-1">
        {onBack && (
          <div className="mb-2 shrink-0">
            <BackButton onClick={onBack} aria-label={t('common.back')} />
          </div>
        )}

        <StepDots step={step} total={stepCount} />

        <div
          className={cn(
            'flex-1 flex flex-col',
            scrollable ? 'overflow-y-auto min-h-0' : 'justify-center',
            step > 0 && 'py-2'
          )}
        >
          {children}
        </div>

        <div className="relative pt-8 shrink-0">{footer}</div>
      </div>
    </div>
  )
}

export function OnboardingPage() {
  const location = useLocation()
  const restoredStep = (location.state as { step?: number } | null)?.step
  const [step, setStep] = useState(typeof restoredStep === 'number' ? restoredStep : 0)

  const profileName = useStore((s) => s.profile.name)
  const authUser = useAuthStore((s) => s.user)
  const [name, setName] = useState('')
  const [selectedLocale, setSelectedLocale] = useState<Locale>(
    useStore.getState().profile.locale
  )
  const [selectedDifficulty, setSelectedDifficulty] = useState<Difficulty>('medium')
  const completeOnboarding = useStore((s) => s.completeOnboarding)
  const setLocale = useStore((s) => s.setLocale)
  const syncNow = useAuthStore((s) => s.syncNow)
  const navigate = useNavigate()
  const { t } = useTranslation()

  const resolvedName = useMemo(
    () => (name.trim() || profileName.trim() || authUser?.name?.trim() || '').trim(),
    [name, profileName, authUser?.name]
  )

  const needsNameStep = resolvedName.length === 0
  const finalStep = needsNameStep ? 4 : 3
  const stepCount = finalStep

  useEffect(() => {
    if (typeof restoredStep === 'number') {
      setStep(restoredStep)
    }
  }, [restoredStep])

  useEffect(() => {
    const fromAccount = profileName.trim() || authUser?.name?.trim() || ''
    if (fromAccount && !name.trim()) {
      setName(fromAccount)
    }
  }, [profileName, authUser?.name, name])

  const features = [
    { icon: Zap, title: t('onboarding.feature1Title'), desc: t('onboarding.feature1Desc') },
    { icon: Shield, title: t('onboarding.feature2Title'), desc: t('onboarding.feature2Desc') },
    { icon: TrendingUp, title: t('onboarding.feature3Title'), desc: t('onboarding.feature3Desc') },
  ]

  const handleComplete = async (displayName?: string) => {
    const finalName = (displayName ?? resolvedName).trim()
    if (!finalName) return

    setLocale(selectedLocale)
    completeOnboarding(finalName, selectedDifficulty)
    if (authUser?.email) {
      useStore.setState((s) => ({
        profile: { ...s.profile, email: authUser.email },
      }))
    }
    try {
      await syncNow()
    } catch {
      /* sync when back online */
    }
    navigate('/', {
      replace: true,
      state: isAndroidBlockingAvailable() ? { showBlockerPrompt: true } : undefined,
    })
  }

  const continueFromDifficulty = () => {
    if (needsNameStep) {
      setStep(4)
      return
    }
    void handleComplete()
  }

  const continueBtn = (onClick: () => void, label?: string, disabled?: boolean) => (
    <MotionButton fullWidth size="xl" onClick={onClick} disabled={disabled} className="text-lg h-16">
      {label ?? t('common.continue')}
      <ArrowRight size={20} />
    </MotionButton>
  )

  if (step === 0) {
    return (
      <div className="min-h-dvh bg-surface-0 noise flex flex-col px-6 py-12 safe-top safe-bottom">
        <div className="pointer-events-none fixed inset-0 overflow-hidden">
          <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl" />
        </div>

        <div className="relative flex-1 flex flex-col items-center justify-center max-w-md mx-auto w-full text-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          >
            <div className="w-28 h-28 mx-auto mb-10 rounded-[2rem] bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center shadow-2xl shadow-indigo-500/30">
              <span className="text-5xl font-bold text-white">R</span>
            </div>

            <h1 className="text-5xl sm:text-6xl font-bold tracking-tight mb-5">
              <span className="gradient-text">RepLock</span>
            </h1>
            <p className="text-white/55 text-xl sm:text-2xl leading-relaxed max-w-sm mx-auto">
              {t('onboarding.tagline')}
            </p>
          </motion.div>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.5 }}
          className="relative max-w-md mx-auto w-full shrink-0"
        >
          <MotionButton fullWidth size="xl" onClick={() => setStep(1)} className="text-lg h-16">
            {t('onboarding.getStarted')}
            <ArrowRight size={20} />
          </MotionButton>
        </motion.div>
      </div>
    )
  }

  if (step === 1) {
    return (
      <OnboardingLayout
        step={step}
        stepCount={stepCount}
        onBack={() => setStep(0)}
        footer={continueBtn(() => { setLocale(selectedLocale); setStep(2) })}
      >
        <h2 className="text-3xl sm:text-4xl font-bold mb-3 leading-tight">
          {t('onboarding.chooseLanguage')}
        </h2>
        <p className="text-white/50 text-lg mb-8 leading-relaxed">
          {t('onboarding.chooseLanguageDesc')}
        </p>
        <LanguagePicker large value={selectedLocale} onChange={setSelectedLocale} />
      </OnboardingLayout>
    )
  }

  if (step === 2) {
    return (
      <OnboardingLayout
        step={step}
        stepCount={stepCount}
        onBack={() => setStep(1)}
        footer={continueBtn(() => setStep(3))}
      >
        <h2 className="text-3xl sm:text-4xl font-bold mb-3 leading-tight">
          {t('onboarding.howItWorks')}
        </h2>
        <p className="text-white/50 text-lg mb-8 leading-relaxed">
          {t('onboarding.howItWorksDesc')}
        </p>

        <div className="space-y-4">
          {features.map((f, i) => (
            <motion.div
              key={f.title}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.1 + 0.1 }}
              className="flex items-start gap-5 p-5 rounded-2xl bg-surface-2 border border-border"
            >
              <div className="w-14 h-14 rounded-2xl bg-indigo-500/10 flex items-center justify-center shrink-0">
                <f.icon size={26} className="text-indigo-400" />
              </div>
              <div className="pt-0.5">
                <h3 className="font-semibold text-lg">{f.title}</h3>
                <p className="text-white/45 text-base mt-1 leading-relaxed">{f.desc}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </OnboardingLayout>
    )
  }

  if (step === 3) {
    return (
      <OnboardingLayout
        step={step}
        stepCount={stepCount}
        scrollable
        onBack={() => setStep(2)}
        footer={continueBtn(
          continueFromDifficulty,
          needsNameStep ? undefined : t('onboarding.startEarning')
        )}
      >
        <h2 className="text-3xl sm:text-4xl font-bold mb-3 leading-tight">
          {t('onboarding.chooseDifficulty')}
        </h2>
        <p className="text-white/50 text-lg mb-8 leading-relaxed">
          {t('onboarding.chooseDifficultyDesc')}
        </p>
        <DifficultyPicker
          large
          value={selectedDifficulty}
          onChange={setSelectedDifficulty}
          pricingNavigateState={{ from: 'onboarding', step: 3 }}
        />
      </OnboardingLayout>
    )
  }

  return (
    <OnboardingLayout
      step={step}
      stepCount={stepCount}
      onBack={() => setStep(3)}
      footer={continueBtn(
        () => void handleComplete(name.trim()),
        t('onboarding.startEarning'),
        !name.trim()
      )}
    >
      <h2 className="text-3xl sm:text-4xl font-bold mb-3 leading-tight">
        {t('onboarding.yourName')}
      </h2>
      <p className="text-white/50 text-lg mb-10 leading-relaxed">
        {t('onboarding.yourNameDesc')}
      </p>

      <Input
        id="name"
        label={t('onboarding.nameLabel')}
        placeholder={t('onboarding.namePlaceholder')}
        value={name}
        onChange={(e) => setName(e.target.value)}
        autoFocus
        onKeyDown={(e) => e.key === 'Enter' && name.trim() && void handleComplete(name.trim())}
        className="h-16 text-xl px-5 rounded-2xl"
      />
    </OnboardingLayout>
  )
}
