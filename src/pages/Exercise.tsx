import { motion, AnimatePresence } from 'framer-motion'
import { useNavigate, useParams } from 'react-router-dom'
import { ChevronDown, ChevronRight, Sparkles } from 'lucide-react'
import { CategoryIcon, ExerciseIcon, WorkoutPlanIcon } from '@/components/ExerciseIcons'
import { AppShell } from '@/components/layout/AppShell'
import { PageHeader } from '@/components/layout/PageHeader'
import { ProPromo } from '@/components/ProPromo'
import { MotionCard } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { BackButton } from '@/components/ui/BackButton'
import { Button } from '@/components/ui/Button'
import {
  EXERCISES, EXERCISE_CATEGORIES, WORKOUT_PLANS, getExercisesByCategory,
  type ExerciseCategory, type ExerciseType,
} from '@/types'
import { cn } from '@/lib/utils'
import { useTranslation } from '@/i18n/context'
import { useEffect, useState } from 'react'
import type { WorkoutPlan } from '@/types'

const CATEGORY_GRADIENT: Record<ExerciseCategory, string> = {
  cardio: 'from-orange-500 to-red-500',
  chest: 'from-indigo-500 to-violet-600',
  legs: 'from-violet-500 to-purple-600',
  core: 'from-cyan-500 to-teal-600',
  arms: 'from-blue-500 to-indigo-600',
}

const PLANNED_WORKOUTS_PREVIEW = 3

function WorkoutPlanCard({
  plan,
  index,
  onSelect,
}: {
  plan: WorkoutPlan
  index: number
  onSelect: () => void
}) {
  const { t } = useTranslation()

  return (
    <motion.button
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -4 }}
      transition={{ delay: index * 0.04 }}
      onClick={onSelect}
      className="w-full text-left"
    >
      <MotionCard hover className="p-4 gradient-border">
        <div className="flex items-center gap-4">
          <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${plan.gradient} flex items-center justify-center text-white`}>
            <WorkoutPlanIcon planId={plan.id} size={22} />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h3 className="font-semibold text-sm">{t(`workoutPlans.${plan.id}.name`)}</h3>
              <Badge variant="success">+{plan.bonusPercent}%</Badge>
            </div>
            <p className="text-white/40 text-xs mt-0.5">{t(`workoutPlans.${plan.id}.description`)}</p>
            <p className="text-indigo-400 text-xs mt-1">
              {plan.exercises.length} {t('activity.exercises')}
            </p>
          </div>
          <ChevronRight size={18} className="text-white/20 shrink-0" />
        </div>
      </MotionCard>
    </motion.button>
  )
}

export function ExercisePage() {
  const navigate = useNavigate()
  const { t } = useTranslation()
  const [plansExpanded, setPlansExpanded] = useState(false)

  const hasMorePlans = WORKOUT_PLANS.length > PLANNED_WORKOUTS_PREVIEW
  const previewPlans = WORKOUT_PLANS.slice(0, PLANNED_WORKOUTS_PREVIEW)
  const extraPlans = WORKOUT_PLANS.slice(PLANNED_WORKOUTS_PREVIEW)
  const hiddenCount = extraPlans.length

  return (
    <AppShell>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-5">
        <PageHeader title={t('exercise.title')} subtitle={t('exercise.subtitle')} />

        <section>
          <h2 className="text-sm font-semibold text-white/60 uppercase tracking-wider mb-3 flex items-center gap-2">
            <Sparkles size={14} className="text-indigo-400" />
            {t('exercise.plannedWorkouts')}
          </h2>
          <div className="space-y-3">
            {previewPlans.map((plan, i) => (
              <WorkoutPlanCard
                key={plan.id}
                plan={plan}
                index={i}
                onSelect={() => navigate(`/exercise/workout?plan=${plan.id}`)}
              />
            ))}
            <AnimatePresence initial={false}>
              {plansExpanded &&
                extraPlans.map((plan, i) => (
                  <WorkoutPlanCard
                    key={plan.id}
                    plan={plan}
                    index={i}
                    onSelect={() => navigate(`/exercise/workout?plan=${plan.id}`)}
                  />
                ))}
            </AnimatePresence>
          </div>
          {hasMorePlans && (
            <Button
              variant="outline"
              fullWidth
              className="mt-3"
              onClick={() => setPlansExpanded((open) => !open)}
            >
              {plansExpanded
                ? t('exercise.showFewerWorkouts')
                : t('exercise.showMoreWorkouts', { count: hiddenCount })}
              <ChevronDown
                size={18}
                className={cn('text-white/40 transition-transform duration-200', plansExpanded && 'rotate-180')}
              />
            </Button>
          )}
        </section>

        <section>
          <h2 className="text-sm font-semibold text-white/60 uppercase tracking-wider mb-3">
            {t('exercise.byMuscle')}
          </h2>
          <div className="grid grid-cols-2 gap-3">
            {EXERCISE_CATEGORIES.map((category, i) => {
              const count = getExercisesByCategory(category).length
              const gradient = CATEGORY_GRADIENT[category]
              return (
                <motion.button
                  key={category}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                  onClick={() => navigate(`/exercise/category/${category}`)}
                  className="text-left"
                >
                  <MotionCard hover className="p-5 h-full">
                    <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${gradient} flex items-center justify-center text-white mb-3 shadow-lg`}>
                      <CategoryIcon category={category} size={22} />
                    </div>
                    <h3 className="font-semibold text-base">{t(`categories.${category}`)}</h3>
                    <p className="text-xs text-white/40 mt-1">{count} {t('activity.exercises')}</p>
                  </MotionCard>
                </motion.button>
              )
            })}
          </div>
        </section>

        <ProPromo variant="exercise" compact />
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

  return (
    <AppShell>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
        <div className="flex items-center gap-3 mb-8">
          <BackButton
            onClick={() => navigate('/exercise')}
            aria-label={t('common.back')}
          />
          <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${gradient} flex items-center justify-center text-white shadow-lg shrink-0`}>
            <CategoryIcon category={validCategory} size={26} />
          </div>
          <div className="flex-1 min-w-0">
            <h1 className="text-2xl font-bold tracking-tight leading-tight">{t(`categories.${validCategory}`)}</h1>
            <p className="text-white/40 text-sm mt-0.5">{exercises.length} {t('activity.exercises')}</p>
          </div>
        </div>

        <div className="space-y-2">
          {exercises.map((type: ExerciseType) => {
            const ex = EXERCISES[type]
            return (
              <button
                key={type}
                onClick={() => navigate(`/exercise/session?type=${type}`)}
                className="w-full text-left"
              >
                <MotionCard hover className="p-4">
                  <div className="flex items-center gap-3">
                    <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${ex.gradient} flex items-center justify-center text-white`}>
                      <ExerciseIcon type={type} size={20} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h3 className="font-medium text-sm">{t(`exercises.${type}.name`)}</h3>
                        {ex.tier === 'high' && <Badge variant="warning">{t('exercise.highReward')}</Badge>}
                      </div>
                      <p className="text-xs text-white/40">{t(`exercises.${type}.description`)}</p>
                    </div>
                    <ChevronRight size={16} className="text-white/20" />
                  </div>
                </MotionCard>
              </button>
            )
          })}
        </div>
      </motion.div>
    </AppShell>
  )
}
