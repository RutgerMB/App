import { useState } from 'react'
import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { Flame, Clock, ChevronRight, Sparkles, Dumbbell, Grid3X3 } from 'lucide-react'
import { AppShell } from '@/components/layout/AppShell'
import { MotionCard } from '@/components/ui/Card'
import { MotionButton } from '@/components/ui/Button'
import { HeaderChip } from '@/components/ui/HeaderChip'
import { StatCard, StatGrid } from '@/components/ui/StatCard'
import { QuickLink } from '@/components/ui/QuickLink'
import { CircularProgress } from '@/components/ui/Progress'
import { TrialBanner } from '@/components/TrialBanner'
import { ProPromo } from '@/components/ProPromo'
import { DifficultyHomeModal } from '@/components/DifficultyHomeModal'
import { DIFFICULTY_META } from '@/components/DifficultyPicker'
import { useStore } from '@/store'
import { ExerciseIcon } from '@/components/ExerciseIcons'
import { EXERCISES } from '@/types'
import { formatMinutes } from '@/lib/utils'
import { useTranslation } from '@/i18n/context'
import type { Difficulty } from '@/types'

export function HomePage() {
  const navigate = useNavigate()
  const { t } = useTranslation()
  const {
    profile,
    screenTimeBalance,
    currentStreak,
    totalExercises,
    apps,
    sessions,
  } = useStore()

  const recentSession = sessions[0]
  const difficulty = profile.difficulty ?? 'medium'
  const difficultyMeta = DIFFICULTY_META[difficulty as Difficulty]
  const [difficultyOpen, setDifficultyOpen] = useState(false)

  const handleDifficultyPress = () => {
    if (!profile.isPro) {
      navigate('/pricing')
      return
    }
    setDifficultyOpen(true)
  }

  return (
    <AppShell>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-5">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <p className="text-sm text-white/45 font-medium uppercase tracking-wider">
              {t('home.welcomeBack')}
            </p>
            <h1 className="text-3xl sm:text-4xl font-bold tracking-tight leading-tight mt-1">
              {profile.name}
            </h1>
          </div>
          <div className="flex flex-col items-end gap-2 shrink-0">
            <HeaderChip variant="neutral" onClick={handleDifficultyPress}>
              <span aria-hidden>{difficultyMeta.icon}</span>
              <span className="truncate">{t(`difficulty.${difficulty}.name`)}</span>
            </HeaderChip>
            {!profile.isPro && (
              <HeaderChip variant="accent" onClick={() => navigate('/pricing')}>
                <Sparkles size={13} className="shrink-0" />
                <span>{t('common.upgrade')}</span>
              </HeaderChip>
            )}
          </div>
        </div>

        <MotionCard className="p-5 gradient-border" glow>
          <div className="flex items-center justify-between gap-4">
            <div className="flex-1">
              <p className="text-white/40 text-xs uppercase tracking-wider font-medium mb-1">
                {t('home.availableScreenTime')}
              </p>
              <p className="text-4xl font-bold tracking-tight gradient-text tabular-nums">
                {formatMinutes(screenTimeBalance)}
              </p>
            </div>
            <CircularProgress value={Math.min(screenTimeBalance, 60)} max={60} size={68} strokeWidth={5}>
              <Clock size={16} className="text-white/30" />
            </CircularProgress>
          </div>
          <MotionButton
            fullWidth
            size="lg"
            className="mt-4 shadow-lg shadow-indigo-500/20"
            onClick={() => navigate('/exercise')}
          >
            <Dumbbell size={16} />
            {t('home.earnMore')}
            <ChevronRight size={16} />
          </MotionButton>
        </MotionCard>

        <StatGrid>
          <StatCard
            icon={Flame}
            iconClassName="text-orange-400"
            value={currentStreak}
            label={t('home.streak')}
          />
          <StatCard
            icon={Dumbbell}
            iconClassName="text-indigo-400"
            value={totalExercises}
            label={t('home.workouts')}
          />
          <StatCard
            icon={Grid3X3}
            iconClassName="text-violet-400"
            value={apps.length}
            label={t('home.appsTracked')}
            onClick={() => navigate('/apps')}
          />
        </StatGrid>

        <div className="space-y-3">
          <TrialBanner compact />
          <ProPromo variant="home" compact />
        </div>

        <QuickLink
          icon={<Dumbbell size={16} className="text-indigo-400 shrink-0" />}
          label={t('home.quickStart')}
          onClick={() => navigate('/exercise')}
        />

        {recentSession && (
          <button type="button" onClick={() => navigate('/activity')} className="w-full text-left">
            <MotionCard hover className="p-4">
              <div className="flex items-center gap-3">
                <div
                  className={`w-10 h-10 rounded-xl bg-gradient-to-br ${EXERCISES[recentSession.type].gradient} flex items-center justify-center text-white shrink-0`}
                >
                  <ExerciseIcon type={recentSession.type} size={18} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[10px] text-white/40 uppercase tracking-wider">{t('home.lastWorkout')}</p>
                  <p className="font-medium text-sm truncate">{t(`exercises.${recentSession.type}.name`)}</p>
                </div>
                <span className="text-sm font-semibold text-emerald-400 shrink-0 tabular-nums">
                  +{formatMinutes(recentSession.earnedMinutes)}
                </span>
              </div>
            </MotionCard>
          </button>
        )}
      </motion.div>

      <DifficultyHomeModal open={difficultyOpen} onClose={() => setDifficultyOpen(false)} />
    </AppShell>
  )
}
