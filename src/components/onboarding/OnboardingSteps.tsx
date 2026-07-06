import { useState, useRef, useCallback } from 'react'
import { motion } from 'framer-motion'
import { Check, TrendingDown, Dumbbell, Lock } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useTranslation } from '@/i18n/context'
import { computeLifetimeScrollStats, formatInsightCount, INSIGHT_HORIZON_YEARS } from '@/lib/insight-math'

export function formatHoursMinutes(totalHours: number): string {
  const h = Math.floor(totalHours)
  const m = Math.round((totalHours - h) * 60)
  if (h === 0) return `${m}m`
  if (m === 0) return `${h}h`
  return `${h}h ${m}m`
}

/** Estimate vs what RepLock users typically reclaim through workouts. */
export function projectedDailyHours(estimateHours: number): number {
  return Math.max(0.5, Math.round(estimateHours * 0.72 * 10) / 10)
}

export function RevealComparison({
  estimateHours,
  actualHours,
}: {
  estimateHours: number
  actualHours: number | null
}) {
  const { t } = useTranslation()
  const actual = actualHours ?? estimateHours
  const fromDevice = actualHours != null
  const diff = Math.abs(estimateHours - actual)
  const pct = estimateHours > 0 ? Math.round((diff / estimateHours) * 100) : 0
  const actualLower = actual < estimateHours

  return (
    <div className="flex flex-col items-center text-center">
      <div className="w-14 h-14 rounded-2xl bg-emerald-500/15 flex items-center justify-center mb-6">
        <TrendingDown size={28} className="text-emerald-400" />
      </div>
      <p className="text-4xl sm:text-5xl font-bold tabular-nums gradient-text mb-2">
        {formatHoursMinutes(actual)}
      </p>
      <p className="text-sm text-white/45 mb-8">
        {fromDevice
          ? actualLower
            ? t('intro.revealActualLess', { pct })
            : t('intro.revealActualMore', { pct })
          : t('intro.revealPercentLess', { pct: Math.round(estimateHours * 0.28) })}
      </p>
      <p className="text-xs text-white/30 mb-4">
        {fromDevice ? t('intro.revealFromDevice') : t('intro.revealEstimateOnly')}
      </p>
      <div className="grid grid-cols-2 gap-3 w-full max-w-xs">
        <div className="rounded-2xl bg-surface-2 border border-border p-4">
          <div className="h-1 rounded-full bg-white/20 mb-3" />
          <p className="text-lg font-bold tabular-nums">{formatHoursMinutes(estimateHours)}</p>
          <p className="text-xs text-white/40 mt-1">{t('intro.revealYouThought')}</p>
        </div>
        <div className="rounded-2xl bg-emerald-500/10 border border-emerald-500/25 p-4">
          <div className="h-1 rounded-full bg-emerald-400 mb-3" />
          <p className="text-lg font-bold tabular-nums text-emerald-400">{formatHoursMinutes(actual)}</p>
          <p className="text-xs text-white/40 mt-1">
            {fromDevice ? t('intro.revealActualLabel') : t('intro.revealWithRepLock')}
          </p>
        </div>
      </div>
    </div>
  )
}

export function PotentialBars({ estimateHours }: { estimateHours: number }) {
  const { t } = useTranslation()
  const without = estimateHours
  const withApp = Math.max(0.5, estimateHours * 0.25)
  const max = without

  return (
    <div className="space-y-8 w-full max-w-sm mx-auto">
      <div>
        <p className="text-sm font-semibold text-white/70 mb-3">{t('intro.potentialScrollLabel')}</p>
        <BarRow label={t('intro.potentialNow')} value={without} max={max} variant="bad" />
        <BarRow label={t('intro.potentialWith')} value={withApp} max={max} variant="good" className="mt-2" />
      </div>
      <div>
        <p className="text-sm font-semibold text-white/70 mb-3">{t('intro.potentialWorkoutsLabel')}</p>
        <BarRow label={t('intro.potentialNow')} value={0.3} max={2} variant="bad" format={(v) => `${Math.round(v * 10)}/wk`} />
        <BarRow
          label={t('intro.potentialWith')}
          value={1.6}
          max={2}
          variant="good"
          className="mt-2"
          format={() => '4/wk'}
        />
      </div>
    </div>
  )
}

