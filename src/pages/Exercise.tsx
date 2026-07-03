import { motion } from 'framer-motion'
import { useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, ChevronRight, Sparkles } from 'lucide-react'
import { AppShell } from '@/components/layout/AppShell'
import { ProPromo } from '@/components/ProPromo'
import { MotionCard } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { useStore } from '@/store'
import {
  EXERCISES, EXERCISE_CATEGORIES, WORKOUT_PLANS, getExercisesByCategory,
  type ExerciseCategory, type ExerciseType,
} from '@/types'
import { formatMinutes } from '@/lib/utils'
import { useTranslation } from '@/i18n/context'
import { useEffect } from 'react'

const CATEGORY_META: Record<ExerciseCategory, { icon: string; gradient: string }> = {
  cardio: { icon: '⚡', gradient: 'from-orange-500 to-red-500' },
  chest: { icon: '💪', gradient: 'from-indigo-500 to-violet-600' },
  legs: { icon: '🦵', gradient: 'from-violet-500 to-purple-600' },
  core: { icon: '🔥', gradient: 'from-cyan-500 to-teal-600' },
  arms: { icon: '💺', gradient: 'from-blue-500 to-indigo-600' },
}

export function ExercisePage() {
  const navigate = useNavigate()
  const { t } = useTranslation()
  const { getEarnedMinutes } = useStore()

  return (
    <AppShell>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
        <div className="mb-6">
          <h1 className="text-2xl font-bold tracking-tight">{t('exercise.title')}</h1>
          <p className="text-white/40 text-sm mt-1">{t('exercise.subtitle')}</p>
        </div>

        <section className="mb-8">
          <h2 className="text-sm font-semibold text-white/60 uppercase tracking-wider mb-3 flex items-center gap-2">
            <Sparkles size={14} className="text-indigo-400" />
            {t('exercise.plannedWorkouts')}
          </h2>
          <div className="space-y-3">
            {WORKOUT_PLANS.map((plan, i) => {
              const baseEarn = plan.exercises.reduce((sum, e) => sum + getEarnedMinutes(e.type, e.target), 0)
              const withBonus = baseEarn * (1 + plan.bonusPercent / 100)
              return (
                <motion.button
                  key={plan.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                  onClick={() => navigate(`/exercise/workout?plan=${plan.id}`)}
                  className="w-full text-left"
                >
                  <MotionCard hover className="p-4 gradient-border">
                    <div className="flex items-center gap-4">
                      <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${plan.gradient} flex items-center justify-center text-xl`}>
                        {plan.icon}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold text-sm">{t(`workoutPlans.${plan.id}.name`)}</h3>
                          <Badge variant="success">+{plan.bonusPercent}%</Badge>
                        </div>
                        <p className="text-white/40 text-xs mt-0.5">{t(`workoutPlans.${plan.id}.description`)}</p>
                        <p className="text-indigo-400 text-xs mt-1">
                          {plan.exercises.length} {t('activity.exercises')} · ~{formatMinutes(withBonus)}
                        </p>
                      </div>
                      <ChevronRight size={18} className="text-white/20 shrink-0" />
                    </div>
                  </MotionCard>
                </motion.button>
              )
            })}
          </div>
        </section>

        <ProPromo variant="exercise" compact />

        <section>
          <h2 className="text-sm font-semibold text-white/60 uppercase tracking-wider mb-3">
            {t('exercise.byMuscle')}
          </h2>
          <div className="grid grid-cols-2 gap-3">
            {EXERCISE_CATEGORIES.map((category, i) => {
              const count = getExercisesByCategory(category).length
              const meta = CATEGORY_META[category]
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
                    <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${meta.gradient} flex items-center justify-center text-2xl mb-3 shadow-lg`}>
                      {meta.icon}
                    </div>
                    <h3 className="font-semibold text-base">{t(`categories.${category}`)}</h3>
                    <p className="text-xs text-white/40 mt-1">{count} {t('activity.exercises')}</p>
                  </MotionCard>
                </motion.button>
              )
            })}
          </div>
        </section>
      </motion.div>
    </AppShell>
  )
}

export function ExerciseCategoryPage() {
  const { category } = useParams<{ category: string }>()
  const navigate = useNavigate()
  const { t } = useTranslation()
  const { getEarnedMinutes } = useStore()

  const validCategory = EXERCISE_CATEGORIES.includes(category as ExerciseCategory)
    ? (category as ExerciseCategory)
    : null

  useEffect(() => {
    if (!validCategory) navigate('/exercise', { replace: true })
  }, [validCategory, navigate])

  if (!validCategory) return null

  const exercises = getExercisesByCategory(validCategory)
  const meta = CATEGORY_META[validCategory]

  return (
    <AppShell>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
        <button
          onClick={() => navigate('/exercise')}
          className="flex items-center gap-2 text-sm text-white/50 hover:text-white mb-6 transition-colors"
        >
          <ArrowLeft size={18} />
          {t('exercise.byMuscle')}
        </button>

        <div className="flex items-center gap-4 mb-8">
          <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${meta.gradient} flex items-center justify-center text-2xl shadow-lg`}>
            {meta.icon}
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">{t(`categories.${validCategory}`)}</h1>
            <p className="text-white/40 text-sm">{exercises.length} {t('activity.exercises')}</p>
          </div>
        </div>

        <div className="space-y-2">
          {exercises.map((type: ExerciseType) => {
            const ex = EXERCISES[type]
            const sampleEarn = getEarnedMinutes(type, ex.defaultTarget)
            return (
              <button
                key={type}
                onClick={() => navigate(`/exercise/session?type=${type}`)}
                className="w-full text-left"
              >
                <MotionCard hover className="p-4">
                  <div className="flex items-center gap-3">
                    <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${ex.gradient} flex items-center justify-center text-lg`}>
                      {ex.icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h3 className="font-medium text-sm">{t(`exercises.${type}.name`)}</h3>
                        {ex.tier === 'high' && <Badge variant="warning">{t('exercise.highReward')}</Badge>}
                      </div>
                      <p className="text-xs text-white/40">{t(`exercises.${type}.description`)}</p>
                      <p className="text-xs text-indigo-400 mt-0.5">≈ +{sampleEarn}m</p>
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
