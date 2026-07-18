import { useEffect, useMemo, useState } from 'react'
import { useTranslation } from '@/i18n/context'
import { cn } from '@/lib/utils'
import {
  combineMaxDailyHours,
  splitMaxDailyHours,
} from '@/lib/daily-earn-cap'
import { digitsOnly } from '@/lib/numeric-input'

/** Hours + minutes entry for max daily earn cap (total capped at 12h). */
export function MaxDailyHoursInput({
  value,
  onChange,
}: {
  value: number
  onChange: (v: number) => void
}) {
  const { t } = useTranslation()
  const split = useMemo(() => splitMaxDailyHours(value), [value])
  const [hoursDraft, setHoursDraft] = useState(String(split.hours))
  const [minsDraft, setMinsDraft] = useState(String(split.minutes))

  useEffect(() => {
    setHoursDraft(String(split.hours))
    setMinsDraft(String(split.minutes))
  }, [split.hours, split.minutes])

  const commit = (hRaw: string, mRaw: string) => {
    const hDigits = digitsOnly(hRaw, 2)
    const mDigits = digitsOnly(mRaw, 2)
    const h = hDigits ? Number.parseInt(hDigits, 10) : 0
    let m = mDigits ? Number.parseInt(mDigits, 10) : 0
    if (m > 59) m = 59
    const next = combineMaxDailyHours(h, m)
    onChange(next)
    const committed = splitMaxDailyHours(next)
    setHoursDraft(String(committed.hours))
    setMinsDraft(String(committed.minutes))
  }

  return (
    <div className="flex flex-col items-center w-full max-w-sm mx-auto">
      <div className="rounded-2xl bg-white/[0.03] border border-white/[0.07] px-6 py-6 mb-6 w-full text-center">
        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-white/40 mb-3">
          {t('onboarding.maxDailyHoursLabel')}
        </p>
        <div className="flex items-end justify-center gap-3">
          <div className="flex items-end gap-1">
            <input
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              autoComplete="off"
              value={hoursDraft}
              onChange={(e) => setHoursDraft(digitsOnly(e.target.value, 2))}
              onBlur={() => commit(hoursDraft, minsDraft)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault()
                  commit(hoursDraft, minsDraft)
                }
              }}
              aria-label={t('onboarding.maxDailyHoursHoursAria')}
              className="w-16 bg-transparent text-center text-5xl font-bold gradient-text tabular-nums tracking-tight outline-none border-b border-emerald-500/30 focus:border-emerald-400/60 pb-1"
            />
            <span className="text-2xl font-semibold text-white/50 mb-2">h</span>
          </div>
          <div className="flex items-end gap-1">
            <input
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              autoComplete="off"
              value={minsDraft}
              onChange={(e) => setMinsDraft(digitsOnly(e.target.value, 2))}
              onBlur={() => commit(hoursDraft, minsDraft)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault()
                  commit(hoursDraft, minsDraft)
                }
              }}
              aria-label={t('onboarding.maxDailyHoursMinutesAria')}
              className="w-16 bg-transparent text-center text-5xl font-bold gradient-text tabular-nums tracking-tight outline-none border-b border-emerald-500/30 focus:border-emerald-400/60 pb-1"
            />
            <span className="text-2xl font-semibold text-white/50 mb-2">m</span>
          </div>
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
              Math.abs(value - h) < 0.001
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
