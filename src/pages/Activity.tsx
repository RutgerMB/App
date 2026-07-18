import { motion } from 'framer-motion'
import { AppShell } from '@/components/layout/AppShell'
import { PageHeader } from '@/components/layout/PageHeader'
import { Badge } from '@/components/ui/Badge'
import { Flame, Dumbbell } from 'lucide-react'
import { ActivityInsights } from '@/components/ActivityInsights'
import { ExerciseIcon } from '@/components/ExerciseIcons'
import { ProPromo } from '@/components/ProPromo'
import { useStore } from '@/store'
import { EXERCISES } from '@/types'
import { formatMinutes, formatDate, cn } from '@/lib/utils'
import { useTranslation } from '@/i18n/context'

export function ActivityPage() {
  const { sessions, totalEarnedMinutes, totalExercises, currentStreak, longestStreak } = useStore()
  const { t } = useTranslation()

  const grouped = sessions.reduce<Record<string, typeof sessions>>((acc, s) => {
    const date = new Date(s.completedAt).toDateString()
    if (!acc[date]) acc[date] = []
    acc[date].push(s)
    return acc
  }, {})

  return (
    <AppShell>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="space-y-8 max-w-lg mx-auto w-full"
      >
        <PageHeader centered title={t('activity.title')} subtitle={t('activity.subtitle')} />

        <section>
          <div className="grid grid-cols-3 gap-2.5">
            {[
              { value: totalExercises, label: t('activity.workouts') },
              {
                value: formatMinutes(totalEarnedMinutes),
                label: t('activity.earned'),
                highlight: true,
              },
              { value: longestStreak, label: t('activity.bestStreak') },
            ].map((stat) => (
              <div
                key={stat.label}
                className="rounded-2xl px-2 py-4 text-center bg-white/[0.03] border border-white/[0.07]"
              >
                <p
                  className={cn(
                    'text-xl font-bold leading-none tabular-nums',
                    stat.highlight && 'gradient-text'
                  )}
                >
                  {stat.value}
                </p>
                <p className="text-[10px] text-white/40 uppercase tracking-wider mt-1.5">
                  {stat.label}
                </p>
              </div>
            ))}
          </div>
        </section>

        {currentStreak > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-2xl px-4 py-3.5 bg-orange-500/[0.06] border border-orange-500/15 flex items-center gap-3.5"
          >
            <div className="w-11 h-11 rounded-xl bg-orange-500/15 flex items-center justify-center shrink-0">
              <Flame size={20} className="text-orange-400" />
            </div>
            <div className="min-w-0">
              <p className="font-semibold text-[15px] tracking-tight">
                {t('activity.dayStreak', { count: currentStreak })}
              </p>
              <p className="text-xs text-white/45 mt-0.5">{t('activity.keepGoing')}</p>
            </div>
          </motion.div>
        )}

        <ActivityInsights />

        <div className="pt-1">
          <ProPromo variant="activity" compact />
        </div>

        <section>
          <div className="text-center mb-4">
            <h2 className="text-[11px] font-semibold uppercase tracking-[0.18em] text-white/45">
              {t('activity.workouts')}
            </h2>
            <div className="mx-auto mt-3 h-px w-10 bg-gradient-to-r from-transparent via-emerald-400/40 to-transparent" />
          </div>

          {sessions.length === 0 ? (
            <div className="text-center py-14">
              <div className="w-14 h-14 mx-auto mb-4 rounded-2xl bg-emerald-500/10 flex items-center justify-center">
                <Dumbbell size={28} className="text-emerald-400" />
              </div>
              <p className="text-white/40">{t('activity.noWorkouts')}</p>
              <p className="text-white/25 text-sm mt-1">{t('activity.noWorkoutsDesc')}</p>
            </div>
          ) : (
            <div className="space-y-6">
              {Object.entries(grouped).map(([date, daySessions]) => (
                <div key={date}>
                  <h3 className="text-[11px] font-semibold uppercase tracking-[0.18em] text-white/40 mb-3 text-center">
                    {date === new Date().toDateString()
                      ? t('activity.today')
                      : formatDate(daySessions[0].completedAt)}
                  </h3>
                  <div className="space-y-2">
                    {daySessions.map((session, i) => {
                      const ex = EXERCISES[session.type]
                      return (
                        <motion.div
                          key={session.id}
                          initial={{ opacity: 0, y: 8 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: i * 0.03 }}
                          className={cn(
                            'rounded-2xl px-4 py-3.5',
                            'bg-white/[0.03] border border-white/[0.07]'
                          )}
                        >
                          <div className="flex items-center gap-3.5">
                            <div
                              className={cn(
                                'w-11 h-11 rounded-xl bg-gradient-to-br flex items-center justify-center text-white shrink-0 shadow-lg shadow-black/30',
                                ex.gradient
                              )}
                            >
                              <ExerciseIcon type={session.type} size={18} />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="font-semibold text-[15px] tracking-tight truncate">
                                {t(`exercises.${session.type}.name`)}
                              </p>
                              <p className="text-xs text-white/40 mt-0.5 truncate">
                                {session.amount}{' '}
                                {ex.unit === 'reps' ? t('common.reps') : t('common.seconds')} ·{' '}
                                {formatDate(session.completedAt)}
                              </p>
                            </div>
                            <Badge variant="success">
                              +{formatMinutes(session.earnedMinutes)}
                            </Badge>
                          </div>
                        </motion.div>
                      )
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </motion.div>
    </AppShell>
  )
}
