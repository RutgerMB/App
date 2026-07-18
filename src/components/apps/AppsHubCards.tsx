import { useNavigate } from 'react-router-dom'
import { Calendar, Zap } from 'lucide-react'
import { Progress } from '@/components/ui/Progress'
import { useStore } from '@/store'
import { DEFAULT_DAILY_OPENINGS } from '@/types'
import { localDateString } from '@/lib/dates'
import { useTranslation } from '@/i18n/context'
import { cn } from '@/lib/utils'

export function QuickBlockCard({ compact }: { compact?: boolean }) {
  const navigate = useNavigate()
  const { t } = useTranslation()

  return (
    <button
      type="button"
      onClick={() => navigate('/exercise')}
      className={cn(
        'w-full text-left rounded-2xl',
        'bg-gradient-to-br from-emerald-500/15 to-teal-500/5 border border-emerald-500/20',
        'hover:border-emerald-500/35 hover:from-emerald-500/18 active:scale-[0.985] transition-all duration-200',
        compact ? 'px-3.5 py-3 h-full' : 'px-4 py-3.5'
      )}
    >
      <div className={cn('flex items-center gap-3', compact && 'flex-col items-start gap-2')}>
        <div
          className={cn(
            'rounded-xl bg-emerald-500/20 flex items-center justify-center shrink-0',
            compact ? 'w-9 h-9' : 'w-11 h-11'
          )}
        >
          <Zap size={compact ? 16 : 20} className="text-emerald-400" />
        </div>
        <div className="flex-1 min-w-0 w-full">
          <p className={cn('font-semibold tracking-tight', compact ? 'text-sm' : 'text-[15px]')}>
            {t('apps.quickBlockTitle')}
          </p>
          {!compact && (
            <p className="text-xs text-white/45 mt-0.5 leading-relaxed truncate">
              {t('apps.quickBlockDesc')}
            </p>
          )}
        </div>
        {!compact && (
          <span className="text-xs font-semibold text-emerald-300 shrink-0">
            {t('apps.quickBlockCta')} →
          </span>
        )}
      </div>
    </button>
  )
}

export function ActiveScheduleCard({ compact }: { compact?: boolean }) {
  const { t } = useTranslation()
  const profile = useStore((s) => s.profile)
  const apps = useStore((s) => s.apps)

  const openings = profile.dailyOpenings ?? DEFAULT_DAILY_OPENINGS
  const minutesPerOpening = profile.minutesPerOpening ?? 5

  if (openings < 1 || apps.length === 0) return null

  const weekday = (() => {
    const day = new Date().getDay()
    const keys = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'] as const
    return t(`onboarding.weekdays.${keys[day]}`)
  })()

  const usedOpenings = (() => {
    const today = localDateString()
    if (profile.openingsDate !== today) return 0
    return profile.openingsUsedToday ?? 0
  })()
  const progressOpenings = Math.min(openings, usedOpenings)

  return (
    <div
      className={cn(
        'rounded-2xl',
        'bg-gradient-to-br from-teal-500/10 to-emerald-500/5 border border-teal-500/20',
        compact ? 'px-3.5 py-3 h-full' : 'px-4 py-3.5'
      )}
    >
      <div className={cn('flex items-center gap-3', compact ? 'mb-2' : 'mb-3 items-start')}>
        <div
          className={cn(
            'rounded-xl bg-teal-500/20 flex items-center justify-center shrink-0',
            compact ? 'w-9 h-9' : 'w-10 h-10'
          )}
        >
          <Calendar size={compact ? 16 : 18} className="text-teal-400" />
        </div>
        <div className="flex-1 min-w-0">
          <p className={cn('font-semibold tracking-tight', compact ? 'text-sm' : 'text-[15px]')}>
            {t('apps.activeScheduleTitle')}
          </p>
          <p className="text-[11px] text-white/40 mt-0.5 truncate">
            {compact
              ? t('apps.activeScheduleCompact', {
                  openings,
                  minutes: minutesPerOpening,
                })
              : t('onboarding.goalSchedule', {
                  day: weekday,
                  openings,
                  minutes: minutesPerOpening,
                })}
          </p>
        </div>
      </div>
      <div className="flex items-center justify-between text-[11px] text-white/40 mb-1.5">
        <span className="tabular-nums">
          {progressOpenings}/{openings}
        </span>
      </div>
      <Progress value={progressOpenings} max={openings} size="sm" />
    </div>
  )
}

/** Quick Block + Active Schedule on one compact row when schedule is visible. */
export function AppsHubRow() {
  const profile = useStore((s) => s.profile)
  const apps = useStore((s) => s.apps)
  const openings = profile.dailyOpenings ?? DEFAULT_DAILY_OPENINGS
  const showSchedule = openings >= 1 && apps.length > 0

  if (!showSchedule) {
    return <QuickBlockCard />
  }

  return (
    <div className="grid grid-cols-2 gap-2.5">
      <QuickBlockCard compact />
      <ActiveScheduleCard compact />
    </div>
  )
}
