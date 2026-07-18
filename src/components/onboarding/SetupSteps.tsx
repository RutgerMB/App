import { useMemo, useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Bell, Check, Dumbbell, Flame, Sparkles, Zap } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useTranslation } from '@/i18n/context'
import { Progress } from '@/components/ui/Progress'
import { Slider } from '@/components/ui/Slider'
import { DEVICE_APPS } from '@/data/device-apps'
import type { DeviceAppDefinition } from '@/data/device-apps'

const DISTRACTOR_IDS = ['instagram', 'tiktok', 'youtube', 'snapchat', 'x', 'facebook', 'reddit', 'netflix'] as const

export const DISTRACTOR_APPS: DeviceAppDefinition[] = DISTRACTOR_IDS.map(
  (id) => DEVICE_APPS.find((a) => a.id === id)!
)

export function DistractorAppsGrid({
  selected,
  onChange,
}: {
  selected: Set<string>
  onChange: (next: Set<string>) => void
}) {
  const { t } = useTranslation()

  const toggle = (id: string) => {
    const next = new Set(selected)
    if (next.has(id)) {
      if (next.size > 1) next.delete(id)
    } else {
      next.add(id)
    }
    onChange(next)
  }

  return (
    <div className="grid grid-cols-2 gap-2">
      {DISTRACTOR_APPS.map((app) => {
        const isSelected = selected.has(app.id)
        return (
          <button
            key={app.id}
            type="button"
            onClick={() => toggle(app.id)}
            className={cn(
              'relative flex items-center gap-2 px-3 py-3 rounded-2xl border transition-all text-left',
              isSelected
                ? 'bg-emerald-500/15 border-emerald-500/40'
                : 'bg-surface-2 border-border hover:border-border-hover'
            )}
            aria-pressed={isSelected}
          >
            {isSelected && (
              <span className="absolute top-1.5 right-1.5 w-5 h-5 rounded-full bg-emerald-500 flex items-center justify-center">
                <Check size={12} className="text-white" strokeWidth={3} />
              </span>
            )}
            <span className="text-sm font-medium text-white/85 truncate pr-5">{app.name}</span>
          </button>
        )
      })}
      <p className="col-span-2 text-xs text-white/35 text-center mt-1">{t('onboarding.selectAppsHint')}</p>
    </div>
  )
}

