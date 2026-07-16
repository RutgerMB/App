import { useState } from 'react'
import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import {
  Flame, Clock, ChevronRight, Sparkles, Dumbbell, Grid3X3, Lock, Unlock,
} from 'lucide-react'
import { AppShell } from '@/components/layout/AppShell'
import { SectionLabel } from '@/components/layout/PageHeader'
import { MotionButton } from '@/components/ui/Button'
import { CircularProgress } from '@/components/ui/Progress'
import { TrialBanner } from '@/components/TrialBanner'
import { DifficultyHomeModal } from '@/components/DifficultyHomeModal'
import { DIFFICULTY_META } from '@/components/DifficultyPicker'
import { ProPromo } from '@/components/ProPromo'
import { useStore } from '@/store'
import { ExerciseIcon } from '@/components/ExerciseIcons'
import { EXERCISES } from '@/types'
import { formatMinutes, cn } from '@/lib/utils'
import { useTranslation } from '@/i18n/context'
import type { Difficulty } from '@/types'
import { openUpgradeOrFallback } from '@/lib/replock-revenuecat-native'

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
      void openUpgradeOrFallback(() => navigate('/pricing'))
      return
    }
    setDifficultyOpen(true)
  }

  return (
    <AppShell>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="space-y-9 max-w-lg mx-auto w-full"
      >
        <header className="relative text-center pt-3 pb-1">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, ease: 'easeOut' }}
            className="relative"
          >
            <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-indigo-300/70 mb-2">
              RepLock
            </p>
            <p className="text-sm text-white/45 mb-1">{t('home.welcomeBack')}</p>
            <h1 className="text-[2.35rem] font-bold tracking-tight leading-none truncate max-w-full px-2">
              {profile.name}
            </h1>

            <div className="mt-5 flex justify-center">
              <div className="inline-flex items-center p-1 rounded-2xl bg-white/[0.03] border border-white/[0.07]">
                <button
                  type="button"
                  onClick={handleDifficultyPress}
                  className={cn(
                    'inline-flex items-center justify-center gap-2 h-10 px-4 rounded-xl text-xs font-semibold transition-all duration-200',
                    'text-white/85 hover:bg-white/[0.06] active:scale-[0.98]'
                  )}
                >
                  <span className="text-base leading-none" aria-hidden>
                    {difficultyMeta.icon}
                  </span>
                  <span className="text-white/90">{t(`difficulty.${difficulty}.name`)}</span>
                </button>

                {!profile.isPro && (
                  <>
                    <div className="w-px h-6 bg-white/10 shrink-0" aria-hidden />
                    <button
                      type="button"
                      onClick={() => {
                        void openUpgradeOrFallback(() => navigate('/pricing'))
                      }}
                      className={cn(
                        'inline-flex items-center justify-center gap-1.5 h-10 px-4 rounded-xl text-xs font-semibold transition-all duration-200',
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
          </motion.div>
        </header>

        <section>
          <div
            className={cn(
              'rounded-2xl px-5 py-6 text-center',
              'bg-white/[0.03] border border-white/[0.07]'
            )}
          >
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-white/40 mb-4">
              {t('home.availableScreenTime')}
            </p>
            <div className="flex flex-col items-center gap-4">
              <CircularProgress value={screenTimeBalance} max={progressMax} size={88} strokeWidth={5}>
                <Clock size={20} className="text-white/30" />
              </CircularProgress>
              <p className="text-4xl font-bold tracking-tight tabular-nums gradient-text">
                {formatMinutes(screenTimeBalance)}
              </p>
            </div>
            <MotionButton
              fullWidth
              size="lg"
              className="mt-6 shadow-lg shadow-indigo-500/20"
              onClick={() => navigate('/exercise')}
            >
              <Dumbbell size={18} />
              {screenTimeBalance <= 0 ? t('home.earnFirst') : t('home.earnMore')}
              <ChevronRight size={18} />
            </MotionButton>
            {screenTimeBalance <= 0 && (
              <p className="mt-3 text-center text-xs text-white/40">{t('home.emptyBalanceHint')}</p>
            )}
          </div>
        </section>

        <section>
          <div className="flex items-center justify-between gap-3 mb-4 px-0.5">
            <h2 className="text-[11px] font-semibold uppercase tracking-[0.18em] text-white/45">
              {t('home.yourApps')}
            </h2>
            <button
              type="button"
              onClick={() => navigate('/apps')}
              className="text-[11px] font-semibold uppercase tracking-wider text-indigo-400/90"
            >
              {t('home.viewAllApps')}
            </button>
          </div>

          {apps.length === 0 ? (
            <button
              type="button"
              onClick={() => navigate('/apps')}
              className={cn(
                'w-full rounded-2xl px-4 py-5 text-center',
                'bg-white/[0.03] border border-dashed border-white/[0.12]',
                'hover:bg-white/[0.05] hover:border-white/[0.18] transition-all duration-200'
              )}
            >
              <div className="w-12 h-12 mx-auto mb-3 rounded-2xl bg-violet-500/10 flex items-center justify-center">
                <Grid3X3 size={22} className="text-violet-400" />
              </div>
              <p className="font-semibold text-sm text-white/80">{t('home.noAppsYet')}</p>
              <p className="text-xs text-indigo-400 mt-1.5 font-medium">{t('home.viewAllApps')} →</p>
            </button>
          ) : (
            <>
              <div className="space-y-2">
                {apps.slice(0, 6).map((app, i) => (
                  <motion.button
                    key={app.id}
                    type="button"
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.04, duration: 0.35 }}
                    onClick={() => navigate('/apps')}
                    className={cn(
                      'w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-left',
                      'bg-white/[0.03] border border-white/[0.07]',
                      'hover:bg-white/[0.055] hover:border-white/[0.12]',
                      'active:scale-[0.99] transition-all duration-200'
                    )}
                  >
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate text-white/85">{app.name}</p>
                    </div>
                    <span
                      className={cn(
                        'text-[10px] flex items-center gap-1 shrink-0',
                        app.isLocked ? 'text-amber-400/90' : 'text-emerald-400/90'
                      )}
                    >
                      {app.isLocked ? <Lock size={11} /> : <Unlock size={11} />}
                      {app.isLocked ? t('home.locked') : t('home.unlocked')}
                    </span>
                  </motion.button>
                ))}
              </div>
              <p className="text-[11px] text-white/35 mt-3 text-center">
                {t('home.appsStatusSummary', {
                  locked: lockedApps.length,
                  unlocked: unlockedApps.length,
                })}
              </p>
            </>
          )}
        </section>

        <section>
          <div className="grid grid-cols-3 gap-2.5">
            {[
              {
                icon: Flame,
                iconClass: 'text-orange-400',
                value: currentStreak,
                label: t('home.streak'),
              },
              {
                icon: Dumbbell,
                iconClass: 'text-indigo-400',
                value: totalExercises,
                label: t('home.workouts'),
              },
              {
                icon: Grid3X3,
                iconClass: 'text-violet-400',
                value: apps.length,
                label: t('home.appsTracked'),
                onClick: () => navigate('/apps'),
              },
            ].map((stat) => {
              const Icon = stat.icon
              const inner = (
                <div
                  className={cn(
                    'h-full rounded-2xl px-2 py-4 text-center',
                    'bg-white/[0.03] border border-white/[0.07]',
                    stat.onClick && 'hover:bg-white/[0.055] hover:border-white/[0.12] transition-all'
                  )}
                >
                  <Icon size={15} className={cn('mx-auto mb-2', stat.iconClass)} />
                  <p className="text-xl font-bold leading-none tabular-nums">{stat.value}</p>
                  <p className="text-[10px] text-white/40 uppercase tracking-wider mt-1.5">
                    {stat.label}
                  </p>
                </div>
              )
              return stat.onClick ? (
                <button key={stat.label} type="button" onClick={stat.onClick} className="w-full">
                  {inner}
                </button>
              ) : (
                <div key={stat.label}>{inner}</div>
              )
            })}
          </div>
        </section>

        <TrialBanner compact />

        {recentSession && (
          <section>
            <SectionLabel>{t('home.lastWorkout')}</SectionLabel>
            <button
              type="button"
              onClick={() => navigate('/activity')}
              className={cn(
                'group w-full text-left rounded-2xl px-4 py-3.5',
                'bg-white/[0.03] border border-white/[0.07]',
                'hover:bg-white/[0.055] hover:border-white/[0.12]',
                'active:scale-[0.985] transition-all duration-200'
              )}
            >
              <div className="flex items-center gap-3.5">
                <div
                  className={cn(
                    'w-11 h-11 rounded-xl bg-gradient-to-br flex items-center justify-center text-white shrink-0 shadow-lg shadow-black/30',
                    EXERCISES[recentSession.type].gradient
                  )}
                >
                  <ExerciseIcon type={recentSession.type} size={20} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-[15px] tracking-tight truncate">
                    {t(`exercises.${recentSession.type}.name`)}
                  </p>
                  <p className="text-xs text-white/40 mt-0.5">{t('home.lastWorkout')}</p>
                </div>
                <span className="text-sm font-semibold text-emerald-400 shrink-0 tabular-nums">
                  +{formatMinutes(recentSession.earnedMinutes)}
                </span>
                <ChevronRight
                  size={16}
                  className="text-white/20 group-hover:text-white/40 transition-colors shrink-0"
                />
              </div>
            </button>
          </section>
        )}

        <div className="pt-1">
          <ProPromo variant="home" compact />
        </div>
      </motion.div>

      <DifficultyHomeModal open={difficultyOpen} onClose={() => setDifficultyOpen(false)} />
    </AppShell>
  )
}
