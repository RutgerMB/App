import { useState, useRef, useCallback } from 'react'
import { motion } from 'framer-motion'
import { Check, TrendingDown, Dumbbell, Lock, Sparkles } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useTranslation } from '@/i18n/context'
import {
  computeLifetimeScrollStats,
  computeWithRepLockProjection,
  formatInsightCount,
  INSIGHT_HORIZON_YEARS,
  REPLOCK_TARGET_REDUCTION,
} from '@/lib/insight-math'

export function formatHoursMinutes(totalHours: number): string {
  const h = Math.floor(totalHours)
  const m = Math.round((totalHours - h) * 60)
  if (h === 0) return `${m}m`
  if (m === 0) return `${h}h`
  return `${h}h ${m}m`
}

/** @deprecated Prefer computeWithRepLockProjection — kept for callers that only need hours. */
export function projectedDailyHours(estimateHours: number): number {
  return computeWithRepLockProjection(estimateHours).withRepLockHours
}

/** Screen B: guess vs actual device screen time (never fakes With RepLock here). */
export function RevealComparison({
  estimateHours,
  actualHours,
  sawNativeReport = false,
  onShowDeviceReport,
}: {
  estimateHours: number
  actualHours: number | null
  /** iOS: user already viewed the native DeviceActivityReport sheet. */
  sawNativeReport?: boolean
  /** iOS: open DeviceActivityReport sheet when numeric export is unavailable. */
  onShowDeviceReport?: () => void
}) {
  const { t } = useTranslation()
  const fromDevice = actualHours != null
  const actual = actualHours
  const diff = fromDevice ? Math.abs(estimateHours - actual!) : 0
  const pct = fromDevice && estimateHours > 0 ? Math.round((diff / estimateHours) * 100) : 0
  const actualLower = fromDevice && actual! < estimateHours

  return (
    <div className="flex flex-col items-center text-center w-full">
      <div className="w-14 h-14 rounded-2xl bg-indigo-500/15 border border-indigo-500/20 flex items-center justify-center mb-6">
        <TrendingDown size={28} className="text-indigo-300" />
      </div>

      {fromDevice ? (
        <>
          <p className="text-4xl sm:text-5xl font-bold tabular-nums gradient-text mb-2 tracking-tight">
            {formatHoursMinutes(actual!)}
          </p>
          <p className="text-sm text-white/45 mb-2">
            {actualLower
              ? t('intro.revealActualLess', { pct })
              : t('intro.revealActualMore', { pct })}
          </p>
          <p className="text-xs text-white/30 mb-8">{t('intro.revealFromDevice')}</p>
        </>
      ) : sawNativeReport ? (
        <>
          <p className="text-4xl sm:text-5xl font-bold tabular-nums gradient-text mb-2 tracking-tight">
            ✓
          </p>
          <p className="text-sm text-white/45 mb-2">{t('intro.revealSawNative')}</p>
          <p className="text-xs text-white/30 mb-4">{t('intro.revealSawNativeHint')}</p>
          {onShowDeviceReport ? (
            <button
              type="button"
              onClick={onShowDeviceReport}
              className="mb-8 text-sm font-semibold text-indigo-300 underline underline-offset-4"
            >
              {t('intro.revealShowScreenTime')}
            </button>
          ) : (
            <div className="mb-8" />
          )}
        </>
      ) : (
        <>
          <p className="text-4xl sm:text-5xl font-bold tabular-nums text-white/25 mb-2 tracking-tight">
            —
          </p>
          <p className="text-sm text-white/45 mb-2">
            {onShowDeviceReport
              ? t('intro.revealActualUseReport')
              : t('intro.revealActualUnavailable')}
          </p>
          {onShowDeviceReport ? (
            <button
              type="button"
              onClick={onShowDeviceReport}
              className="mb-8 text-sm font-semibold text-indigo-300 underline underline-offset-4"
            >
              {t('intro.revealShowScreenTime')}
            </button>
          ) : (
            <p className="text-xs text-white/30 mb-8">{t('intro.revealEstimateOnly')}</p>
          )}
        </>
      )}

      <div className="grid grid-cols-2 gap-3 w-full max-w-xs">
        <div className="rounded-2xl bg-white/[0.03] border border-white/[0.07] p-4">
          <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-white/35 mb-2">
            {t('intro.revealYouThought')}
          </p>
          <p className="text-lg font-bold tabular-nums">{formatHoursMinutes(estimateHours)}</p>
        </div>
        <div
          className={cn(
            'rounded-2xl p-4 border',
            fromDevice
              ? 'bg-emerald-500/10 border-emerald-500/25'
              : sawNativeReport
                ? 'bg-indigo-500/10 border-indigo-500/25'
                : 'bg-white/[0.03] border-white/[0.07]'
          )}
        >
          <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-white/35 mb-2">
            {t('intro.revealActualLabel')}
          </p>
          <p
            className={cn(
              'text-lg font-bold tabular-nums',
              fromDevice
                ? 'text-emerald-400'
                : sawNativeReport
                  ? 'text-indigo-300'
                  : 'text-white/30'
            )}
          >
            {fromDevice
              ? formatHoursMinutes(actual!)
              : sawNativeReport
                ? t('intro.revealActualSeenShort')
                : t('intro.revealActualUnavailableShort')}
          </p>
        </div>
      </div>
    </div>
  )
}

