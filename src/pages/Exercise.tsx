import { motion } from 'framer-motion'
import { useNavigate, useParams } from 'react-router-dom'
import { ChevronDown, ChevronRight, Sparkles } from 'lucide-react'
import { CategoryIcon, ExerciseIcon, WorkoutPlanIcon } from '@/components/ExerciseIcons'
import { AppShell } from '@/components/layout/AppShell'
import { ProPromo } from '@/components/ProPromo'
import { Badge } from '@/components/ui/Badge'
import { BackButton } from '@/components/ui/BackButton'
import { Button } from '@/components/ui/Button'
import {
  EXERCISES, EXERCISE_CATEGORIES, WORKOUT_PLANS, getExercisesByCategory,
  type ExerciseCategory, type ExerciseType,
} from '@/types'
import { cn } from '@/lib/utils'
import { useTranslation } from '@/i18n/context'
import { startTransition, useEffect, useState } from 'react'
import type { WorkoutPlan } from '@/types'

const CATEGORY_GRADIENT: Record<ExerciseCategory, string> = {
  cardio: 'from-orange-500 to-red-500',
  chest: 'from-emerald-500 to-teal-600',
  legs: 'from-teal-500 to-emerald-600',
  core: 'from-cyan-500 to-teal-600',
  arms: 'from-blue-500 to-emerald-600',
}

const CATEGORY_GLOW: Record<ExerciseCategory, string> = {
  cardio: 'shadow-orange-500/25',
  chest: 'shadow-emerald-500/25',
  legs: 'shadow-teal-500/25',
  core: 'shadow-cyan-500/25',
  arms: 'shadow-blue-500/25',
}

const PLANNED_WORKOUTS_PREVIEW = 3

function WorkoutPlanRow({
  plan,
  onSelect,
}: {
  plan: WorkoutPlan
  onSelect: () => void
}) {
  const { t } = useTranslation()

  return (
    <button
      type="button"
      onClick={onSelect}
      className={cn(
        'group w-full text-left rounded-2xl px-4 py-3.5',
        'bg-white/[0.03] border border-white/[0.07]',
        'hover:bg-white/[0.055] hover:border-white/[0.12]',
        'active:scale-[0.985] transition-transform duration-150'
      )}
    >
      <div className="flex items-center gap-3.5">
        <div
          className={cn(
            'w-11 h-11 rounded-xl bg-gradient-to-br flex items-center justify-center text-white shrink-0',
            'shadow-lg shadow-black/30',
            plan.gradient
          )}
        >
          <WorkoutPlanIcon planId={plan.id} size={20} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 min-w-0">
            <h3 className="font-semibold text-[15px] tracking-tight truncate">
              {t(`workoutPlans.${plan.id}.name`)}
            </h3>
            <span className="shrink-0 text-[10px] font-semibold uppercase tracking-wider text-emerald-400/90 bg-emerald-500/10 px-1.5 py-0.5 rounded-md">
              +{plan.bonusPercent}%
            </span>
          </div>
          <p className="text-white/40 text-xs mt-0.5 truncate">
            {t(`workoutPlans.${plan.id}.description`)}
          </p>
        </div>
        <div className="flex flex-col items-end gap-1 shrink-0">
          <span className="text-[11px] tabular-nums text-white/35">
            {plan.exercises.length} {t('activity.exercises')}
          </span>
          <ChevronRight
            size={16}
            className="text-white/20 group-hover:text-white/40 transition-colors"
          />
        </div>
      </div>
    </button>
  )
}

