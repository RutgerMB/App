import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { Flame, Clock, ChevronRight, Sparkles, Dumbbell, Lock, Grid3X3 } from 'lucide-react'
import { AppShell } from '@/components/layout/AppShell'
import { MotionCard } from '@/components/ui/Card'
import { CircularProgress } from '@/components/ui/Progress'
import { TrialBanner } from '@/components/TrialBanner'
import { ProPromo } from '@/components/ProPromo'
import { DifficultyBadge } from '@/components/DifficultyPicker'
import { useStore } from '@/store'
import { AppIcon } from '@/components/AppBrandIcon'
import { EXERCISES, QUICK_START_EXERCISES } from '@/types'
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

  const unlockedApps = apps.filter((a) => !a.isLocked)
  const lockedCount = apps.length - unlockedApps.length
  const recentSession = sessions[0]

  return (
    <AppShell>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
        <TrialBanner />
        <ProPromo variant="home" compact />

        {/* Header */}
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

        {/* Balance hero */}
        <MotionCard className="p-6 gradient-border" glow>
          <div className="flex items-center justify-between gap-4">
            <div className="flex-1">
              <p className="text-white/40 text-xs uppercase tracking-wider font-medium mb-1">
                {t('home.availableScreenTime')}
              </p>
              <p className="text-4xl font-bold tracking-tight gradient-text">
                {formatMinutes(screenTimeBalance)}
              </p>
            </div>
            <CircularProgress value={Math.min(screenTimeBalance, 60)} max={60} size={72} strokeWidth={5}>
              <Clock size={18} className="text-white/30" />
            </CircularProgress>
          </div>
          <button
            onClick={() => navigate('/exercise')}
            className="mt-5 w-full flex items-center justify-center gap-2 h-12 rounded-xl bg-gradient-to-r from-indigo-500 to-violet-600 text-white font-medium text-sm hover:brightness-110 active:brightness-95 transition-all shadow-lg shadow-indigo-500/20"
          >
            <Dumbbell size={16} />
            {t('home.earnMore')}
            <ChevronRight size={16} />
          </button>
        </MotionCard>

        {/* At-a-glance stats */}
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
          <MotionCard className="p-3 text-center">
            <Grid3X3 size={14} className="mx-auto text-violet-400 mb-1" />
            <p className="text-lg font-bold leading-none">{apps.length}</p>
            <p className="text-[10px] text-white/35 uppercase mt-1">{t('home.appsTracked')}</p>
          </MotionCard>
        </div>

        {/* Apps overview */}
        <section>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold text-white/60 uppercase tracking-wider">
              {t('home.yourApps')}
            </h2>
            <button
              onClick={() => navigate('/apps')}
              className="text-xs text-indigo-400 hover:text-indigo-300 transition-colors"
            >
              {t('common.manage')}
            </button>
          </div>
          <MotionCard className="p-4">
            {apps.length === 0 ? (
              <p className="text-sm text-white/40 text-center py-4">{t('home.noAppsYet')}</p>
            ) : (
              <>
                <div className="flex items-center gap-4 mb-4 text-xs">
                  <span className="flex items-center gap-1.5 text-emerald-400">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                    {unlockedApps.length} {t('home.unlocked')}
                  </span>
                  <span className="flex items-center gap-1.5 text-white/40">
                    <Lock size={10} />
                    {lockedCount} {t('home.locked')}
                  </span>
                </div>
                <div className="flex gap-3 overflow-x-auto pb-1 -mx-1 px-1">
                  {apps.map((app) => (
                    <button
                      key={app.id}
                      onClick={() => navigate('/apps')}
                      className="shrink-0 flex flex-col items-center gap-1.5 w-16"
                    >
                      <div className={app.isLocked ? 'opacity-50' : ''}>
                        <AppIcon
                          brand={app.brand}
                          name={app.name}
                          icon={app.icon}
                          color={app.color}
                          size="md"
                          grayscale={app.isLocked}
                        />
                      </div>
                      <span className="text-[10px] text-white/50 truncate w-full text-center">{app.name}</span>
                    </button>
                  ))}
                </div>
              </>
            )}
          </MotionCard>
        </section>

        {/* Quick start */}
        <section>
          <h2 className="text-sm font-semibold text-white/60 uppercase tracking-wider mb-3">
            {t('home.quickStart')}
          </h2>
          <div className="grid grid-cols-3 gap-2">
            {QUICK_START_EXERCISES.slice(0, 3).map((type) => {
              const ex = EXERCISES[type]
              return (
                <button
                  key={type}
                  onClick={() => navigate(`/exercise/session?type=${type}`)}
                  className="p-3 rounded-2xl bg-surface-2 border border-border hover:border-indigo-500/30 hover:bg-surface-3 transition-all text-center"
                >
                  <span className="text-xl block mb-1">{ex.icon}</span>
                  <span className="text-[11px] font-medium text-white/60 leading-tight">{t(`exercises.${type}.name`)}</span>
                </button>
              )
            })}
            <button
              onClick={() => navigate('/exercise')}
              className="p-3 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 hover:bg-indigo-500/15 transition-all text-center flex flex-col items-center justify-center"
            >
              <span className="text-xl mb-1">→</span>
              <span className="text-[11px] font-medium text-indigo-300">{t('home.viewAll')}</span>
            </button>
          </div>
        </section>

        {/* Last workout */}
        {recentSession && (
          <button onClick={() => navigate('/activity')} className="w-full text-left">
            <MotionCard hover className="p-4">
              <div className="flex items-center gap-3">
                <span className="text-2xl">{EXERCISES[recentSession.type].icon}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-[10px] text-white/35 uppercase tracking-wider mb-0.5">{t('home.lastWorkout')}</p>
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