export function OpeningsSlider({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  const { t } = useTranslation()

  return (
    <div className="flex flex-col items-center">
      <div className="relative mb-8">
        <div className="px-8 py-5 rounded-2xl bg-surface-2 border border-border">
          <OdometerDisplay value={value} digits={2} />
        </div>
        <p className="text-center text-xs text-white/40 mt-3 font-medium uppercase tracking-wider">
          {t('onboarding.openingsLabel')}
        </p>
      </div>
      <Slider
        min={1}
        max={10}
        value={value}
        onChange={onChange}
        className="max-w-xs"
        aria-label={t('onboarding.openingsLabel')}
      />
      <div className="flex justify-between w-full max-w-xs mt-2 text-xs text-white/30 tabular-nums">
        <span>1</span>
        <span>10</span>
      </div>
      <p className="text-sm text-white/45 mt-6 text-center leading-relaxed max-w-sm">{t('onboarding.createGoalHint')}</p>
    </div>
  )
}

/** Integer hours only (1–12); numbers-only input for max daily earn cap. */
export function MaxDailyHoursInput({
  value,
  onChange,
}: {
  value: number
  onChange: (v: number) => void
}) {
  const { t } = useTranslation()
  const [draft, setDraft] = useState(String(value))

  useEffect(() => {
    setDraft(String(value))
  }, [value])

  const commit = (raw: string) => {
    const digits = raw.replace(/\D/g, '')
    if (!digits) {
      setDraft(String(value))
      return
    }
    const n = Math.min(12, Math.max(1, parseInt(digits, 10)))
    onChange(n)
    setDraft(String(n))
  }

  return (
    <div className="flex flex-col items-center w-full max-w-sm mx-auto">
      <div className="rounded-2xl bg-white/[0.03] border border-white/[0.07] px-8 py-6 mb-6 w-full text-center">
        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-white/40 mb-3">
          {t('onboarding.maxDailyHoursLabel')}
        </p>
        <div className="flex items-end justify-center gap-1">
          <input
            type="text"
            inputMode="numeric"
            pattern="[0-9]*"
            autoComplete="off"
            value={draft}
            onChange={(e) => {
              const digits = e.target.value.replace(/\D/g, '').slice(0, 2)
              setDraft(digits)
            }}
            onBlur={() => commit(draft)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault()
                commit(draft)
              }
            }}
            aria-label={t('onboarding.maxDailyHoursLabel')}
            className="w-20 bg-transparent text-center text-5xl font-bold gradient-text tabular-nums tracking-tight outline-none border-b border-emerald-500/30 focus:border-emerald-400/60 pb-1"
          />
          <span className="text-2xl font-semibold text-white/50 mb-2">h</span>
        </div>
      </div>
      <p className="text-sm text-white/45 text-center leading-relaxed max-w-sm">
        {t('onboarding.maxDailyHoursHint')}
      </p>
      <div className="flex flex-wrap justify-center gap-2 mt-6">
        {[2, 4, 6, 8].map((h) => (
          <button
            key={h}
            type="button"
            onClick={() => onChange(h)}
            className={cn(
              'px-4 py-2 rounded-xl text-sm font-semibold border transition-colors',
              value === h
                ? 'bg-emerald-500/25 border-emerald-400/50 text-emerald-200'
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

export function OdometerDisplay({ value, digits = 4 }: { value: number; digits?: number }) {
  const str = String(value).padStart(digits, '0')
  return (
    <div className="flex items-center justify-center gap-1">
      {str.split('').map((digit, i) => (
        <span
          key={`${i}-${digit}`}
          className="inline-flex items-center justify-center w-9 h-12 rounded-lg bg-surface-3 border border-border text-2xl font-bold tabular-nums text-white"
        >
          {digit}
        </span>
      ))}
    </div>
  )
}

export function GoalCreatedCard({
  openings,
  minutesPerOpening,
}: {
  openings: number
  minutesPerOpening: number
}) {
  const { t } = useTranslation()
  const goalId = useMemo(() => String(openings * 29).padStart(4, '0'), [openings])

  const weekday = useMemo(() => {
    const day = new Date().getDay()
    const keys = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'] as const
    return t(`onboarding.weekdays.${keys[day]}`)
  }, [t])

  return (
    <div className="flex flex-col items-center w-full">
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="mb-6"
      >
        <OdometerDisplay value={Number(goalId)} digits={4} />
      </motion.div>
      <p className="text-lg font-bold text-center mb-6">{t('onboarding.goalCreatedTitle')}</p>

      <div className="w-full rounded-2xl border border-white/[0.07] bg-white/[0.03] p-4">
        <div className="flex items-center gap-2 mb-3">
          <div className="w-8 h-8 rounded-lg bg-emerald-500/20 flex items-center justify-center">
            <Zap size={16} className="text-emerald-400" />
          </div>
          <div>
            <p className="text-sm font-semibold">{t('onboarding.goalActiveLabel')}</p>
            <p className="text-xs text-white/45">
              {t('onboarding.goalSchedule', { day: weekday, openings, minutes: minutesPerOpening })}
            </p>
          </div>
        </div>
        <div className="flex items-center justify-between text-xs text-white/40 mb-2">
          <span>{t('onboarding.goalProgress')}</span>
          <span className="tabular-nums">0/{openings}</span>
        </div>
        <Progress value={0} max={openings} size="sm" />
      </div>
    </div>
  )
}

const MOCK_NOTIFICATIONS = [
  { key: 'workout', icon: Dumbbell, color: 'text-emerald-400', bg: 'bg-emerald-500/15' },
  { key: 'streak', icon: Flame, color: 'text-orange-400', bg: 'bg-orange-500/15' },
  { key: 'earned', icon: Sparkles, color: 'text-emerald-400', bg: 'bg-emerald-500/15' },
] as const

export function NotificationsPreview() {
  const { t } = useTranslation()

  return (
    <div className="space-y-3">
      {MOCK_NOTIFICATIONS.map((n, i) => {
        const Icon = n.icon
        return (
          <motion.div
            key={n.key}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="flex items-start gap-3 p-4 rounded-2xl bg-white/[0.03] border border-white/[0.07]"
          >
            <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center shrink-0', n.bg)}>
              <Icon size={18} className={n.color} />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-2 mb-0.5">
                <p className="text-sm font-semibold truncate">{t(`onboarding.notificationsMock.${n.key}.title`)}</p>
                <span className="text-[10px] text-white/30 shrink-0">{t('onboarding.notificationsNow')}</span>
              </div>
              <p className="text-xs text-white/45 leading-relaxed">{t(`onboarding.notificationsMock.${n.key}.body`)}</p>
            </div>
            <Bell size={14} className="text-white/20 shrink-0 mt-1" />
          </motion.div>
        )
      })}
    </div>
  )
}

const TRIAL_STEPS = ['today', 'day5', 'day7'] as const

export function TrialTimeline() {
  const { t } = useTranslation()

  return (
    <div className="relative pl-6 space-y-6">
      <div className="absolute left-[11px] top-2 bottom-2 w-px bg-gradient-to-b from-emerald-500/50 via-teal-500/30 to-white/10" />
      {TRIAL_STEPS.map((step, i) => (
        <div key={step} className="relative flex gap-4">
          <div
            className={cn(
              'absolute -left-6 w-[22px] h-[22px] rounded-full border-2 flex items-center justify-center shrink-0',
              i === 0 ? 'bg-emerald-500 border-emerald-400' : 'bg-surface-2 border-border'
            )}
          >
            {i === 0 && <Check size={12} className="text-white" strokeWidth={3} />}
          </div>
          <div className="pb-1">
            <p className="text-xs font-semibold text-emerald-400 uppercase tracking-wide mb-0.5">
              {t(`onboarding.trialSteps.${step}.when`)}
            </p>
            <p className="text-sm font-semibold">{t(`onboarding.trialSteps.${step}.title`)}</p>
            <p className="text-xs text-white/45 mt-1 leading-relaxed">{t(`onboarding.trialSteps.${step}.desc`)}</p>
          </div>
        </div>
      ))}
    </div>
  )
}