/** Screen C: calculated With RepLock projection from guess and/or actual. */
export function PotentialBars({
  baselineHours,
  fromDevice = false,
}: {
  baselineHours: number
  fromDevice?: boolean
}) {
  const { t } = useTranslation()
  const projection = computeWithRepLockProjection(baselineHours)
  const without = projection.baselineHours
  const withApp = projection.withRepLockHours
  const max = Math.max(without, withApp, 0.5)
  const reductionPct = Math.round(REPLOCK_TARGET_REDUCTION * 100)

  return (
    <div className="space-y-6 w-full max-w-sm mx-auto">
      <div className="rounded-2xl bg-white/[0.03] border border-white/[0.07] px-5 py-5 text-center">
        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-white/40 mb-3">
          {t('intro.potentialScrollLabel')}
        </p>
        <p className="text-4xl font-bold tabular-nums gradient-text tracking-tight">
          {formatHoursMinutes(withApp)}
        </p>
        <p className="text-sm text-emerald-400/90 font-medium mt-2">
          {t('intro.potentialReduction', { pct: projection.reductionPct })}
        </p>
      </div>

      <div className="space-y-2">
        <BarRow label={t('intro.potentialNow')} value={without} max={max} variant="bad" />
        <BarRow label={t('intro.potentialWith')} value={withApp} max={max} variant="good" />
      </div>

      <div className="rounded-2xl bg-indigo-500/10 border border-indigo-500/20 p-4 space-y-2">
        <div className="flex items-center gap-2">
          <Sparkles size={14} className="text-indigo-300 shrink-0" />
          <p className="text-xs font-semibold text-indigo-200">{t('intro.potentialFormulaTitle')}</p>
        </div>
        <p className="text-[11px] text-white/45 leading-relaxed text-left">
          {t('intro.potentialFormula', {
            pct: reductionPct,
            minutes: projection.earnedAllowanceMinutes,
          })}
        </p>
        <p className="text-[11px] text-white/30 leading-relaxed text-left">
          {fromDevice ? t('intro.potentialBasedOnDevice') : t('intro.potentialBasedOnGuess')}
        </p>
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
      <div className="flex-1 h-11 rounded-xl bg-white/[0.03] border border-white/[0.07] overflow-hidden relative">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${Math.max(pct, 18)}%` }}
          transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
          className={cn(
            'absolute inset-y-0 left-0 rounded-xl flex items-center px-3 text-sm font-semibold',
            variant === 'bad' && 'bg-gradient-to-r from-rose-600/90 to-orange-500/80 text-white',
            variant === 'good' && 'bg-gradient-to-r from-indigo-500 to-violet-500 text-white'
          )}
        >
          {display}
        </motion.div>
      </div>
      <span className="text-xs text-white/40 w-[4.5rem] shrink-0 text-right leading-tight">{label}</span>
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
    <ul className="space-y-3.5 w-full max-w-sm mx-auto">
      {items.map((item, i) => (
        <motion.li
          key={item}
          initial={{ opacity: 0, x: -12 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: i * 0.06 }}
          className="flex items-start gap-3 rounded-2xl bg-white/[0.03] border border-white/[0.07] px-4 py-3.5"
        >
          <div className="w-6 h-6 rounded-full bg-emerald-500/20 flex items-center justify-center shrink-0 mt-0.5">
            <Check size={14} className="text-emerald-400" />
          </div>
          <span className="text-sm text-white/80 leading-snug text-left">{item}</span>
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
    <div className="flex flex-col items-center py-6">
      <button
        type="button"
        onPointerDown={startHold}
        onPointerUp={clear}
        onPointerLeave={clear}
        onPointerCancel={clear}
        className="relative w-24 h-24 rounded-[1.75rem] bg-gradient-to-br from-indigo-500 to-violet-600 shadow-2xl shadow-indigo-500/35 flex items-center justify-center select-none touch-none active:scale-[0.97] transition-transform"
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
      <p className="text-lg font-bold mt-6 tracking-tight">{t('intro.holdTitle')}</p>
      <p className="text-xs text-white/40 mt-2 text-center max-w-[220px]">{t('intro.holdHint')}</p>
    </div>
  )
}

const BLOCK_PREVIEWS = [
  { key: 'workout', bg: 'from-indigo-950 to-violet-950', icon: Dumbbell, accent: 'indigo' },
  { key: 'streak', bg: 'from-emerald-950 to-teal-950', icon: Sparkles, accent: 'emerald' },
  { key: 'focus', bg: 'from-slate-900 to-indigo-950', icon: Lock, accent: 'violet' },
] as const

export function BlockPreviewCarousel() {
  const { t } = useTranslation()
  const [index, setIndex] = useState(0)
  const preview = BLOCK_PREVIEWS[index]
  const Icon = preview.icon

  return (
    <div className="flex flex-col items-center">
      <div className="relative w-[220px] h-[380px] rounded-[2.5rem] bg-surface-3 border border-white/[0.1] shadow-2xl overflow-hidden">
        <div className="absolute top-3 left-1/2 -translate-x-1/2 w-20 h-6 bg-black rounded-full z-10" />
        <div
          className={cn(
            'absolute inset-2 top-8 rounded-[2rem] bg-gradient-to-b flex flex-col items-center justify-center p-5 text-center',
            preview.bg
          )}
        >
          <div className="w-14 h-14 rounded-2xl bg-white/10 border border-white/10 flex items-center justify-center mb-4">
            <Icon size={28} className="text-white" />
          </div>
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
            className={cn(
              'h-2 rounded-full transition-all',
              i === index ? 'bg-indigo-400 w-5' : 'bg-white/20 w-2'
            )}
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
      <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-indigo-300/70 mb-3">
        RepLock
      </p>
      <p className="text-sm text-white/55 mb-1">
        {formatHoursMinutes(stats.dailyHours)} {t('intro.yearsPerDay')}
      </p>
      <p className="text-xs text-white/30 mb-5">
        {fromDevice ? t('intro.yearsBasedOnDevice') : t('intro.yearsBasedOnEstimate')}
      </p>
      <p className="text-lg font-semibold text-white/80 mb-6 leading-snug">
        {t('intro.yearsTitle', { years: INSIGHT_HORIZON_YEARS })}
      </p>
      <p className="text-6xl sm:text-7xl font-bold gradient-text leading-none tabular-nums tracking-tight">
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
