import { motion, AnimatePresence } from 'framer-motion'
import { useNavigate, useLocation } from 'react-router-dom'
import { Shield, X } from 'lucide-react'
import { useState, useEffect, useMemo } from 'react'
import {
  IntroShell,
  IntroProgressBar,
  IntroPrimaryButton,
  IntroHeading,
  IntroSubtext,
} from '@/components/onboarding/IntroShell'
import {
  RevealComparison,
  YearsInsight,
  PotentialBars,
  WeekOneStat,
  BenefitsList,
  HoldLogoButton,
  BlockPreviewCarousel,
} from '@/components/onboarding/OnboardingSteps'
import {
  OpeningsSlider,
  GoalCreatedCard,
  NotificationsPreview,
  TrialTimeline,
} from '@/components/onboarding/SetupSteps'
import { BlocklistPicker, resolveSelectedApps } from '@/components/onboarding/BlocklistPicker'
import { SetupIntroIllustration, ScreenTimePermissionStep } from '@/components/onboarding/OnboardingVisuals'
import type { DeviceAppDefinition } from '@/data/device-apps'
import { getDeviceApps, isNativeIos, usesIosActivityPicker } from '@/lib/device-apps'
import {
  checkScreenTimePermission,
  requestScreenTimePermission,
  requestIosScreenTimeAccess,
  fetchDailyScreenTimeHours,
  getScreenTimePlatform,
} from '@/lib/screen-time'
import { useToast } from '@/components/ui/Toast'
import { LanguagePicker } from '@/components/LanguagePicker'
import { DifficultyPicker } from '@/components/DifficultyPicker'
import { Input } from '@/components/ui/Input'
import { useStore } from '@/store'
import { useAuthStore } from '@/store/auth'
import { useTranslation } from '@/i18n/context'
import type { Locale, Difficulty } from '@/types'
import { isNativeBlockingAvailable } from '@/lib/app-blocker'
import { openPrivacy, openTerms } from '@/lib/legal'
import { requestPushPermission } from '@/lib/push-notifications'

const SCREEN_TIME_KEY = 'replock-onboarding-screen-hours'
const DEFAULT_SELECTED_APPS = ['instagram', 'tiktok', 'youtube']
const MINUTES_PER_OPENING = 5

const STEP = {
  INTRO: 1,
  LANGUAGE: 2,
  SCREEN_TIME_PERMISSION: 3,
  SCREEN_TIME_GUESS: 4,
  REVEAL: 5,
  YEARS: 6,
  POTENTIAL: 7,
  WEEK_ONE: 8,
  BENEFITS: 9,
  BLOCK_PREVIEW: 10,
  SELECT_APPS: 11,
  CREATE_GOAL: 12,
  GOAL_CONFIRMED: 13,
  NOTIFICATIONS: 14,
  TRIAL: 15,
  DIFFICULTY: 16,
  NAME: 17,
} as const

function SetupIllustration() {
  return <SetupIntroIllustration />
}

