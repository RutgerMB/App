import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Dumbbell, Calendar, Zap, Sunrise, Trophy } from 'lucide-react'
import { MotionCard } from '@/components/ui/Card'
import { Progress } from '@/components/ui/Progress'
import { useStore } from '@/store'
import { DEFAULT_DAILY_OPENINGS } from '@/types'
import { localDateString } from '@/lib/dates'
import { useTranslation } from '@/i18n/context'
import { useToast } from '@/components/ui/Toast'
import { cn } from '@/lib/utils'

const TEMPLATES = [
  { id: 'gym_focus', icon: Dumbbell, gradient: 'from-indigo-500/20 to-violet-500/10', iconColor: 'text-indigo-400' },
  { id: 'morning_workout', icon: Sunrise, gradient: 'from-amber-500/20 to-orange-500/10', iconColor: 'text-amber-400' },
  { id: 'earn_scroll', icon: Trophy, gradient: 'from-emerald-500/20 to-teal-500/10', iconColor: 'text-emerald-400' },
] as const

export function QuickBlockCard() {
  const navigate = useNavigate()
  const { t } = useTranslation()

  return (
    <MotionCard
      className="p-4 cursor-pointer border-indigo-500/25 bg-gradient-to-br from-indigo-500/15 to-violet-500/5"
      onClick={() => navigate('/exercise')}
    >
      <div className="flex items-center gap-4">
        <div className="w-12 h-12 rounded-2xl bg-indigo-500/20 flex items-center justify-center shrink-0">
          <Zap size={22} className="text-indigo-400" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-sm">{t('apps.quickBlockTitle')}</p>
          <p className="text-xs text-white/45 mt-0.5 leading-relaxed">{t('apps.quickBlockDesc')}</p>
        </div>
        <span className="text-xs font-semibold text-indigo-300 shrink-0">{t('apps.quickBlockCta')} →</span>
      </div>
    </MotionCard>
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
    <MotionCard className="p-4 border-violet-500/20 bg-gradient-to-br from-violet-500/10 to-indigo-500/5">
      <div className="flex items-start gap-3 mb-3">
        <div className="w-10 h-10 rounded-xl bg-violet-500/20 flex items-center justify-center shrink-0">
          <Calendar size={18} className="text-violet-400" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold">{t('apps.activeScheduleTitle')}</p>
          <p className="text-xs text-white/45 mt-0.5">
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
    </MotionCard>
  )
}

export function TemplatesSection() {
  const { t } = useTranslation()
  const { toast } = useToast()

  return (
    <div>
      <h3 className="text-sm font-semibold text-white/70 mb-3">{t('apps.templatesTitle')}</h3>
      <div className="grid gap-3">
        {TEMPLATES.map((tmpl, i) => {
          const Icon = tmpl.icon
          return (
            <motion.button
              key={tmpl.id}
              type="button"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              onClick={() => toast(t('apps.templateComingSoon'), 'info')}
              className={cn(
                'w-full text-left p-4 rounded-2xl border border-border bg-gradient-to-br transition-colors hover:border-border-hover',
                tmpl.gradient
              )}
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-surface-3/80 flex items-center justify-center shrink-0">
                  <Icon size={18} className={tmpl.iconColor} />
                </div>
                <div>
                  <p className="text-sm font-semibold">{t(`apps.templates.${tmpl.id}.title`)}</p>
                  <p className="text-xs text-white/45 mt-0.5">{t(`apps.templates.${tmpl.id}.desc`)}</p>
                </div>
              </div>
            </motion.button>
          )
        })}
      </div>
    </div>
  )
}
