import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { AppShell } from '@/components/layout/AppShell'
import { PageHeader } from '@/components/layout/PageHeader'
import { Flame } from 'lucide-react'
import { ActivityInsights } from '@/components/ActivityInsights'
import { ActivityCalendar } from '@/components/ActivityCalendar'
import { ProPromo } from '@/components/ProPromo'
import { MotionButton } from '@/components/ui/Button'
import { useStore } from '@/store'
import { formatMinutes, cn } from '@/lib/utils'
import { useTranslation } from '@/i18n/context'
import { openUpgradeOrFallback } from '@/lib/replock-revenuecat-native'
import { useToast } from '@/components/ui/Toast'
import { STREAK_RESET_TOKENS_MAX } from '@/lib/streak-tokens'

export function ActivityPage() {
  const navigate = useNavigate()
  const { toast } = useToast()
  const {
    totalEarnedMinutes,
    totalExercises,
    currentStreak,
    longestStreak,
    lastLostStreak,
    profile,
    restoreLostStreak,
    ensureStreakTokensRefilled,
  } = useStore()
  const { t } = useTranslation()

  const showRestore = currentStreak === 0 && lastLostStreak > 1
  const tokensLeft = profile.streakResetTokens ?? 0

  const handleRestore = () => {
    if (!profile.isPro) {
      void openUpgradeOrFallback(() => navigate('/pricing'))
      return
    }
    const lost = lastLostStreak
    ensureStreakTokensRefilled()
    const ok = restoreLostStreak()
    if (ok) {
      toast(t('activity.streakRestored', { count: lost }), 'success')
    } else {
      toast(t('activity.streakRestoreNoTokens'), 'error')
    }
  }

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
            className="rounded-2xl px-4 py-3.5 bg-orange-500/[0.06] border border-orange-500/15 flex flex-col items-center text-center gap-1.5"
          >
            <div className="w-11 h-11 rounded-xl bg-orange-500/15 flex items-center justify-center">
              <Flame size={20} className="text-orange-400" />
            </div>
            <p className="font-semibold text-[15px] tracking-tight">
              {t('activity.dayStreak', { count: currentStreak })}
            </p>
            <p className="text-xs text-white/45">{t('activity.keepGoing')}</p>
          </motion.div>
        )}

        {showRestore && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-2xl px-4 py-4 bg-orange-500/[0.06] border border-orange-500/15 flex flex-col items-center text-center gap-3"
          >
            <div className="w-11 h-11 rounded-xl bg-orange-500/15 flex items-center justify-center">
              <Flame size={20} className="text-orange-400" />
            </div>
            <div>
              <p className="font-semibold text-[15px] tracking-tight">
                {t('activity.streakLost', { count: lastLostStreak })}
              </p>
              {profile.isPro && (
                <p className="text-xs text-white/45 mt-1">
                  {t('activity.streakTokensLeft', {
                    count: tokensLeft,
                    max: STREAK_RESET_TOKENS_MAX,
                  })}
                </p>
              )}
            </div>
            <MotionButton
              size="sm"
              onClick={handleRestore}
              disabled={profile.isPro && tokensLeft < 1}
            >
              {profile.isPro ? t('activity.streakRestoreCta') : t('activity.streakRestoreProCta')}
            </MotionButton>
          </motion.div>
        )}

        <ActivityInsights />

        <div className="pt-1">
          <ProPromo variant="activity" compact />
        </div>

        <ActivityCalendar />
      </motion.div>
    </AppShell>
  )
}