function PrivacySheet({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { t } = useTranslation()

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
      <button type="button" className="absolute inset-0 bg-black/60" onClick={onClose} aria-label={t('common.close')} />
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative w-full max-w-md max-h-[85dvh] overflow-y-auto rounded-t-3xl sm:rounded-3xl bg-surface-2 border border-border p-6 shadow-2xl text-white"
      >
        <button
          type="button"
          onClick={onClose}
          className="w-9 h-9 rounded-full bg-surface-3 flex items-center justify-center mb-4"
        >
          <X size={18} className="text-white/70" />
        </button>
        <h2 className="text-2xl font-bold text-center mb-2">{t('intro.privacySheetTitle')}</h2>
        <p className="text-sm text-white/50 text-center mb-6 leading-relaxed">{t('intro.privacySheetDesc')}</p>

        <div className="space-y-3 mb-6">
          {[
            { title: t('intro.privacyStatTitle'), desc: t('intro.privacyStatDesc') },
            { title: t('intro.privacyBlockTitle'), desc: t('intro.privacyBlockDesc') },
          ].map((card) => (
            <div key={card.title} className="rounded-2xl border border-border bg-surface-3 p-4">
              <div className="flex items-start gap-3">
                <Shield size={18} className="text-indigo-400 shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold text-sm">{card.title}</p>
                  <p className="text-xs text-white/45 mt-1 leading-relaxed">{card.desc}</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        <p className="text-xs text-white/35 text-center mb-3">{t('intro.privacyLearnMore')}</p>
        <div className="grid gap-2">
          <button type="button" onClick={openTerms} className="h-12 rounded-2xl bg-surface-3 text-white font-semibold text-sm">
            {t('legal.termsTitle')}
          </button>
          <button type="button" onClick={openPrivacy} className="h-12 rounded-2xl bg-surface-3 text-white font-semibold text-sm">
            {t('legal.privacyTitle')}
          </button>
        </div>
      </motion.div>
    </div>
  )
}

function ScreenTimeSlider({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  const { t } = useTranslation()
  const fillPct = ((value - 1) / 11) * 100

  return (
    <div className="flex flex-col items-center">
      <p className="text-5xl font-bold gradient-text mb-8 tabular-nums">{value}h</p>
      <div className="relative w-24 h-56 rounded-[2.5rem] bg-indigo-500/10 border-2 border-indigo-500/25 overflow-hidden">
        <motion.div
          className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-indigo-600 to-violet-500 rounded-b-[2.25rem]"
          animate={{ height: `${fillPct}%` }}
          transition={{ type: 'spring', stiffness: 300, damping: 28 }}
        />
        <input
          type="range"
          min={1}
          max={12}
          value={value}
          onChange={(e) => onChange(Number(e.target.value))}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
          aria-label={t('intro.screenTimeQuestion')}
        />
      </div>
      <p className="text-sm text-white/45 mt-6 font-medium">{t('intro.screenTimeHint')}</p>
    </div>
  )
}

export function OnboardingPage() {
  const location = useLocation()
  const restoredStep = (location.state as { step?: number } | null)?.step
  const [step, setStep] = useState(typeof restoredStep === 'number' ? restoredStep : STEP.INTRO)
  const [privacyOpen, setPrivacyOpen] = useState(false)
  const [screenHours, setScreenHours] = useState(() => {
    try {
      const saved = localStorage.getItem(SCREEN_TIME_KEY)
      return saved ? Number(saved) : 4
    } catch {
      return 4
    }
  })

  const profileName = useStore((s) => s.profile.name)
  const authUser = useAuthStore((s) => s.user)
  const [name, setName] = useState('')
  const [selectedLocale, setSelectedLocale] = useState<Locale>(useStore.getState().profile.locale)
  const [selectedDifficulty, setSelectedDifficulty] = useState<Difficulty>('medium')
  const [selectedApps, setSelectedApps] = useState<Set<string>>(() =>
    isNativeIos() ? new Set() : new Set(DEFAULT_SELECTED_APPS)
  )
  const [actualScreenHours, setActualScreenHours] = useState<number | null>(null)
  const [screenTimeGranted, setScreenTimeGranted] = useState(false)
  const [screenTimeChecking, setScreenTimeChecking] = useState(false)
  const [appCatalog, setAppCatalog] = useState<DeviceAppDefinition[]>([])
  const [openingsPerDay, setOpeningsPerDay] = useState(3)
  const completeOnboarding = useStore((s) => s.completeOnboarding)
  const setLocale = useStore((s) => s.setLocale)
  const setOnboardingApps = useStore((s) => s.setOnboardingApps)
  const setBlockingGoal = useStore((s) => s.setBlockingGoal)
  const setNotificationsEnabled = useStore((s) => s.setNotificationsEnabled)
  const syncNow = useAuthStore((s) => s.syncNow)
  const navigate = useNavigate()
  const { t } = useTranslation()
  const { toast } = useToast()

  const resolvedName = useMemo(
    () => (name.trim() || profileName.trim() || authUser?.name?.trim() || '').trim(),
    [name, profileName, authUser?.name]
  )

  const needsNameStep = resolvedName.length === 0
  const totalSteps = needsNameStep ? 17 : 16
  const progressStep = Math.min(step, totalSteps)
  const screenTimePlatform = getScreenTimePlatform()

  useEffect(() => {
    setLocale(selectedLocale)
  }, [selectedLocale, setLocale])

  const refreshScreenTimeAccess = async () => {
    setScreenTimeChecking(true)
    try {
      const granted = await checkScreenTimePermission()
      setScreenTimeGranted(granted)
      if (granted) {
        const data = await fetchDailyScreenTimeHours()
        if (data) setActualScreenHours(Math.max(0.5, Math.round(data.hours * 10) / 10))
      }
    } finally {
      setScreenTimeChecking(false)
    }
  }

  const handleScreenTimeAuthorize = async () => {
    setScreenTimeChecking(true)
    try {
      if (screenTimePlatform === 'ios') {
        const result = await requestIosScreenTimeAccess()
        if (!result.ok) {
          const key = `onboarding.screenTimeIosError_${result.reason}` as const
          const msg = t(key as 'onboarding.screenTimeIosError_denied')
          toast(msg !== key ? msg : t('onboarding.screenTimeIosError_failed'), 'error')
        } else if (result.authorized) {
          toast(t('onboarding.screenTimePermissionGranted'), 'success')
        }
      } else {
        await requestScreenTimePermission()
      }
      await refreshScreenTimeAccess()
    } finally {
      setScreenTimeChecking(false)
    }
  }

  useEffect(() => {
    if (step === STEP.SCREEN_TIME_PERMISSION) void refreshScreenTimeAccess()
  }, [step])

  useEffect(() => {
    if (step !== STEP.SELECT_APPS) return
    void getDeviceApps().then((apps) => {
      setAppCatalog(apps)
      if (apps.length > 0 && !usesIosActivityPicker()) {
        const socialIds = apps.filter((a) => a.category === 'social').map((a) => a.id)
        if (socialIds.length > 0) setSelectedApps(new Set(socialIds.slice(0, 3)))
      }
    })
  }, [step])

  useEffect(() => {
    if (typeof restoredStep === 'number') setStep(restoredStep)
  }, [restoredStep])

  useEffect(() => {
    const fromAccount = profileName.trim() || authUser?.name?.trim() || ''
    if (fromAccount && !name.trim()) setName(fromAccount)
  }, [profileName, authUser?.name, name])

  const handleComplete = async (displayName?: string) => {
    const finalName = (displayName ?? resolvedName).trim()
    if (!finalName) return

    setLocale(selectedLocale)
    completeOnboarding(finalName, selectedDifficulty)
    try {
      localStorage.setItem(SCREEN_TIME_KEY, String(screenHours))
    } catch {
      /* ignore */
    }
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
      state: isNativeBlockingAvailable() ? { showBlockerPrompt: true } : undefined,
    })
  }

  const advance = () => setStep((s) => s + 1)

  const handleContinue = async () => {
    if (step === STEP.SCREEN_TIME_PERMISSION) {
      // Android: Continue opens usage-access settings until granted
      if (screenTimePlatform === 'android' && !screenTimeGranted) {
        await requestScreenTimePermission()
        await refreshScreenTimeAccess()
        return
      }
      if (screenTimePlatform === 'android') {
        await refreshScreenTimeAccess()
      }
      // iOS: Continue always advances — authorize is a separate button; daily hours still use estimate
      advance()
      return
    }
    if (step === STEP.CREATE_GOAL) {
      const catalog = appCatalog.length > 0 ? appCatalog : await getDeviceApps()
      const resolved = resolveSelectedApps(selectedApps, catalog)
      if (resolved.length === 0) return
      setBlockingGoal(openingsPerDay, MINUTES_PER_OPENING)
      setOnboardingApps(resolved, openingsPerDay * MINUTES_PER_OPENING)
      setStep(STEP.GOAL_CONFIRMED)
      return
    }
    if (step === STEP.DIFFICULTY) {
      if (needsNameStep) {
        setStep(STEP.NAME)
        return
      }
      void handleComplete()
      return
    }
    if (step === STEP.NAME) {
      void handleComplete(name.trim())
      return
    }
    if (step === STEP.YEARS) {
      advance()
      return
    }
    advance()
  }

  const handleAllowNotifications = async () => {
    const granted = await requestPushPermission()
    setNotificationsEnabled(granted)
    advance()
  }

  const continueLabel =
    step === STEP.DIFFICULTY && !needsNameStep
      ? t('onboarding.startEarning')
      : step === STEP.NAME
        ? t('onboarding.startEarning')
        : step === STEP.YEARS
          ? t('intro.yearsCta')
          : undefined

  const continueDisabled =
    (step === STEP.NAME && !name.trim()) || (step === STEP.SELECT_APPS && selectedApps.size === 0)
  const hideFooter = step === STEP.BENEFITS || step === STEP.NOTIFICATIONS

  const footer = hideFooter ? undefined : (
    <>
      <IntroPrimaryButton onClick={handleContinue} disabled={continueDisabled}>
        {continueLabel ?? t('common.continue')}
      </IntroPrimaryButton>
      {step === STEP.TRIAL && (
        <div className="mt-3 space-y-2">
          <button
            type="button"
            onClick={() => navigate('/pricing', { state: { from: 'onboarding', step: STEP.TRIAL } })}
            className="w-full text-sm text-indigo-400 hover:text-indigo-300 font-medium"
          >
            {t('onboarding.trialViewPro')}
          </button>
          <button
            type="button"
            onClick={() => setStep(STEP.DIFFICULTY)}
            className="w-full py-3 rounded-2xl border border-border bg-surface-2 text-sm font-semibold text-white/80 hover:bg-surface-3 transition-colors"
          >
            {t('onboarding.trialContinueFree')}
            <span className="block text-xs font-normal text-white/40 mt-0.5">{t('onboarding.trialContinueFreeDesc')}</span>
          </button>
        </div>
      )}
    </>
  )

  const notificationsFooter = (
    <div className="space-y-3">
      <IntroPrimaryButton onClick={() => void handleAllowNotifications()}>
        {t('onboarding.notificationsAllow')}
      </IntroPrimaryButton>
      <button
        type="button"
        onClick={() => {
          setNotificationsEnabled(false)
          advance()
        }}
        className="w-full py-2 text-sm text-white/40 hover:text-white/60 transition-colors"
      >
        {t('onboarding.notificationsSkip')}
      </button>
    </div>
  )

  const stepContent = () => {
    switch (step) {
      case STEP.INTRO:
        return (
          <>
            <IntroProgressBar step={progressStep} total={totalSteps} />
            <IntroHeading className="mb-3">{t('intro.setupIntroTitle')}</IntroHeading>
            <IntroSubtext className="mb-6">{t('intro.setupIntroDesc')}</IntroSubtext>
            <SetupIllustration />
            <button
              type="button"
              onClick={() => setPrivacyOpen(true)}
              className="mt-8 text-center w-full text-sm text-white/35 hover:text-white/55"
            >
              {t('legal.privacyTitle')}
            </button>
          </>
        )

      case STEP.LANGUAGE:
        return (
          <>
            <IntroProgressBar step={progressStep} total={totalSteps} />
            <IntroHeading className="mb-2 text-left">{t('onboarding.chooseLanguage')}</IntroHeading>
            <IntroSubtext className="mb-8 text-left">{t('onboarding.chooseLanguageDesc')}</IntroSubtext>
            <LanguagePicker large value={selectedLocale} onChange={setSelectedLocale} />
          </>
        )

      case STEP.SCREEN_TIME_PERMISSION:
        return (
          <>
            <IntroProgressBar step={progressStep} total={totalSteps} />
            <IntroHeading className="mb-2">{t('onboarding.screenTimePermissionTitle')}</IntroHeading>
            <IntroSubtext className="mb-8">{t('onboarding.screenTimePermissionDesc')}</IntroSubtext>
            <ScreenTimePermissionStep
              platform={screenTimePlatform}
              granted={screenTimeGranted}
              loading={screenTimeChecking}
              onRequest={() => void handleScreenTimeAuthorize()}
              onRefresh={() => void refreshScreenTimeAccess()}
            />
          </>
        )

      case STEP.SCREEN_TIME_GUESS:
        return (
          <>
            <IntroProgressBar step={progressStep} total={totalSteps} />
            <IntroHeading className="mb-2">{t('intro.screenTimeQuestion')}</IntroHeading>
            <IntroSubtext className="mb-8">{t('intro.screenTimeHint')}</IntroSubtext>
            <ScreenTimeSlider value={screenHours} onChange={setScreenHours} />
            <p className="text-center text-sm text-white/35 mt-8">{t('intro.screenTimeFooter')}</p>
          </>
        )

      case STEP.REVEAL:
        return (
          <>
            <IntroProgressBar step={progressStep} total={totalSteps} />
            <IntroHeading className="mb-2">{t('intro.revealTitle')}</IntroHeading>
            <IntroSubtext className="mb-6">{t('intro.revealSubtitle')}</IntroSubtext>
            <RevealComparison estimateHours={screenHours} actualHours={actualScreenHours} />
          </>
        )

      case STEP.YEARS:
        return (
          <>
            <IntroProgressBar step={progressStep} total={totalSteps} />
            <YearsInsight
              dailyHours={actualScreenHours ?? screenHours}
              fromDevice={actualScreenHours != null}
            />
          </>
        )

      case STEP.POTENTIAL:
        return (
          <>
            <IntroProgressBar step={progressStep} total={totalSteps} />
            <IntroHeading className="mb-2">{t('intro.potentialTitle')}</IntroHeading>
            <IntroSubtext className="mb-8">{t('intro.potentialSubtitle')}</IntroSubtext>
            <PotentialBars estimateHours={actualScreenHours ?? screenHours} />
          </>
        )

      case STEP.WEEK_ONE:
        return (
          <>
            <IntroProgressBar step={progressStep} total={totalSteps} />
            <IntroHeading className="mb-6">{t('intro.weekOneTitle')}</IntroHeading>
            <WeekOneStat />
            <p className="text-[11px] text-white/30 text-center mt-8">{t('intro.weekOneFootnote')}</p>
          </>
        )

      case STEP.BENEFITS:
        return (
          <>
            <IntroProgressBar step={progressStep} total={totalSteps} />
            <IntroHeading className="mb-2">{t('intro.benefitsTitle')}</IntroHeading>
            <IntroSubtext className="mb-8">{t('intro.benefitsSubtitle')}</IntroSubtext>
            <BenefitsList />
            <HoldLogoButton onComplete={() => setStep(STEP.BLOCK_PREVIEW)} />
          </>
        )

      case STEP.BLOCK_PREVIEW:
        return (
          <>
            <IntroProgressBar step={progressStep} total={totalSteps} />
            <IntroHeading className="mb-6">{t('intro.blockPreviewTitle')}</IntroHeading>
            <BlockPreviewCarousel />
          </>
        )

      case STEP.SELECT_APPS:
        return (
          <>
            <IntroProgressBar step={progressStep} total={totalSteps} />
            <IntroHeading className="mb-2">{t('onboarding.selectAppsTitle')}</IntroHeading>
            <IntroSubtext className="mb-6">{t('onboarding.selectAppsDesc')}</IntroSubtext>
            <BlocklistPicker selected={selectedApps} onChange={setSelectedApps} />
          </>
        )

      case STEP.CREATE_GOAL:
        return (
          <>
            <IntroProgressBar step={progressStep} total={totalSteps} />
            <IntroHeading className="mb-2">{t('onboarding.createGoalTitle')}</IntroHeading>
            <IntroSubtext className="mb-8">{t('onboarding.createGoalDesc')}</IntroSubtext>
            <OpeningsSlider value={openingsPerDay} onChange={setOpeningsPerDay} />
          </>
        )

      case STEP.GOAL_CONFIRMED:
        return (
          <>
            <IntroProgressBar step={progressStep} total={totalSteps} />
            <GoalCreatedCard openings={openingsPerDay} minutesPerOpening={MINUTES_PER_OPENING} />
            <p className="text-sm text-white/45 text-center mt-6 leading-relaxed">{t('onboarding.goalCreatedDesc')}</p>
          </>
        )

      case STEP.NOTIFICATIONS:
        return (
          <>
            <IntroProgressBar step={progressStep} total={totalSteps} />
            <IntroHeading className="mb-2">{t('onboarding.notificationsTitle')}</IntroHeading>
            <IntroSubtext className="mb-6">{t('onboarding.notificationsDesc')}</IntroSubtext>
            <NotificationsPreview />
          </>
        )

      case STEP.TRIAL:
        return (
          <>
            <IntroProgressBar step={progressStep} total={totalSteps} />
            <IntroHeading className="mb-2">{t('onboarding.trialTitle')}</IntroHeading>
            <IntroSubtext className="mb-8">{t('onboarding.trialDesc')}</IntroSubtext>
            <TrialTimeline />
          </>
        )

      case STEP.DIFFICULTY:
        return (
          <>
            <IntroProgressBar step={progressStep} total={totalSteps} />
            <IntroHeading className="mb-2 text-left">{t('onboarding.chooseDifficulty')}</IntroHeading>
            <IntroSubtext className="mb-6 text-left">{t('onboarding.chooseDifficultyDesc')}</IntroSubtext>
            <DifficultyPicker
              large
              value={selectedDifficulty}
              onChange={setSelectedDifficulty}
              pricingNavigateState={{ from: 'onboarding', step: STEP.DIFFICULTY }}
            />
          </>
        )

      default:
        return (
          <>
            <IntroProgressBar step={progressStep} total={totalSteps} />
            <IntroHeading className="mb-2 text-left">{t('onboarding.yourName')}</IntroHeading>
            <IntroSubtext className="mb-8 text-left">{t('onboarding.yourNameDesc')}</IntroSubtext>
            <Input
              id="name"
              label={t('onboarding.nameLabel')}
              placeholder={t('onboarding.namePlaceholder')}
              value={name}
              onChange={(e) => setName(e.target.value)}
              autoFocus
              onKeyDown={(e) => e.key === 'Enter' && name.trim() && void handleComplete(name.trim())}
              className="h-14 text-lg px-5 rounded-2xl"
            />
          </>
        )
    }
  }

  return (
    <>
      <IntroShell variant="setup" footer={step === STEP.NOTIFICATIONS ? notificationsFooter : footer}>
        <div className="flex-1 flex flex-col max-w-md mx-auto w-full">
          <AnimatePresence mode="wait">
            <motion.div
              key={step}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
              className="flex-1 flex flex-col"
            >
              {stepContent()}
            </motion.div>
          </AnimatePresence>
        </div>
      </IntroShell>
      <PrivacySheet open={privacyOpen} onClose={() => setPrivacyOpen(false)} />
    </>
  )
}
