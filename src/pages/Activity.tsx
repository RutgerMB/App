import { motion } from 'framer-motion'
import { AppShell } from '@/components/layout/AppShell'
import { MotionCard } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Flame, Dumbbell } from 'lucide-react'
import { ActivityInsights } from '@/components/ActivityInsights'
import { ExerciseIcon } from '@/components/ExerciseIcons'
import { ProPromo } from '@/components/ProPromo'
import { useStore } from '@/store'
import { EXERCISES } from '@/types'
import { formatMinutes, formatDate } from '@/lib/utils'
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
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
        <div className="mb-6">
          <h1 className="text-2xl font-bold tracking-tight">{t('activity.title')}</h1>
          <p className="text-white/40 text-sm mt-1">{t('activity.subtitle')}</p>
        </div>

        <ActivityInsights />

        <ProPromo variant="activity" compact />

        <div className="grid grid-cols-3 gap-3 mb-8">
          <MotionCard className="p-4 text-center">
            <p className="text-2xl font-bold">{totalExercises}</p>
            <p className="text-[10px] text-white/40 uppercase tracking-wider mt-1">{t('activity.workouts')}</p>
          </MotionCard>
          <MotionCard className="p-4 text-center">
            <p className="text-2xl font-bold gradient-text">{formatMinutes(totalEarnedMinutes)}</p>
            <p className="text-[10px] text-white/40 uppercase tracking-wider mt-1">{t('activity.earned')}</p>
          </MotionCard>
          <MotionCard className="p-4 text-center">
            <p className="text-2xl font-bold">{longestStreak}</p>
            <p className="text-[10px] text-white/40 uppercase tracking-wider mt-1">{t('activity.bestStreak')}</p>
          </MotionCard>
        </div>

        {currentStreak > 0 && (
          <div className="mb-6 p-4 rounded-2xl bg-orange-500/5 border border-orange-500/15 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-orange-500/15 flex items-center justify-center shrink-0">
              <Flame size={20} className="text-orange-400" />
            </div>
            <div>
              <p className="font-semibold text-sm">{t('activity.dayStreak', { count: currentStreak })}</p>
              <p className="text-xs text-white/40">{t('activity.keepGoing')}</p>
            </div>
          </div>
        )}

        {sessions.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-14 h-14 mx-auto mb-4 rounded-2xl bg-indigo-500/10 flex items-center justify-center">
              <Dumbbell size={28} className="text-indigo-400" />
            </div>
            <p className="text-white/40">{t('activity.noWorkouts')}</p>
            <p className="text-white/25 text-sm mt-1">{t('activity.noWorkoutsDesc')}</p>
          </div>
        ) : (
          <div className="space-y-6">
            {Object.entries(grouped).map(([date, daySessions]) => (
              <div key={date}>
                <h3 className="text-xs font-semibold text-white/40 uppercase tracking-wider mb-3">
                  {date === new Date().toDateString() ? t('activity.today') : date}
                </h3>
                <div className="space-y-2">
                  {daySessions.map((session) => {
                    const ex = EXERCISES[session.type]
                    return (
                      <MotionCard key={session.id} className="p-4">
                        <div className="flex items-center gap-3">
                          <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${ex.gradient} flex items-center justify-center text-white`}>
                            <ExerciseIcon type={session.type} size={18} />
                          </div>
                          <div className="flex-1">
                            <p className="font-medium text-sm">{t(`exercises.${session.type}.name`)}</p>
                            <p className="text-xs text-white/40">
                              {session.amount}{' '}
                              {ex.unit === 'reps' ? t('common.reps') : t('common.seconds')} · {formatDate(session.completedAt)}
                            </p>
                          </div>
                          <Badge variant="success">+{formatMinutes(session.earnedMinutes)}</Badge>
                        </div>
                      </MotionCard>
                    )
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </motion.div>
    </AppShell>
  )
}
