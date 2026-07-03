import { useState, useEffect, useCallback, useRef } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Pause, Play, Check, ChevronRight } from 'lucide-react'
import { MotionButton } from '@/components/ui/Button'
import { Progress } from '@/components/ui/Progress'
import { useStore } from '@/store'
import { EXERCISES, WORKOUT_PLANS, isTimerExercise, type ExerciseType } from '@/types'
import { formatMinutes } from '@/lib/utils'
import { useToast } from '@/components/ui/Toast'
import { useTranslation } from '@/i18n/context'

type Phase = 'ready' | 'active' | 'paused' | 'complete' | 'finished'

export function WorkoutSessionPage() {
  const [searchParams] = useSearchParams()
  const planId = searchParams.get('plan') ?? ''
  const plan = WORKOUT_PLANS.find((p) => p.id === planId)
  const navigate = useNavigate()
  const { toast } = useToast()
  const { t } = useTranslation()
  const { getEarnedMinutes, completeWorkoutPlan } = useStore()

  const [step, setStep] = useState(0)
  const [phase, setPhase] = useState<Phase>('ready')
  const [count, setCount] = useState(0)
  const [elapsed, setElapsed] = useState(0)
  const [results, setResults] = useState<{ type: ExerciseType; amount: number; durationSeconds: number }[]>([])
  const startTimeRef = useRef(0)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  if (!plan) {
    return (
      <div className="min-h-dvh flex items-center justify-center">
        <button onClick={() => navigate('/exercise')} className="text-indigo-400">Back</button>
      </div>
    )
  }

  const current = plan.exercises[step]
  const exercise = EXERCISES[current.type]
  const isTimer = isTimerExercise(current.type)
  const target = current.target
  const earned = getEarnedMinutes(current.type, isTimer ? elapsed : count)

  const clearTimer = () => {
    if (timerRef.current) clearInterval(timerRef.current)
  }

  const startStep = () => {
    setCount(0)
    setElapsed(0)
    setPhase('active')
    startTimeRef.current = Date.now()
    if (isTimer) timerRef.current = setInterval(() => setElapsed((e) => e + 1), 1000)
  }

  const finishStep = (amount: number) => {
    clearTimer()
    const duration = Math.round((Date.now() - startTimeRef.current) / 1000)
    const result = { type: current.type, amount, durationSeconds: duration }
    const nextResults = [...results, result]
    setResults(nextResults)

    if (step + 1 >= plan.exercises.length) {
      setPhase('finished')
    } else {
      setStep(step + 1)
      setPhase('ready')
    }
  }

  const addRep = useCallback(() => {
    if (phase !== 'active') return
    setCount((c) => {
      const next = c + 1
      if (next >= target) {
        setTimeout(() => finishStep(target), 100)
      }
      return next
    })
    if (navigator.vibrate) navigator.vibrate(10)
  }, [phase, target])

  useEffect(() => () => clearTimer(), [])

  const handleClaim = () => {
    const { total, bonus } = completeWorkoutPlan(planId, results)
    toast(`+${formatMinutes(total)} (${formatMinutes(bonus)} bonus)`, 'success')
    navigate('/')
  }

  const formatTimer = (s: number) => `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, '0')}`
  const progressPct = ((step + (phase === 'active' || phase === 'complete' ? 0.5 : 0)) / plan.exercises.length) * 100

  let baseTotal = 0
  results.forEach((r) => { baseTotal += getEarnedMinutes(r.type, r.amount) })
  const bonusTotal = Math.round(baseTotal * (plan.bonusPercent / 100) * 10) / 10

  return (
    <div className="min-h-dvh bg-surface-0 noise flex flex-col safe-top safe-bottom">
      <div className="relative z-10 px-5 pt-4">
        <div className="flex items-center justify-between mb-4">
          <button onClick={() => navigate(-1)} className="p-2 -ml-2 rounded-xl hover:bg-white/5 text-white/40">
            <X size={22} />
          </button>
          <span className="text-sm font-medium text-white/50">{t(`workoutPlans.${planId}.name`)}</span>
          <div className="w-10" />
        </div>
        <Progress value={progressPct} max={100} size="sm" />
        <p className="text-xs text-white/30 mt-2 text-center">
          {t('activity.stepOf', { current: Math.min(step + 1, plan.exercises.length), total: plan.exercises.length })}
        </p>
      </div>

      <div className="relative z-10 flex-1 flex flex-col items-center justify-center px-6">
        <AnimatePresence mode="wait">
          {phase === 'finished' ? (
            <motion.div key="done" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="text-center">
              <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-emerald-500/20 flex items-center justify-center">
                <Check size={40} className="text-emerald-400" />
              </div>
              <h2 className="text-2xl font-bold mb-2">{t('activity.planComplete')}</h2>
              <p className="text-white/40 text-sm mb-1">{t('activity.baseEarned')}: {formatMinutes(baseTotal)}</p>
              <p className="text-indigo-400 text-sm mb-4">
                {t('activity.bonusLabel', { percent: plan.bonusPercent })}: +{formatMinutes(bonusTotal)}
              </p>
              <p className="text-4xl font-bold gradient-text">+{formatMinutes(baseTotal + bonusTotal)}</p>
            </motion.div>
          ) : phase === 'ready' ? (
            <motion.div key="ready" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center">
              <div className={`w-20 h-20 mx-auto mb-4 rounded-2xl bg-gradient-to-br ${exercise.gradient} flex items-center justify-center text-3xl`}>
                {exercise.icon}
              </div>
              <h2 className="text-xl font-bold">{t(`exercises.${current.type}.name`)}</h2>
              <p className="text-white/40 text-sm mt-2">
                {isTimer ? `${target}s` : `${target} ${t('common.reps')}`}
              </p>
            </motion.div>
          ) : (
            <motion.div key="active" className="text-center w-full">
              {isTimer ? (
                <p className="text-7xl font-bold tabular-nums mb-4">{formatTimer(elapsed)}</p>
              ) : (
                <>
                  <p className="text-8xl font-bold gradient-text mb-2">{count}</p>
                  <p className="text-white/30 text-sm mb-8">/ {target}</p>
                  <button
                    onClick={addRep}
                    className={`w-44 h-44 mx-auto rounded-full bg-gradient-to-br ${exercise.gradient} flex items-center justify-center shadow-2xl active:scale-95 transition-transform`}
                  >
                    <span className="text-3xl font-bold">+1</span>
                  </button>
                </>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div className="relative z-10 px-6 pb-6 space-y-3">
        {phase === 'ready' && phase !== 'finished' && (
          <MotionButton fullWidth size="xl" onClick={startStep}>
            {t('exercise.startWorkout')}
            <ChevronRight size={18} />
          </MotionButton>
        )}
        {phase === 'active' && isTimer && (
          <div className="flex gap-3">
            <MotionButton variant="secondary" className="flex-1" onClick={() => { clearTimer(); setPhase('paused') }}>
              <Pause size={18} /> {t('exercise.pause')}
            </MotionButton>
            <MotionButton className="flex-1" onClick={() => finishStep(elapsed)}>
              {t('exercise.finish')}
            </MotionButton>
          </div>
        )}
        {phase === 'paused' && (
          <MotionButton fullWidth onClick={() => { setPhase('active'); timerRef.current = setInterval(() => setElapsed((e) => e + 1), 1000) }}>
            <Play size={18} /> {t('exercise.resume')}
          </MotionButton>
        )}
        {phase === 'finished' && (
          <MotionButton fullWidth size="xl" onClick={handleClaim}>
            {t('exercise.claim', { amount: formatMinutes(baseTotal + bonusTotal) })}
          </MotionButton>
        )}
      </div>
    </div>
  )
}