function BarRow({
  label,
  value,
  max,
  variant,
  className,
  format,
}: {
  label: string
  value: number
  max: number
  variant: 'bad' | 'good'
  className?: string
  format?: (v: number) => string
}) {
  const pct = Math.min(100, (value / max) * 100)
  const display = format ? format(value) : formatHoursMinutes(value)

  return (
    <div className={cn('flex items-center gap-3', className)}>
      <div className="flex-1 h-11 rounded-xl bg-surface-2 border border-border overflow-hidden relative">
        <div
          className={cn(
            'absolute inset-y-0 left-0 rounded-xl flex items-center px-3 text-sm font-semibold',
            variant === 'bad' && 'bg-gradient-to-r from-violet-600 to-pink-600 text-white',
            variant === 'good' && 'bg-gradient-to-r from-indigo-500 to-indigo-400 text-white'
          )}
          style={{ width: `${Math.max(pct, 28)}%` }}
        >
          {display}
        </div>
      </div>
      <span className="text-xs text-white/35 w-16 shrink-0 text-right">{label}</span>
    </div>
  )
}

export function WeekOneStat() {
  const { t } = useTranslation()
  return (
    <div className="text-center">
      <p className="text-5xl sm:text-6xl font-bold gradient-text leading-none">32%</p>
      <p className="text-3xl font-bold text-white/90 mt-1">↓</p>
      <p className="text-sm text-white/45 mt-6 leading-relaxed max-w-xs mx-auto">{t('intro.weekOneDesc')}</p>
    </div>
  )
}

export function BenefitsList() {
  const { t } = useTranslation()
  const items = [
    t('intro.benefit1'),
    t('intro.benefit2'),
    t('intro.benefit3'),
    t('intro.benefit4'),
    t('intro.benefit5'),
  ]

  return (
    <ul className="space-y-4 w-full max-w-sm mx-auto">
      {items.map((item, i) => (
        <motion.li
          key={item}
          initial={{ opacity: 0, x: -12 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: i * 0.06 }}
          className="flex items-start gap-3"
        >
          <div className="w-6 h-6 rounded-full bg-emerald-500/20 flex items-center justify-center shrink-0 mt-0.5">
            <Check size={14} className="text-emerald-400" />
          </div>
          <span className="text-sm text-white/80 leading-snug">{item}</span>
        </motion.li>
      ))}
    </ul>
  )
}

const HOLD_MS = 1200

export function HoldLogoButton({ onComplete }: { onComplete: () => void }) {
  const { t } = useTranslation()
  const [progress, setProgress] = useState(0)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const startRef = useRef(0)

  const clear = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current)
    timerRef.current = null
    setProgress(0)
  }, [])

  const startHold = () => {
    startRef.current = Date.now()
    timerRef.current = setInterval(() => {
      const elapsed = Date.now() - startRef.current
      const p = Math.min(1, elapsed / HOLD_MS)
      setProgress(p)
      if (p >= 1) {
        clear()
        onComplete()
      }
    }, 16)
  }

  return (
    <div className="flex flex-col items-center py-4">
      <button
        type="button"
        onPointerDown={startHold}
        onPointerUp={clear}
        onPointerLeave={clear}
        onPointerCancel={clear}
        className="relative w-24 h-24 rounded-[1.75rem] bg-gradient-to-br from-indigo-500 to-violet-600 shadow-2xl shadow-indigo-500/40 flex items-center justify-center select-none touch-none"
        aria-label={t('intro.holdLogo')}
      >
        <svg className="absolute inset-0 w-full h-full -rotate-90" viewBox="0 0 100 100">
          <circle cx="50" cy="50" r="46" fill="none" stroke="rgba(255,255,255,0.15)" strokeWidth="4" />
          <circle
            cx="50"
            cy="50"
            r="46"
            fill="none"
            stroke="white"
            strokeWidth="4"
            strokeLinecap="round"
            strokeDasharray={289}
            strokeDashoffset={289 * (1 - progress)}
          />
        </svg>
        <Dumbbell size={36} className="text-white relative z-10" strokeWidth={1.75} />
      </button>
      <p className="text-lg font-bold mt-6">{t('intro.holdTitle')}</p>
      <p className="text-xs text-white/40 mt-2 text-center max-w-[220px]">{t('intro.holdHint')}</p>
    </div>
  )
}

