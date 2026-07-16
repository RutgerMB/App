import { useNavigate } from 'react-router-dom'
import { Calendar, Zap } from 'lucide-react'
import { Progress } from '@/components/ui/Progress'
import { useStore } from '@/store'
import { DEFAULT_DAILY_OPENINGS } from '@/types'
import { localDateString } from '@/lib/dates'
import { useTranslation } from '@/i18n/context'
import { cn } from '@/lib/utils'

export function QuickBlockCard() {
  const navigate = useNavigate()
  const { t } = useTranslation()

  return (
    <button
      type="button"
      onClick={() => navigate('/exercise')}
      className={cn(
        'w-full text-left rounded-2xl px-4 py-3.5',
        'bg-gradient-to-br from-indigo-500/15 to-violet-500/5 border border-indigo-500/20',
        'hover:border-indigo-500/35 hover:from-indigo-500/18 active:scale-[0.985] transition-all duration-200'
      )}
    >
      <div className="flex items-center gap-3.5">
        <div className="w-11 h-11 rounded-xl bg-indigo-500/20 flex items-center justify-center shrink-0">
          <Zap size={20} className="text-indigo-400" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-[15px] tracking-tight">{t('apps.quickBlockTitle')}</p>
          <p className="text-xs text-white/45 mt-0.5 leading-relaxed truncate">
            {t('apps.quickBlockDesc')}
          </p>
        </div>
        <span className="text-xs font-semibold text-indigo-300 shrink-0">
          {t('apps.quickBlockCta')} →
        </span>
      </div>
    </button>
  )
}

export function ActiveScheduleCard() {
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
        'rounded-2xl px-4 py-3.5',
        'bg-gradient-to-br from-violet-500/10 to-indigo-500/5 border border-violet-500/20'
      )}
    >
      <div className="flex items-start gap-3 mb-3">
        <div className="w-10 h-10 rounded-xl bg-violet-500/20 flex items-center justify-center shrink-0">
          <Calendar size={18} className="text-violet-400" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-[15px] font-semibold tracking-tight">{t('apps.activeScheduleTitle')}</p>
          <p className="text-xs text-white/45 mt-0.5 leading-relaxed">
            {t('onboarding.goalSchedule', { day: weekday, openings, minutes: minutesPerOpening })}
          </p>
        </div>
      </div>
      <div className="flex items-center justify-between text-xs text-white/40 mb-2">
        <span>{t('onboarding.goalProgress')}</span>
        <span className="tabular-nums">
          {progressOpenings}/{openings}
        </span>
      </div>
      <Progress value={progressOpenings} max={openings} size="sm" />
      <p className="text-[11px] text-white/30 mt-2">
        {apps.length} {t('apps.appsTrackedLabel')}
      </p>
    </div>
  )
}
