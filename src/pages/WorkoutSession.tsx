import { useState, useEffect, useRef } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Pause, Play, Check, Droplets } from 'lucide-react'
import { MotionButton } from '@/components/ui/Button'
import { BackButton } from '@/components/ui/BackButton'
import { Input } from '@/components/ui/Input'
import { Progress } from '@/components/ui/Progress'
import { ExerciseDemoVideo } from '@/components/ExerciseDemoVideo'
import { useStore } from '@/store'
import { EXERCISES, WORKOUT_PLANS, isTimerExercise, type ExerciseType } from '@/types'
import { formatMinutes } from '@/lib/utils'
import { distributeAcrossSets } from '@/lib/exercise-sets'
import { getEncouragingMessage } from '@/lib/encouragement'
import { useToast } from '@/components/ui/Toast'
import { useTranslation } from '@/i18n/context'

type Phase = 'intro' | 'plan' | 'setActive' | 'setRest' | 'paused' | 'finished'

interface ExerciseResult {
  type: ExerciseType
  amount: number
  durationSeconds: number
}

const DEFAULT_SET_COUNT = 0

export function WorkoutSessionPage() {
  const [searchParams] = useSearchParams()
  const planId = searchParams.get('plan') ?? ''
  const plan = WORKOUT_PLANS.find((p) => p.id === planId)
  const navigate = useNavigate()
  const { toast } = useToast()
  const { t } = useTranslation()
  const { getEarnedMinutes, completeWorkoutPlan } = useStore()

  const [step, setStep] = useState(0)
  const [phase, setPhase] = useState<Phase>('intro')
  const [totalAmount, setTotalAmount] = useState(0)
  const [setCount, setSetCount] = useState(DEFAULT_SET_COUNT)
  const [setsTouched, setSetsTouched] = useState(false)
  const [currentSet, setCurrentSet] = useState(1)
  const [setPlan, setSetPlan] = useState<number[]>([])
  const [elapsed, setElapsed] = useState(0)
  const [results, setResults] = useState<ExerciseResult[]>([])
  const startTimeRef = useRef(0)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const current = plan?.exercises[step]
  const exercise = current ? EXERCISES[current.type] : null
  const isTimer = current ? isTimerExercise(current.type) : false
  const currentSetTarget = setPlan[currentSet - 1] ?? 0
  const unitLabel = isTimer ? t('exercise.seconds') : t('exercise.reps')

  const exName = current ? t(`exercises.${current.type}.name`) : ''
  const howTo = current ? t(`exercises.${current.type}.howTo`) : ''
  const focusTip = current ? t(`exercises.${current.type}.focus`) : ''

  const clearTimer = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current)
      timerRef.current = null
    }
  }

  const startTimer = () => {
    clearTimer()
    timerRef.current = setInterval(() => {
      setElapsed((e) => e + 1)
    }, 1000)
  }

  const setsValid = setCount >= 1 && setCount <= 20
  const setsError = setsTouched && !setsValid ? t('exercise.setsRequired') : undefined

  const resetForStep = (nextStep: number, target: number) => {
    clearTimer()
    setStep(nextStep)
    setTotalAmount(target)
    setSetCount(DEFAULT_SET_COUNT)
    setSetsTouched(false)
    setCurrentSet(1)
    setSetPlan([])
    setElapsed(0)
    setPhase('intro')
  }

  const beginExercise = () => {
    setSetsTouched(true)
    if (!setsValid) return
    const planSets = distributeAcrossSets(totalAmount, setCount)
    setSetPlan(planSets)
    setCurrentSet(1)
    setElapsed(0)
    startTimeRef.current = Date.now()
    setPhase('setActive')
    if (isTimer) startTimer()
  }

  const finishCurrentSet = () => {
    clearTimer()
    if (currentSet >= setCount) {
      finishCurrentExercise()
      return
    }
    setPhase('setRest')
  }

  const startNextSet = () => {
    setCurrentSet((s) => s + 1)
    setElapsed(0)
    setPhase('setActive')
    if (isTimer) startTimer()
  }

  const pauseTimer = () => {
    clearTimer()
    setPhase('paused')
  }

  const resumeTimer = () => {
    setPhase('setActive')
    startTimer()
  }

  const finishCurrentExercise = () => {
    if (!current || !plan) return
    clearTimer()
    const duration = Math.round((Date.now() - startTimeRef.current) / 1000)
    const result: ExerciseResult = {
      type: current.type,
      amount: totalAmount,
      durationSeconds: duration,
    }
    const isLast = step + 1 >= plan.exercises.length

    setResults((prev) => [...prev, result])

    if (isLast) {
      setPhase('finished')
    } else {
      const next = plan.exercises[step + 1]
      resetForStep(step + 1, next.target)
    }
  }

  const handleClaim = () => {
    const { total } = completeWorkoutPlan(planId, results)
    toast(getEncouragingMessage(total), 'success')
    navigate('/')
  }

  useEffect(() => {
    if (!plan) return
    const first = plan.exercises[0]
    setTotalAmount(first.target)
  }, [plan])

  useEffect(() => {
    if (phase === 'setActive' && isTimer && currentSetTarget > 0 && elapsed >= currentSetTarget) {
      finishCurrentSet()
    }
  }, [elapsed, phase, isTimer, currentSetTarget])

  useEffect(() => () => clearTimer(), [])

  if (!plan || !current || !exercise) {
    return (
      <div className="min-h-dvh bg-surface-0 flex flex-col items-center justify-center gap-4 px-6 safe-top safe-bottom">
        <p className="text-white/50 text-sm">{t('exercise.workoutNotFound')}</p>
        <BackButton onClick={() => navigate('/exercise')} aria-label={t('common.back')} />
      </div>
    )
  }

  const formatTimer = (seconds: number) => {
    const m = Math.floor(seconds / 60)
    const s = seconds % 60
    return `${m}:${s.toString().padStart(2, '0')}`
  }

  const progressPct = ((step + (phase === 'setActive' || phase === 'setRest' || phase === 'paused' ? 0.5 : 0)) / plan.exercises.length) * 100

  let baseTotal = 0
  results.forEach((r) => {
    baseTotal += getEarnedMinutes(r.type, r.amount)
  })
  const bonusTotal = Math.round(baseTotal * (plan.bonusPercent / 100) * 10) / 10

  return (
    <div className="min-h-dvh w-full max-w-full overflow-x-hidden bg-surface-0 noise flex flex-col safe-top safe-bottom">
      <div className="pointer-events-none fixed inset-0 overflow-hidden bg-surface-0">
        <div className={`absolute top-1/3 left-1/2 -translate-x-1/2 w-80 h-80 rounded-full blur-3xl opacity-20 bg-gradient-to-br ${exercise.gradient}`} />
      </div>

      <div className="relative z-10 px-5 pt-4">
        <div className="flex items-center justify-between mb-4">
          <BackButton
            variant="close"
            onClick={() => navigate(-1)}
            aria-label={t('common.close')}
          />
          <span className="text-sm font-medium text-white/50">{t(`workoutPlans.${planId}.name`)}</span>
          <div className="w-12" />
        </div>
        <Progress value={progressPct} max={100} size="sm" />
        <p className="text-xs text-white/30 mt-2 text-center">
          {t('activity.stepOf', { current: Math.min(step + 1, plan.exercises.length), total: plan.exercises.length })}
          {phase !== 'finished' && ` · ${exName}`}
        </p>
      </div>

      <div className="relative z-10 flex-1 flex flex-col px-6 py-4 overflow-y-auto">
        <AnimatePresence mode="wait">
          {phase === 'intro' && (
            <motion.div key={`intro-${step}`} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="flex-1 flex flex-col">
              <ExerciseDemoVideo type={current.type} className="mb-6" />
              <h2 className="text-2xl font-bold mb-3">{exName}</h2>
              <p className="text-white/55 text-base leading-relaxed mb-4">{howTo}</p>
              <div className="p-4 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 mb-4">
                <p className="text-xs font-semibold text-indigo-300 uppercase tracking-wider mb-1">{t('exercise.focusOn')}</p>
                <p className="text-sm text-white/70 leading-relaxed">{focusTip}</p>
              </div>
              <p className="text-sm text-white/35 text-center">
                {isTimer
                  ? `${current.target} ${t('exercise.seconds')} ${t('activity.planned')}`
                  : `${current.target} ${t('exercise.reps')} ${t('activity.planned')}`}
              </p>
            </motion.div>
          )}

          {phase === 'plan' && (
            <motion.div key={`plan-${step}`} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="flex-1 flex flex-col justify-center max-w-sm mx-auto w-full">
              <h2 className="text-2xl font-bold mb-2">{t('exercise.planWorkout')}</h2>
              <p className="text-white/45 text-sm mb-6">{t('exercise.planWorkoutDesc')}</p>
              <div className="space-y-4">
                <Input
                  id="total-amount"
                  type="number"
                  min={1}
                  label={isTimer ? t('exercise.totalSeconds') : t('exercise.totalReps')}
                  value={totalAmount}
                  onChange={(e) => setTotalAmount(Math.max(1, Number(e.target.value) || 1))}
                  className="h-14 text-lg"
                />
                <Input
                  id="set-count"
                  type="number"
                  inputMode="numeric"
                  min={0}
                  max={20}
                  label={t('exercise.numberOfSets')}
                  value={setCount === 0 ? '' : setCount}
                  placeholder="0"
                  error={setsError}
                  onChange={(e) => {
                    setSetsTouched(true)
                    const raw = e.target.value
                    if (raw === '') {
                      setSetCount(0)
                      return
                    }
                    setSetCount(Math.max(0, Math.min(20, Number(raw) || 0)))
                  }}
                  className="h-14 text-lg"
                />
              </div>
              {setsValid ? (
                <div className="mt-6 p-4 rounded-2xl bg-indigo-500/10 border border-indigo-500/25 text-center">
                  <p className="text-sm text-white/55">
                    {t('exercise.perSetPreview', {
                      amount: distributeAcrossSets(totalAmount, setCount)[0],
                      unit: unitLabel,
                    })}
                  </p>
                </div>
              ) : (
                <p className="mt-4 text-center text-sm text-amber-300/90">
                  {t('exercise.setsRequired')}
                </p>
              )}
            </motion.div>
          )}

          {(phase === 'setActive' || phase === 'paused') && (
            <motion.div key={`active-${step}-${currentSet}`} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex-1 flex flex-col items-center justify-center text-center">
              <p className="text-sm font-medium text-white/40 uppercase tracking-wider mb-2">
                {t('exercise.setOf', { current: currentSet, total: setCount })}
              </p>
              {isTimer ? (
                <>
                  <p className="text-7xl font-bold tracking-tighter tabular-nums mb-2">{formatTimer(elapsed)}</p>
                  <p className="text-white/40 text-sm mb-2">{t('exercise.holdFor', { seconds: currentSetTarget })}</p>
                </>
              ) : (
                <>
                  <p className="text-7xl font-bold tracking-tighter tabular-nums gradient-text mb-2">{currentSetTarget}</p>
                  <p className="text-white/40 text-sm mb-2">{unitLabel}</p>
                </>
              )}
              <p className="text-white/30 text-xs">{focusTip}</p>
            </motion.div>
          )}

          {phase === 'setRest' && (
            <motion.div key={`rest-${step}-${currentSet}`} initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="flex-1 flex flex-col items-center justify-center text-center">
              <div className="w-16 h-16 rounded-full bg-cyan-500/15 flex items-center justify-center mb-5">
                <Droplets size={28} className="text-cyan-400" />
              </div>
              <h2 className="text-2xl font-bold mb-2">{t('exercise.restTitle')}</h2>
              <p className="text-white/45 text-sm max-w-xs leading-relaxed">{t('exercise.restDesc')}</p>
            </motion.div>
          )}

          {phase === 'finished' && (
            <motion.div key="finished" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="flex-1 flex flex-col items-center justify-center text-center">
              <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-emerald-500/20 flex items-center justify-center">
                <Check size={40} className="text-emerald-400" />
              </div>
              <h2 className="text-2xl font-bold mb-2">{t('activity.planComplete')}</h2>
              <p className="text-lg text-white/60 mb-4 max-w-xs">{getEncouragingMessage(baseTotal + bonusTotal)}</p>
              <p className="text-white/40 text-sm mb-1">{t('activity.baseEarned')}: {formatMinutes(baseTotal)}</p>
              <p className="text-indigo-400 text-sm mb-4">
                {t('activity.bonusLabel', { percent: plan.bonusPercent })}: +{formatMinutes(bonusTotal)}
              </p>
              <p className="text-4xl font-bold gradient-text">+{formatMinutes(baseTotal + bonusTotal)}</p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div className="relative z-10 px-6 pb-[max(1.5rem,env(safe-area-inset-bottom))] space-y-3 shrink-0">
        {phase === 'intro' && (
          <MotionButton fullWidth size="xl" onClick={() => setPhase('plan')}>
            {t('exercise.startExercise')}
          </MotionButton>
        )}
        {phase === 'plan' && (
          <MotionButton fullWidth size="xl" disabled={!setsValid} onClick={beginExercise}>
            {t('exercise.startSet', { number: 1 })}
          </MotionButton>
        )}
        {(phase === 'setActive' || phase === 'paused') && (
          <div className="flex gap-3">
            {isTimer && (
              <MotionButton variant="secondary" size="lg" className="flex-1" onClick={phase === 'paused' ? resumeTimer : pauseTimer}>
                {phase === 'paused' ? <Play size={18} /> : <Pause size={18} />}
                {phase === 'paused' ? t('exercise.resume') : t('exercise.pause')}
              </MotionButton>
            )}
            <MotionButton size="lg" className="flex-1" onClick={finishCurrentSet}>
              {t('exercise.finishedSet')}
            </MotionButton>
          </div>
        )}
        {phase === 'setRest' && (
          <MotionButton fullWidth size="xl" onClick={startNextSet}>
            {t('exercise.startSet', { number: currentSet + 1 })}
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
