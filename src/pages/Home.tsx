import { useState } from 'react'
import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { Flame, Clock, ChevronRight, Sparkles, Dumbbell, Grid3X3, Lock, Unlock } from 'lucide-react'
import { AppShell } from '@/components/layout/AppShell'
import { MotionCard } from '@/components/ui/Card'
import { MotionButton } from '@/components/ui/Button'
import { StatCard, StatGrid } from '@/components/ui/StatCard'
import { CircularProgress } from '@/components/ui/Progress'
import { ProPromo } from '@/components/ProPromo'
import { TrialBanner } from '@/components/TrialBanner'
import { AppBrandIcon } from '@/components/AppBrandIcon'
import { DifficultyHomeModal } from '@/components/DifficultyHomeModal'
import { DIFFICULTY_META } from '@/components/DifficultyPicker'
import { useStore } from '@/store'
import { ExerciseIcon } from '@/components/ExerciseIcons'
import { EXERCISES } from '@/types'
import { formatMinutes, cn } from '@/lib/utils'
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
  const lockedApps = apps.filter((a) => a.isLocked)
  const unlockedApps = apps.filter((a) => !a.isLocked)
  const progressMax = Math.max(60, screenTimeBalance, 1)
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
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
        <motion.header
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, ease: 'easeOut' }}
          className="relative pt-4 pb-2 text-center"
        >
          <div
            className="absolute -inset-x-6 -top-8 bottom-0 bg-gradient-to-b from-indigo-500/[0.14] via-violet-500/[0.05] to-transparent rounded-[2.5rem] pointer-events-none"
            aria-hidden
          />
          <div className="relative space-y-5">
            <div className="px-2">
              <p className="text-base sm:text-lg font-medium text-indigo-200/80 tracking-wide">
                {t('home.welcomeBack')}
              </p>
              <h1 className="text-[2.75rem] sm:text-[3.5rem] font-bold tracking-tight leading-[1.05] mt-2 bg-gradient-to-br from-white via-white to-white/70 bg-clip-text text-transparent">
                {profile.name}
              </h1>
            </div>

            <div className="flex justify-center px-2">
              <div className="inline-flex items-center p-1 rounded-2xl bg-white/[0.04] border border-white/10 backdrop-blur-sm shadow-[0_8px_32px_rgba(0,0,0,0.2)]">
                <button
                  type="button"
                  onClick={handleDifficultyPress}
                  className={cn(
                    'inline-flex items-center justify-center gap-2 h-10 px-4 sm:px-5 rounded-xl text-xs sm:text-sm font-semibold transition-all duration-200',
                    'text-white/85 hover:bg-white/[0.08] active:scale-[0.98]'
                  )}
                >
                  <span className="text-base leading-none" aria-hidden>
                    {difficultyMeta.icon}
                  </span>
                  <span className="hidden sm:inline text-white/45 font-medium">{t('settings.difficulty')}</span>
                  <span className="text-white/90">{t(`difficulty.${difficulty}.name`)}</span>
                </button>

                {!profile.isPro && (
                  <>
                    <div className="w-px h-6 bg-white/10 shrink-0" aria-hidden />
                    <button
                      type="button"
                      onClick={() => navigate('/pricing')}
                      className={cn(
                        'inline-flex items-center justify-center gap-1.5 h-10 px-4 sm:px-5 rounded-xl text-xs sm:text-sm font-semibold transition-all duration-200',
                        'text-indigo-300 hover:bg-indigo-500/15 active:scale-[0.98]'
                      )}
                    >
                      <Sparkles size={14} className="shrink-0" />
                      {t('common.upgrade')}
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        </motion.header>

        <MotionCard className="p-5 sm:p-6 gradient-border" glow>
          <div className="flex items-center justify-between gap-4">
            <div className="flex-1">
              <p className="text-white/40 text-xs uppercase tracking-wider font-medium mb-1.5">
                {t('home.availableScreenTime')}
              </p>
              <p className="text-4xl sm:text-5xl font-bold tracking-tight gradient-text tabular-nums">
                {formatMinutes(screenTimeBalance)}
              </p>
            </div>
            <CircularProgress value={screenTimeBalance} max={progressMax} size={72} strokeWidth={5}>
              <Clock size={18} className="text-white/30" />
            </CircularProgress>
          </div>
          <MotionButton
            fullWidth
            size="lg"
            className="mt-5 shadow-lg shadow-indigo-500/20"
            onClick={() => navigate('/exercise')}
          >
            <Dumbbell size={18} />
            {screenTimeBalance <= 0 ? t('home.earnFirst') : t('home.earnMore')}
            <ChevronRight size={18} />
          </MotionButton>
          {screenTimeBalance <= 0 && (
            <p className="mt-3 text-center text-xs text-white/40">{t('home.emptyBalanceHint')}</p>
          )}
        </MotionCard>

        {apps.length === 0 ? (
          <MotionCard
            className="p-5 cursor-pointer border-dashed border-white/15 hover:border-indigo-500/30 transition-colors"
            onClick={() => navigate('/apps')}
          >
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center shrink-0">
                <Grid3X3 size={22} className="text-white/40" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-sm text-white/80">{t('home.noAppsYet')}</p>
                <p className="text-xs text-indigo-400 mt-1 font-medium">{t('home.viewAllApps')} →</p>
              </div>
            </div>
          </MotionCard>
        ) : (
          <div>
            <div className="flex items-center justify-between mb-3 px-0.5">
              <p className="text-sm font-semibold text-white/70">{t('home.yourApps')}</p>
              <button
                type="button"
                onClick={() => navigate('/apps')}
                className="text-xs text-indigo-400 font-medium"
              >
                {t('home.viewAllApps')}
              </button>
            </div>
            <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1 scrollbar-none">
              {apps.slice(0, 6).map((app) => (
                <button
                  key={app.id}
                  type="button"
                  onClick={() => navigate('/apps')}
                  className="shrink-0 w-[88px] p-3 rounded-2xl bg-surface-2 border border-border text-center hover:border-indigo-500/30 transition-colors"
                >
                  <div className="w-10 h-10 mx-auto mb-2 rounded-xl bg-white/5 flex items-center justify-center overflow-hidden">
                    <AppBrandIcon brand={app.brand} name={app.name} color={app.color} size="sm" />
                  </div>
                  <p className="text-[10px] font-medium truncate text-white/70">{app.name}</p>
                  <p className={cn(
                    'text-[9px] mt-1 flex items-center justify-center gap-0.5',
                    app.isLocked ? 'text-amber-400/90' : 'text-emerald-400/90'
                  )}>
                    {app.isLocked ? <Lock size={9} /> : <Unlock size={9} />}
                    {app.isLocked ? t('home.locked') : t('home.unlocked')}
                  </p>
                </button>
              ))}
            </div>
            <p className="text-[11px] text-white/35 mt-2 px-0.5">
              {t('home.appsStatusSummary', { locked: lockedApps.length, unlocked: unlockedApps.length })}
            </p>
          </div>
        )}

        <ProPromo variant="home" compact />

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

        <TrialBanner compact />

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