const BLOCK_PREVIEWS = [
  { key: 'workout', bg: 'from-indigo-950 to-violet-950', icon: '💪', accent: 'indigo' },
  { key: 'streak', bg: 'from-emerald-950 to-teal-950', icon: '🔥', accent: 'emerald' },
  { key: 'focus', bg: 'from-slate-900 to-indigo-950', icon: '📵', accent: 'violet' },
] as const

export function BlockPreviewCarousel() {
  const { t } = useTranslation()
  const [index, setIndex] = useState(0)
  const preview = BLOCK_PREVIEWS[index]

  return (
    <div className="flex flex-col items-center">
      <div className="relative w-[220px] h-[380px] rounded-[2.5rem] bg-surface-3 border-4 border-surface-4 shadow-2xl overflow-hidden">
        <div className="absolute top-3 left-1/2 -translate-x-1/2 w-20 h-6 bg-black rounded-full z-10" />
        <div className={cn('absolute inset-2 top-8 rounded-[2rem] bg-gradient-to-b flex flex-col items-center justify-center p-5 text-center', preview.bg)}>
          <span className="text-4xl mb-4">{preview.icon}</span>
          <p className="text-base font-bold text-white leading-snug mb-2">
            {t(`intro.blockPreview.${preview.key}.title`)}
          </p>
          <p className="text-xs text-white/70 leading-relaxed mb-4">
            {t(`intro.blockPreview.${preview.key}.body`)}
          </p>
          <div className="flex items-center gap-1.5 text-[10px] text-white/45">
            <Lock size={10} />
            {t(`intro.blockPreview.${preview.key}.rule`)}
          </div>
        </div>
      </div>
      <div className="flex gap-2 mt-6">
        {BLOCK_PREVIEWS.map((p, i) => (
          <button
            key={p.key}
            type="button"
            onClick={() => setIndex(i)}
            className={cn('w-2 h-2 rounded-full transition-all', i === index ? 'bg-indigo-400 w-5' : 'bg-white/20')}
            aria-label={`Preview ${i + 1}`}
          />
        ))}
      </div>
      <p className="text-xs text-white/35 mt-4 text-center max-w-xs">{t('intro.blockPreview.hint')}</p>
    </div>
  )
}

export function YearsInsight({
  dailyHours,
  fromDevice = false,
}: {
  dailyHours: number
  fromDevice?: boolean
}) {
  const { t } = useTranslation()
  const stats = computeLifetimeScrollStats(dailyHours)
  const repsLabel = formatInsightCount(stats.repsIfTrainedInstead)

  return (
    <div className="text-center">
      <p className="text-sm text-indigo-300/90 italic mb-2">
        {formatHoursMinutes(stats.dailyHours)} {t('intro.yearsPerDay')}
      </p>
      <p className="text-xs text-white/35 mb-4">
        {fromDevice ? t('intro.yearsBasedOnDevice') : t('intro.yearsBasedOnEstimate')}
      </p>
      <p className="text-lg font-semibold text-white/80 mb-6 leading-snug">
        {t('intro.yearsTitle', { years: INSIGHT_HORIZON_YEARS })}
      </p>
      <p className="text-6xl sm:text-7xl font-bold gradient-text leading-none tabular-nums">
        {stats.yearsOnPhone.toLocaleString()}
      </p>
      <p className="text-xl font-bold text-white mt-2 uppercase tracking-wider">{t('intro.yearsLabel')}</p>
      <p className="text-sm text-white/45 mt-2">{t('intro.yearsOnPhone')}</p>
      <p className="text-xs text-white/35 mt-8 max-w-xs mx-auto leading-relaxed">
        {t('intro.yearsFootnote', { reps: repsLabel })}
      </p>
    </div>
  )
}