export function ExercisePage() {
  const navigate = useNavigate()
  const { t } = useTranslation()
  const [plansExpanded, setPlansExpanded] = useState(false)

  const hasMorePlans = WORKOUT_PLANS.length > PLANNED_WORKOUTS_PREVIEW
  const visiblePlans = plansExpanded
    ? WORKOUT_PLANS
    : WORKOUT_PLANS.slice(0, PLANNED_WORKOUTS_PREVIEW)
  const hiddenCount = WORKOUT_PLANS.length - PLANNED_WORKOUTS_PREVIEW

  const togglePlansExpanded = () => {
    startTransition(() => {
      setPlansExpanded((open) => !open)
    })
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
            <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-emerald-300/70 mb-2">
              RepLock
            </p>
            <h1 className="text-[2rem] font-bold tracking-tight leading-none">
              {t('exercise.title')}
            </h1>
            <p className="text-white/45 text-sm mt-2.5 max-w-[17rem] mx-auto leading-relaxed">
              {t('exercise.subtitle')}
            </p>
          </motion.div>
        </header>

        <section>
          <div className="flex items-center justify-center gap-2 mb-4">
            <Sparkles size={13} className="text-emerald-400/80" />
            <h2 className="text-[11px] font-semibold uppercase tracking-[0.18em] text-white/45">
              {t('exercise.plannedWorkouts')}
            </h2>
          </div>
          <div className="space-y-2">
            {visiblePlans.map((plan) => (
              <WorkoutPlanRow
                key={plan.id}
                plan={plan}
                onSelect={() => navigate(`/exercise/workout?plan=${plan.id}`)}
              />
            ))}
          </div>
          {hasMorePlans && (
            <Button
              variant="outline"
              fullWidth
              className="mt-3 border-white/10 bg-transparent hover:bg-white/[0.04]"
              onClick={togglePlansExpanded}
            >
              {plansExpanded
                ? t('exercise.showFewerWorkouts')
                : t('exercise.showMoreWorkouts', { count: hiddenCount })}
              <ChevronDown
                size={16}
                className={cn(
                  'text-white/40 transition-transform duration-200',
                  plansExpanded && 'rotate-180'
                )}
              />
            </Button>
          )}
        </section>

        <section>
          <div className="text-center mb-5">
            <h2 className="text-[11px] font-semibold uppercase tracking-[0.18em] text-white/45">
              {t('exercise.byMuscle')}
            </h2>
            <div className="mx-auto mt-3 h-px w-10 bg-gradient-to-r from-transparent via-emerald-400/40 to-transparent" />
          </div>

          <div className="flex flex-wrap justify-center gap-3">
            {EXERCISE_CATEGORIES.map((category, i) => {
              const count = getExercisesByCategory(category).length
              const gradient = CATEGORY_GRADIENT[category]
              const glow = CATEGORY_GLOW[category]
              return (
                <motion.button
                  key={category}
                  type="button"
                  initial={{ opacity: 0, y: 12, scale: 0.96 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  transition={{ delay: 0.08 + i * 0.05, duration: 0.4, ease: 'easeOut' }}
                  onClick={() => navigate(`/exercise/category/${category}`)}
                  className={cn(
                    'w-[calc(50%-0.375rem)] max-w-[10.5rem]',
                    'flex flex-col items-center text-center px-3 py-5 rounded-2xl',
                    'bg-white/[0.03] border border-white/[0.07]',
                    'hover:bg-white/[0.06] hover:border-white/[0.12]',
                    'active:scale-[0.97] transition-all duration-200'
                  )}
                >
                  <div
                    className={cn(
                      'w-12 h-12 rounded-2xl bg-gradient-to-br flex items-center justify-center text-white mb-3',
                      'shadow-lg',
                      glow,
                      gradient
                    )}
                  >
                    <CategoryIcon category={category} size={22} />
                  </div>
                  <h3 className="font-semibold text-[15px] tracking-tight leading-tight">
                    {t(`categories.${category}`)}
                  </h3>
                  <p className="text-[11px] text-white/35 mt-1.5 tabular-nums">
                    {count} {t('activity.exercises')}
                  </p>
                </motion.button>
              )
            })}
          </div>
        </section>

        <div className="pt-1">
          <ProPromo variant="exercise" compact />
        </div>
      </motion.div>
    </AppShell>
  )
}

export function ExerciseCategoryPage() {
  const { category } = useParams<{ category: string }>()
  const navigate = useNavigate()
  const { t } = useTranslation()

  const validCategory = EXERCISE_CATEGORIES.includes(category as ExerciseCategory)
    ? (category as ExerciseCategory)
    : null

  useEffect(() => {
    if (!validCategory) navigate('/exercise', { replace: true })
  }, [validCategory, navigate])

  if (!validCategory) return null

  const exercises = getExercisesByCategory(validCategory)
  const gradient = CATEGORY_GRADIENT[validCategory]
  const glow = CATEGORY_GLOW[validCategory]

  return (
    <AppShell>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="max-w-lg mx-auto w-full"
      >
        <div className="flex flex-col items-center text-center mb-8 pt-1">
          <div className="self-start mb-5">
            <BackButton
              onClick={() => navigate('/exercise')}
              aria-label={t('common.back')}
            />
          </div>
          <div
            className={cn(
              'w-16 h-16 rounded-2xl bg-gradient-to-br flex items-center justify-center text-white shadow-xl mb-4',
              glow,
              gradient
            )}
          >
            <CategoryIcon category={validCategory} size={28} />
          </div>
          <h1 className="text-2xl font-bold tracking-tight leading-tight">
            {t(`categories.${validCategory}`)}
          </h1>
          <p className="text-white/40 text-sm mt-1.5">
            {exercises.length} {t('activity.exercises')}
          </p>
        </div>

        <div className="space-y-2">
          {exercises.map((type: ExerciseType, i) => {
            const ex = EXERCISES[type]
            return (
              <motion.button
                key={type}
                type="button"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.03 }}
                onClick={() => navigate(`/exercise/session?type=${type}`)}
                className={cn(
                  'w-full text-left rounded-2xl px-4 py-3.5',
                  'bg-white/[0.03] border border-white/[0.07]',
                  'hover:bg-white/[0.055] hover:border-white/[0.12]',
                  'active:scale-[0.985] transition-all duration-200'
                )}
              >
                <div className="flex items-center gap-3">
                  <div
                    className={cn(
                      'w-11 h-11 rounded-xl bg-gradient-to-br flex items-center justify-center text-white shrink-0',
                      ex.gradient
                    )}
                  >
                    <ExerciseIcon type={type} size={20} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 min-w-0">
                      <h3 className="font-medium text-sm truncate">
                        {t(`exercises.${type}.name`)}
                      </h3>
                      {ex.tier === 'high' && (
                        <Badge variant="warning">{t('exercise.highReward')}</Badge>
                      )}
                    </div>
                    <p className="text-xs text-white/40 mt-0.5 truncate">
                      {t(`exercises.${type}.description`)}
                    </p>
                  </div>
                  <ChevronRight size={16} className="text-white/20 shrink-0" />
                </div>
              </motion.button>
            )
          })}
        </div>
      </motion.div>
    </AppShell>
  )
}
