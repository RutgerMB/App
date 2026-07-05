import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { Flame, Clock, ChevronRight, Sparkles, Dumbbell, Grid3X3 } from 'lucide-react'
import { AppShell } from '@/components/layout/AppShell'
import { MotionCard } from '@/components/ui/Card'
import { CircularProgress } from '@/components/ui/Progress'
import { TrialBanner } from '@/components/TrialBanner'
import { ProPromo } from '@/components/ProPromo'
import { DifficultyBadge } from '@/components/DifficultyPicker'
import { useStore } from '@/store'
import { ExerciseIcon } from '@/components/ExerciseIcons'
import { EXERCISES } from '@/types'
import { formatMinutes } from '@/lib/utils'
import { useTranslation } from '@/i18n/context'

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

  return (
    <AppShell>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-white/40 text-sm">{t('home.welcomeBack')}</p>
            <h1 className="text-2xl font-bold tracking-tight">{profile.name}</h1>
            <div className="mt-2">
              <DifficultyBadge difficulty={profile.difficulty ?? 'medium'} />
            </div>
          </div>
          {!profile.isPro && (
            <button
              onClick={() => navigate('/pricing')}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-xs font-medium hover:bg-indigo-500/20 transition-colors shrink-0"
            >
              <Sparkles size={12} />
              {t('common.upgrade')}
            </button>
          )}
        </div>

        <MotionCard className="p-5 gradient-border" glow>
          <div className="flex items-center justify-between gap-4">
            <div className="flex-1">
              <p className="text-white/40 text-xs uppercase tracking-wider font-medium mb-1">
                {t('home.availableScreenTime')}
              </p>
              <p className="text-4xl font-bold tracking-tight gradient-text">
                {formatMinutes(screenTimeBalance)}
              </p>
            </div>
            <CircularProgress value={Math.min(screenTimeBalance, 60)} max={60} size={68} strokeWidth={5}>
              <Clock size={16} className="text-white/30" />
            </CircularProgress>
          </div>
          <button
            onClick={() => navigate('/exercise')}
            className="mt-4 w-full flex items-center justify-center gap-2 h-11 rounded-xl bg-gradient-to-r from-indigo-500 to-violet-600 text-white font-medium text-sm hover:brightness-110 active:brightness-95 transition-all shadow-lg shadow-indigo-500/20"
          >
            <Dumbbell size={16} />
            {t('home.earnMore')}
            <ChevronRight size={16} />
          </button>
        </MotionCard>

        <div className="grid grid-cols-3 gap-2">
          <MotionCard className="p-3 text-center">
            <Flame size={14} className="mx-auto text-orange-400 mb-1" />
            <p className="text-lg font-bold leading-none">{currentStreak}</p>
            <p className="text-[10px] text-white/35 uppercase mt-1">{t('home.streak')}</p>
          </MotionCard>
          <MotionCard className="p-3 text-center">
            <Dumbbell size={14} className="mx-auto text-indigo-400 mb-1" />
            <p className="text-lg font-bold leading-none">{totalExercises}</p>
            <p className="text-[10px] text-white/35 uppercase mt-1">{t('home.workouts')}</p>
          </MotionCard>
          <button onClick={() => navigate('/apps')} className="text-left">
            <MotionCard hover className="p-3 text-center h-full">
              <Grid3X3 size={14} className="mx-auto text-violet-400 mb-1" />
              <p className="text-lg font-bold leading-none">{apps.length}</p>
              <p className="text-[10px] text-white/35 uppercase mt-1">{t('home.appsTracked')}</p>
            </MotionCard>
          </button>
        </div>

        <div className="space-y-2">
          <TrialBanner compact />
          <ProPromo variant="home" compact />
        </div>

        <button
          onClick={() => navigate('/exercise')}
          className="w-full flex items-center justify-between gap-3 py-3 px-4 rounded-2xl bg-surface-2 border border-border hover:border-indigo-500/25 hover:bg-surface-3 transition-colors"
        >
          <span className="flex items-center gap-2.5 text-sm text-white/70">
            <Dumbbell size={16} className="text-indigo-400 shrink-0" />
            {t('home.quickStart')}
          </span>
          <ChevronRight size={16} className="text-white/25 shrink-0" />
        </button>

        {recentSession && (
          <button onClick={() => navigate('/activity')} className="w-full text-left">
            <MotionCard hover className="p-3.5">
              <div className="flex items-center gap-3">
                <div className={`w-9 h-9 rounded-xl bg-gradient-to-br ${EXERCISES[recentSession.type].gradient} flex items-center justify-center text-white shrink-0`}>
                  <ExerciseIcon type={recentSession.type} size={16} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[10px] text-white/35 uppercase tracking-wider">{t('home.lastWorkout')}</p>
                  <p className="font-medium text-sm truncate">{t(`exercises.${recentSession.type}.name`)}</p>
                </div>
                <span className="text-sm font-semibold text-emerald-400 shrink-0">
                  +{formatMinutes(recentSession.earnedMinutes)}
                </span>
              </div>
            </MotionCard>
          </button>
        )}
      </motion.div>
    </AppShell>
  )
}
