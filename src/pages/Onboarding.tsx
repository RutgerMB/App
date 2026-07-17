import { motion, AnimatePresence } from 'framer-motion'
import { useNavigate, useLocation } from 'react-router-dom'
import { Shield, X, Scale, Smartphone, Eye } from 'lucide-react'
import { useState, useEffect, useMemo } from 'react'
import {
  IntroShell,
  IntroProgressBar,
  IntroPrimaryButton,
  IntroHeading,
  IntroSubtext,
  IntroBrandMark,
  IntroBackButton,
} from '@/components/onboarding/IntroShell'
import {
  RevealComparison,
  YearsInsight,
  PotentialBars,
  WeekOneStat,
  BenefitsList,
  HoldLogoButton,
  BlockPreviewCarousel,
  formatHoursMinutes,
} from '@/components/onboarding/OnboardingSteps'
import {
  OpeningsSlider,
  GoalCreatedCard,
  NotificationsPreview,
  TrialTimeline,
} from '@/components/onboarding/SetupSteps'
import { BlocklistPicker, resolveSelectedApps } from '@/components/onboarding/BlocklistPicker'
import { Slider } from '@/components/ui/Slider'
import { DEVICE_APPS } from '@/data/device-apps'
import { SetupIntroIllustration, ScreenTimePermissionStep } from '@/components/onboarding/OnboardingVisuals'
import type { DeviceAppDefinition } from '@/data/device-apps'
import { getDeviceApps, isNativeIos, usesIosActivityPicker } from '@/lib/device-apps'
import {
  checkScreenTimePermission,
  requestScreenTimePermission,
  requestIosScreenTimeAccess,
  fetchDailyScreenTimeHours,
  fetchDailyScreenTimeHoursWithRetry,
  presentDailyScreenTimeReport,
  getScreenTimePlatform,
  SCREEN_TIME_BASELINE_WINDOW_DAYS,
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
import { requestNotificationPermission } from '@/lib/push-notifications'
import { syncLocalReminders } from '@/lib/planned-notifications'
import { cn } from '@/lib/utils'

const SCREEN_TIME_KEY = 'replock-onboarding-screen-hours'
const DEFAULT_SELECTED_APPS = ['instagram', 'tiktok', 'youtube']
const MINUTES_PER_OPENING = 5

/** Screen-time narrative: GUESS → REVEAL → POTENTIAL with RepLock → YEARS. */
const STEP = {
  INTRO: 1,
  LANGUAGE: 2,
  SCREEN_TIME_PRIMER_GUESS: 3,
  SCREEN_TIME_PRIMER_TRUTH: 4,
  SCREEN_TIME_PRIMER_PLAN: 5,
  SCREEN_TIME_PERMISSION: 6,
  SCREEN_TIME_GUESS: 7,
  SCREEN_TIME_REPORT: 8,
  REVEAL: 9,
  POTENTIAL: 10,
  YEARS: 11,
  WEEK_ONE: 12,
  BENEFITS: 13,
  BLOCK_PREVIEW: 14,
  SELECT_APPS: 15,
  CREATE_GOAL: 16,
  GOAL_CONFIRMED: 17,
  NOTIFICATIONS: 18,
  TRIAL: 19,
  DIFFICULTY: 20,
  NAME: 21,
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
        className="relative w-full max-w-md max-h-[85dvh] overflow-y-auto rounded-t-3xl sm:rounded-3xl bg-surface-2 border border-white/[0.08] p-6 shadow-2xl text-white"
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
            <div key={card.title} className="rounded-2xl border border-white/[0.07] bg-white/[0.03] p-4">
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

const SCREEN_TIME_PRESETS = [2, 4, 6, 8] as const

function ScreenTimeSlider({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  const { t } = useTranslation()

  return (
    <div className="flex flex-col items-center w-full max-w-sm mx-auto">
      <div className="rounded-2xl bg-white/[0.03] border border-white/[0.07] px-8 py-6 mb-8 w-full max-w-xs text-center">
        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-white/40 mb-3">
          {t('intro.screenTimeGuessLabel')}
        </p>
        <p className="text-5xl font-bold gradient-text tabular-nums tracking-tight">{value}h</p>
      </div>
      <Slider
        min={1}
        max={12}
        value={value}
        onChange={onChange}
        className="max-w-xs"
        aria-label={t('intro.screenTimeQuestion')}
      />
      <div className="flex justify-between w-full max-w-xs mt-2 text-xs text-white/30 tabular-nums">
        <span>1h</span>
        <span>12h</span>
      </div>
      <div className="flex flex-wrap justify-center gap-2 mt-6">
        {SCREEN_TIME_PRESETS.map((h) => (
          <button
            key={h}
            type="button"
            onClick={() => onChange(h)}
            className={cn(
              'px-4 py-2 rounded-xl text-sm font-semibold border transition-colors',
              value === h
                ? 'bg-indigo-500/25 border-indigo-400/50 text-indigo-200'
                : 'bg-white/[0.03] border-white/[0.07] text-white/55 hover:border-white/[0.12]'
            )}
          >
            {h}h
          </button>
        ))}
      </div>
    </div>
  )
}

function PrimerBeat({ icon: Icon, label }: { icon: typeof Scale; label: string }) {
  return (
    <div className="flex flex-col items-center text-center w-full max-w-xs mx-auto py-8">
      <div className="w-16 h-16 rounded-[1.75rem] border border-white/[0.08] bg-white/[0.04] flex items-center justify-center mb-6">
        <Icon size={28} className="text-indigo-300" />
      </div>
      <p className="text-xl font-semibold text-white/85 leading-snug">{label}</p>
    </div>
  )
}

function ScreenTimeReportPrompt({
  platform,
  guessHours,
}: {
  platform: ReturnType<typeof getScreenTimePlatform>
  guessHours: number
}) {
  const { t } = useTranslation()
  const title =
    platform === 'ios' ? t('intro.reportReadyIos') : t('intro.reportReadyCompare')

  return (
    <div className="w-full max-w-sm mx-auto">
      <div className="rounded-[28px] border border-white/[0.08] bg-gradient-to-br from-indigo-500/10 via-white/[0.03] to-violet-500/10 p-5 text-center">
        <div className="inline-flex items-center gap-2 rounded-full border border-white/[0.08] bg-white/[0.04] px-3 py-1.5 mb-4">
          <Eye size={14} className="text-indigo-300" />
          <span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-white/55">
            {t('intro.reportRevealBadge')}
          </span>
        </div>
        <p className="text-2xl font-bold tracking-tight text-white mb-5">{title}</p>
        <div className="rounded-2xl border border-white/[0.07] bg-black/20 p-4">
          <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-white/35 mb-2">
            {t('intro.screenTimeGuessLabel')}
          </p>
          <p className="text-3xl font-bold gradient-text tabular-nums">{formatHoursMinutes(guessHours)}</p>
        </div>
        <p className="text-xs text-white/40 mt-4">
          {t('intro.screenTimeWindowAvg', { days: SCREEN_TIME_BASELINE_WINDOW_DAYS })}
        </p>
      </div>
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
  /** iOS: user saw the native DeviceActivityReport sheet (numeric export usually unavailable). */
  const [sawNativeScreenTimeReport, setSawNativeScreenTimeReport] = useState(false)
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
  const logout = useAuthStore((s) => s.logout)
  const navigate = useNavigate()
  const { t } = useTranslation()
  const { toast } = useToast()

  const resolvedName = useMemo(
    () => (name.trim() || profileName.trim() || authUser?.name?.trim() || '').trim(),
    [name, profileName, authUser?.name]
  )

  const needsNameStep = resolvedName.length === 0
  const SKIPPED_ONBOARDING_STEPS = 1 // WEEK_ONE skipped after YEARS
  const totalSteps = (needsNameStep ? 21 : 20) - SKIPPED_ONBOARDING_STEPS
  const progressStep = step > STEP.WEEK_ONE ? step - SKIPPED_ONBOARDING_STEPS : step
  const screenTimePlatform = getScreenTimePlatform()
  const baselineHours = actualScreenHours ?? screenHours

  useEffect(() => {
    setLocale(selectedLocale)
  }, [selectedLocale, setLocale])

  const refreshScreenTimeAccess = async (opts?: { retry?: boolean }) => {
    setScreenTimeChecking(true)
    try {
      const granted = await checkScreenTimePermission()
      setScreenTimeGranted(granted)
      if (!granted) return
      // iOS: never tight-poll App Group (export blocked on device; old probe UI flashed).
      if (screenTimePlatform === 'ios') {
        const data = await fetchDailyScreenTimeHours()
        if (data) setActualScreenHours(Math.max(0.5, Math.round(data.hours * 10) / 10))
        return
      }
      const data = opts?.retry
        ? await fetchDailyScreenTimeHoursWithRetry()
        : await fetchDailyScreenTimeHours()
      if (data) setActualScreenHours(Math.max(0.5, Math.round(data.hours * 10) / 10))
    } finally {
      setScreenTimeChecking(false)
    }
  }

  const showNativeScreenTimeSheetOnce = async () => {
    if (screenTimePlatform !== 'ios') return false
    const shown = await presentDailyScreenTimeReport()
    if (shown) setSawNativeScreenTimeReport(true)
    return shown
  }

  const handleScreenTimeAuthorize = async () => {
    setScreenTimeChecking(true)
    try {
      if (screenTimePlatform === 'ios') {
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
          return
        }
        if (result.authorized) {
          setScreenTimeGranted(true)
          toast(t('onboarding.screenTimeIosAuthorized'), 'success')
          // One soft App Group read (usually null on device) — never poll.
          const data = await fetchDailyScreenTimeHours()
          if (data) {
            setActualScreenHours(Math.max(0.5, Math.round(data.hours * 10) / 10))
          }
          return
        }
      } else {
        await requestScreenTimePermission()
        await refreshScreenTimeAccess({ retry: true })
      }
    } finally {
      setScreenTimeChecking(false)
    }
  }

  useEffect(() => {
    if (step === STEP.SCREEN_TIME_PERMISSION) void refreshScreenTimeAccess()
  }, [step])

  // Do not auto-re-fetch or re-present DeviceActivityReport on reveal —
  // that re-flashed the raw total every minute / every poll.
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

  const handleUsePopularDefaults = async () => {
    const catalog = appCatalog.length > 0 ? appCatalog : await getDeviceApps()
    const fallbackCatalog = catalog.length > 0 ? catalog : DEVICE_APPS
    const defaults = DEFAULT_SELECTED_APPS.map((id) => fallbackCatalog.find((a) => a.id === id)).filter(
      (a): a is DeviceAppDefinition => Boolean(a)
    )
    if (defaults.length === 0) {
      toast(t('onboarding.selectAppsRequired'), 'error')
      return
    }
    setSelectedApps(new Set(defaults.map((a) => a.id)))
    setAppCatalog(fallbackCatalog)
    toast(t('onboarding.selectAppsSkipHint'), 'info')
    setStep((s) => s + 1)
  }

  const advance = () => setStep((s) => s + 1)

  const goBack = () => {
    if (step <= STEP.INTRO) {
      void logout()
      return
    }
    if (step === STEP.BENEFITS) {
      setStep(STEP.YEARS)
      return
    }
    if (step === STEP.NAME) {
      setStep(STEP.DIFFICULTY)
      return
    }
    if (step === STEP.GOAL_CONFIRMED) {
      setStep(STEP.CREATE_GOAL)
      return
    }
    if (step === STEP.WEEK_ONE) {
      setStep(STEP.YEARS)
      return
    }
    setStep((s) => s - 1)
  }

  const handleContinue = async () => {
    if (step === STEP.SCREEN_TIME_PERMISSION) {
      // Android: Continue opens usage-access settings until granted
      if (screenTimePlatform === 'android' && !screenTimeGranted) {
        await requestScreenTimePermission()
        await refreshScreenTimeAccess({ retry: true })
        return
      }
      // iOS: permission check only — never poll App Group / re-host the report.
      if (screenTimePlatform === 'ios') {
        await refreshScreenTimeAccess()
        advance()
        return
      }
      await refreshScreenTimeAccess({ retry: true })
      advance()
      return
    }
    if (step === STEP.SCREEN_TIME_GUESS) {
      // Do not block Continue on iOS numeric export (usually unavailable).
      if (actualScreenHours == null && screenTimePlatform !== 'ios') {
        await refreshScreenTimeAccess({ retry: true })
      }
      advance()
      return
    }
    if (step === STEP.SCREEN_TIME_REPORT) {
      if (screenTimePlatform === 'ios' && screenTimeGranted) {
        await showNativeScreenTimeSheetOnce()
        const data = await fetchDailyScreenTimeHours()
        if (data) setActualScreenHours(Math.max(0.5, Math.round(data.hours * 10) / 10))
        advance()
        return
      }
      if (screenTimePlatform !== 'web' && actualScreenHours == null) {
        await refreshScreenTimeAccess({ retry: true })
      }
      advance()
      return
    }
    if (step === STEP.SELECT_APPS) {
      if (selectedApps.size === 0) {
        toast(t('onboarding.selectAppsRequired'), 'error')
        return
      }
      advance()
      return
    }
    if (step === STEP.CREATE_GOAL) {
      // Always re-read iOS selection so nicknames from the native sheet stick.
      const fresh = await getDeviceApps()
      const catalog =
        fresh.length > 0 ? fresh : appCatalog.length > 0 ? appCatalog : DEVICE_APPS
      if (fresh.length > 0) setAppCatalog(fresh)
      const resolved = resolveSelectedApps(selectedApps, catalog)
      if (resolved.length === 0) {
        toast(t('onboarding.selectAppsRequired'), 'error')
        return
      }
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
      // Skip WEEK_ONE — go straight to benefits after lifetime insight.
      setStep(STEP.BENEFITS)
      return
    }
    advance()
  }

  const handleAllowNotifications = async () => {
    const granted = await requestNotificationPermission()
    setNotificationsEnabled(granted)
    if (granted) {
      const state = useStore.getState()
      await syncLocalReminders({
        profile: { ...state.profile, notificationsEnabled: true },
        currentStreak: state.currentStreak,
        lastExerciseDate: state.lastExerciseDate,
        screenTimeBalance: state.screenTimeBalance,
        locale: state.profile.locale ?? 'en',
      })
    }
    advance()
  }

  const continueLabel =
    step === STEP.DIFFICULTY && !needsNameStep
      ? t('onboarding.startEarning')
      : step === STEP.NAME
        ? t('onboarding.startEarning')
        : step === STEP.SCREEN_TIME_REPORT
          ? screenTimePlatform === 'ios' && screenTimeGranted
            ? sawNativeScreenTimeReport
              ? t('intro.showItAgain')
              : t('intro.showRealNumber')
            : t('common.continue')
        : step === STEP.YEARS
          ? t('intro.yearsCta')
          : undefined

  const continueDisabled =
    (step === STEP.NAME && !name.trim()) || (step === STEP.SELECT_APPS && selectedApps.size === 0)
  const hideFooter = step === STEP.BENEFITS || step === STEP.NOTIFICATIONS
  const hidePrimaryOnTrial = step === STEP.TRIAL

  const selectAppsFooter = (
    <div className="space-y-2">
      <IntroPrimaryButton onClick={handleContinue} disabled={selectedApps.size === 0}>
        {t('common.continue')}
      </IntroPrimaryButton>
      {selectedApps.size === 0 && (
        <button
          type="button"
          onClick={() => void handleUsePopularDefaults()}
          className="w-full py-3 rounded-2xl border border-border bg-surface-2 text-sm font-semibold text-white/70 hover:bg-surface-3 transition-colors"
        >
          {t('onboarding.usePopularDefaults')}
        </button>
      )}
    </div>
  )

  const footer = hideFooter ? undefined : hidePrimaryOnTrial ? (
    <div className="space-y-2">
      <IntroPrimaryButton onClick={() => navigate('/pricing', { state: { from: 'onboarding', step: STEP.TRIAL } })}>
        {t('onboarding.trialViewPro')}
      </IntroPrimaryButton>
      <button
        type="button"
        onClick={() => setStep(STEP.DIFFICULTY)}
        className="w-full py-3 rounded-2xl border border-border bg-surface-2 text-sm font-semibold text-white/80 hover:bg-surface-3 transition-colors"
      >
        {t('onboarding.trialContinueFree')}
        <span className="block text-xs font-normal text-white/40 mt-0.5">{t('onboarding.trialContinueFreeDesc')}</span>
      </button>
    </div>
  ) : (
    <>
      <IntroPrimaryButton onClick={handleContinue} disabled={continueDisabled}>
        {continueLabel ?? t('common.continue')}
      </IntroPrimaryButton>
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
            <button
              type="button"
              onClick={() => void logout()}
              className="text-sm text-white/45 mb-3 self-start hover:text-white/80 transition-colors"
            >
              ← {t('intro.backToLogin')}
            </button>
            <IntroProgressBar step={progressStep} total={totalSteps} />
            <IntroBrandMark />
            <IntroHeading className="mb-2">{t('intro.setupIntroTitle')}</IntroHeading>
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
            <IntroBrandMark />
            <IntroHeading className="mb-2">{t('onboarding.chooseLanguage')}</IntroHeading>
            <LanguagePicker large value={selectedLocale} onChange={setSelectedLocale} />
          </>
        )

      case STEP.SCREEN_TIME_PERMISSION:
        return (
          <>
            <IntroProgressBar step={progressStep} total={totalSteps} />
            <IntroBrandMark />
            <IntroHeading className="mb-2">{t('onboarding.screenTimePermissionTitle')}</IntroHeading>
            <ScreenTimePermissionStep
              platform={screenTimePlatform}
              granted={screenTimeGranted}
              loading={screenTimeChecking}
              onRequest={() => void handleScreenTimeAuthorize()}
              onRefresh={() => void refreshScreenTimeAccess()}
            />
          </>
        )

      case STEP.SCREEN_TIME_PRIMER_GUESS:
        return (
          <>
            <IntroProgressBar step={progressStep} total={totalSteps} />
            <IntroBrandMark />
            <IntroHeading className="mb-2">{t('intro.primerGuessTitle')}</IntroHeading>
            <PrimerBeat icon={Scale} label={t('intro.primerGuessDesc')} />
          </>
        )

      case STEP.SCREEN_TIME_PRIMER_TRUTH:
        return (
          <>
            <IntroProgressBar step={progressStep} total={totalSteps} />
            <IntroBrandMark />
            <IntroHeading className="mb-2">{t('intro.primerTruthTitle')}</IntroHeading>
            <PrimerBeat
              icon={Eye}
              label={t('intro.primerTruthDesc', {
                window: t('intro.screenTimeWindowAvg', { days: SCREEN_TIME_BASELINE_WINDOW_DAYS }),
              })}
            />
          </>
        )

      case STEP.SCREEN_TIME_PRIMER_PLAN:
        return (
          <>
            <IntroProgressBar step={progressStep} total={totalSteps} />
            <IntroBrandMark />
            <IntroHeading className="mb-2">{t('intro.primerPlanTitle')}</IntroHeading>
            <PrimerBeat icon={Smartphone} label={t('intro.primerPlanDesc')} />
          </>
        )

      case STEP.SCREEN_TIME_GUESS:
        return (
          <>
            <IntroProgressBar step={progressStep} total={totalSteps} />
            <IntroBrandMark />
            <IntroHeading className="mb-2">{t('intro.screenTimeQuestion')}</IntroHeading>
            <ScreenTimeSlider value={screenHours} onChange={setScreenHours} />
          </>
        )

      case STEP.SCREEN_TIME_REPORT:
        return (
          <>
            <IntroProgressBar step={progressStep} total={totalSteps} />
            <IntroBrandMark />
            <IntroHeading className="mb-2">{t('intro.reportTitle')}</IntroHeading>
            <ScreenTimeReportPrompt platform={screenTimePlatform} guessHours={screenHours} />
          </>
        )

      case STEP.REVEAL:
        return (
          <>
            <IntroProgressBar step={progressStep} total={totalSteps} />
            <IntroBrandMark />
            <IntroHeading className="mb-6">{t('intro.revealTitle')}</IntroHeading>
            <RevealComparison
              estimateHours={screenHours}
              actualHours={actualScreenHours}
              sawNativeReport={sawNativeScreenTimeReport}
              onShowDeviceReport={
                screenTimePlatform === 'ios' && screenTimeGranted
                  ? () => {
                      void showNativeScreenTimeSheetOnce()
                    }
                  : undefined
              }
            />
          </>
        )

      case STEP.POTENTIAL:
        return (
          <>
            <IntroProgressBar step={progressStep} total={totalSteps} />
            <IntroBrandMark />
            <IntroHeading className="mb-2">{t('intro.potentialTitle')}</IntroHeading>
            <PotentialBars
              baselineHours={baselineHours}
              fromDevice={actualScreenHours != null}
            />
          </>
        )

      case STEP.YEARS:
        return (
          <>
            <IntroProgressBar step={progressStep} total={totalSteps} />
            <YearsInsight
              dailyHours={baselineHours}
              fromDevice={actualScreenHours != null}
            />
          </>
        )

      case STEP.WEEK_ONE:
        return (
          <>
            <IntroProgressBar step={progressStep} total={totalSteps} />
            <IntroBrandMark />
            <IntroHeading className="mb-6">{t('intro.weekOneTitle')}</IntroHeading>
            <WeekOneStat />
            <p className="text-[11px] text-white/30 text-center mt-8">{t('intro.weekOneFootnote')}</p>
          </>
        )

      case STEP.BENEFITS:
        return (
          <>
            <IntroProgressBar step={progressStep} total={totalSteps} />
            <IntroBrandMark />
            <IntroHeading className="mb-2">{t('intro.benefitsTitle')}</IntroHeading>
            <BenefitsList />
            <HoldLogoButton onComplete={() => setStep(STEP.BLOCK_PREVIEW)} />
          </>
        )

      case STEP.BLOCK_PREVIEW:
        return (
          <>
            <IntroProgressBar step={progressStep} total={totalSteps} />
            <IntroBrandMark />
            <IntroHeading className="mb-6">{t('intro.blockPreviewTitle')}</IntroHeading>
            <BlockPreviewCarousel />
          </>
        )

      case STEP.SELECT_APPS:
        return (
          <>
            <IntroProgressBar step={progressStep} total={totalSteps} />
            <IntroBrandMark />
            <IntroHeading className="mb-2">{t('onboarding.selectAppsTitle')}</IntroHeading>
            <BlocklistPicker
              selected={selectedApps}
              onChange={setSelectedApps}
              onAppsChange={setAppCatalog}
            />
          </>
        )

      case STEP.CREATE_GOAL:
        return (
          <>
            <IntroProgressBar step={progressStep} total={totalSteps} />
            <IntroBrandMark />
            <IntroHeading className="mb-2">{t('onboarding.createGoalTitle')}</IntroHeading>
            <OpeningsSlider value={openingsPerDay} onChange={setOpeningsPerDay} />
          </>
        )

      case STEP.GOAL_CONFIRMED:
        return (
          <>
            <IntroProgressBar step={progressStep} total={totalSteps} />
            <IntroBrandMark />
            <GoalCreatedCard openings={openingsPerDay} minutesPerOpening={MINUTES_PER_OPENING} />
          </>
        )

      case STEP.NOTIFICATIONS:
        return (
          <>
            <IntroProgressBar step={progressStep} total={totalSteps} />
            <IntroBrandMark />
            <IntroHeading className="mb-2">{t('onboarding.notificationsTitle')}</IntroHeading>
            <NotificationsPreview />
          </>
        )

      case STEP.TRIAL:
        return (
          <>
            <IntroProgressBar step={progressStep} total={totalSteps} />
            <IntroBrandMark />
            <IntroHeading className="mb-2">{t('onboarding.trialTitle')}</IntroHeading>
            <TrialTimeline />
          </>
        )

      case STEP.DIFFICULTY:
        return (
          <>
            <IntroProgressBar step={progressStep} total={totalSteps} />
            <IntroBrandMark />
            <IntroHeading className="mb-2">{t('onboarding.chooseDifficulty')}</IntroHeading>
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
            <IntroBrandMark />
            <IntroHeading className="mb-2">{t('onboarding.yourName')}</IntroHeading>
            <IntroSubtext className="mb-8">{t('onboarding.yourNameDesc')}</IntroSubtext>
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
      <IntroShell
        variant="setup"
        footer={
          step === STEP.NOTIFICATIONS
            ? notificationsFooter
            : step === STEP.SELECT_APPS
              ? selectAppsFooter
              : footer
        }
      >
        <div className="flex-1 flex flex-col max-w-md mx-auto w-full">
          {step > STEP.INTRO && (
            <IntroBackButton onClick={goBack} label={t('common.back')} />
          )}
          <AnimatePresence mode="wait">
            <motion.div
              key={step}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.32, ease: [0.16, 1, 0.3, 1] }}
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
