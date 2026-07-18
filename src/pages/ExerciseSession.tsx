import { useState, useEffect, useRef, useCallback } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Pause, Play, Check, Droplets } from 'lucide-react'
import { MotionButton } from '@/components/ui/Button'
import { BackButton } from '@/components/ui/BackButton'
import { Input } from '@/components/ui/Input'
import { Progress, CircularProgress } from '@/components/ui/Progress'
import { Modal } from '@/components/ui/Modal'
import { ExerciseDemoVideo } from '@/components/ExerciseDemoVideo'
import { useStore } from '@/store'
import { EXERCISES, isTimerExercise, isExerciseType, type ExerciseType } from '@/types'
import { distributeAcrossSets } from '@/lib/exercise-sets'
import {
  estimateRepDwellSeconds,
  formatSessionTimer,
  SET_REST_SECONDS,
} from '@/lib/exercise-accountability'
import { getEncouragingMessage } from '@/lib/encouragement'
import { useToast } from '@/components/ui/Toast'
import { useTranslation } from '@/i18n/context'

type Phase = 'intro' | 'plan' | 'setReady' | 'setActive' | 'setRest' | 'paused' | 'complete'

const ACTIVE_PHASES: Phase[] = ['setReady', 'setActive', 'setRest', 'paused']

export function ExerciseSessionPage() {
  const [searchParams] = useSearchParams()
  const rawType = searchParams.get('type')
  const invalidType = rawType != null && !isExerciseType(rawType)
  const type: ExerciseType = isExerciseType(rawType) ? rawType : 'pushups'
  const exercise = EXERCISES[type]
  const isTimer = isTimerExercise(type)

  const navigate = useNavigate()
  const { toast } = useToast()
  const { t } = useTranslation()
  const { completeExercise, getEarnedMinutes } = useStore()

  const [phase, setPhase] = useState<Phase>('intro')
  const [totalAmount, setTotalAmount] = useState(isTimer ? exercise.defaultTarget : exercise.defaultTarget * 3)
  const [setCount, setSetCount] = useState(0)
  const [setsTouched, setSetsTouched] = useState(false)
  const [currentSet, setCurrentSet] = useState(1)
  const [setPlan, setSetPlan] = useState<number[]>([])
  const [elapsed, setElapsed] = useState(0)
  const [restElapsed, setRestElapsed] = useState(0)
  const [encouragement, setEncouragement] = useState('')
  const [abandonOpen, setAbandonOpen] = useState(false)
  const startTimeRef = useRef<number>(0)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const restTimerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const exName = t(`exercises.${type}.name`)
  const howTo = t(`exercises.${type}.howTo`)
  const focusTip = t(`exercises.${type}.focus`)
  const currentSetTarget = setPlan[currentSet - 1] ?? 0
  const earned = getEarnedMinutes(type, totalAmount)
  const dwellTarget = isTimer ? currentSetTarget : estimateRepDwellSeconds(currentSetTarget)
  const remaining = Math.max(0, dwellTarget - elapsed)
  const canCompleteSet = phase === 'setActive' && remaining <= 0
  const restRemaining = Math.max(0, SET_REST_SECONDS - restElapsed)
  const canStartNextSet = restRemaining <= 0
  const midSession = ACTIVE_PHASES.includes(phase)

  const clearTimer = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current)
      timerRef.current = null
    }
  }

  const clearRestTimer = () => {
    if (restTimerRef.current) {
      clearInterval(restTimerRef.current)
      restTimerRef.current = null
    }
  }

  const startTimer = () => {
    clearTimer()
    timerRef.current = setInterval(() => {
      setElapsed((e) => e + 1)
    }, 1000)
  }

  const startRestTimer = () => {
    clearRestTimer()
    setRestElapsed(0)
    restTimerRef.current = setInterval(() => {
      setRestElapsed((e) => e + 1)
    }, 1000)
  }

  const setsValid = setCount >= 1 && setCount <= 20
  const setsError = setsTouched && !setsValid ? t('exercise.setsRequired') : undefined

  const beginWorkout = () => {
    setSetsTouched(true)
    if (!setsValid) return
    const plan = distributeAcrossSets(totalAmount, setCount)
    setSetPlan(plan)
    setCurrentSet(1)
    setElapsed(0)
    startTimeRef.current = Date.now()
    setPhase('setReady')
  }

  const startCurrentSet = () => {
    setElapsed(0)
    setPhase('setActive')
    startTimer()
  }

  const finishCurrentSet = useCallback(() => {
    clearTimer()
    if (currentSet >= setCount) {
      clearRestTimer()
      setPhase('complete')
      return
    }
    setPhase('setRest')
    startRestTimer()
  }, [currentSet, setCount])

  const startNextSet = () => {
    if (!canStartNextSet) return
    clearRestTimer()
    setCurrentSet((s) => s + 1)
    setElapsed(0)
    setPhase('setReady')
  }

  const pauseTimer = () => {
    clearTimer()
    setPhase('paused')
  }

  const resumeTimer = () => {
    setPhase('setActive')
    startTimer()
  }

  const handleComplete = () => {
    const duration = Math.round((Date.now() - startTimeRef.current) / 1000)
    const earnedMinutes = completeExercise(type, totalAmount, duration)
    toast(encouragement || getEncouragingMessage(earnedMinutes), 'success')
    navigate('/')
  }

  const requestLeave = () => {
    if (midSession) {
      setAbandonOpen(true)
      return
    }
    navigate(-1)
  }

  const confirmAbandon = () => {
    clearTimer()
    clearRestTimer()
    setAbandonOpen(false)
    navigate(-1)
  }

  useEffect(() => {
    if (phase === 'complete') {
      setEncouragement(getEncouragingMessage(earned))
    }
  }, [phase, earned])

  useEffect(() => {
    if (phase === 'setActive' && isTimer && currentSetTarget > 0 && elapsed >= currentSetTarget) {
      finishCurrentSet()
    }
  }, [elapsed, phase, isTimer, currentSetTarget, finishCurrentSet])

  useEffect(() => () => {
    clearTimer()
    clearRestTimer()
  }, [])

  useEffect(() => {
    if (invalidType) {
      toast(t('exercise.invalidType'), 'error')
      navigate('/exercise', { replace: true })
    }
  }, [invalidType, navigate, toast, t])

  if (invalidType) return null

  const unitLabel = isTimer ? t('exercise.seconds') : t('exercise.reps')

  return (
    <div className="min-h-dvh w-full max-w-full overflow-x-hidden bg-surface-0 noise flex flex-col safe-top safe-bottom">
      <div className="pointer-events-none fixed inset-0 overflow-hidden bg-surface-0">
        <div className={`absolute top-1/3 left-1/2 -translate-x-1/2 w-80 h-80 rounded-full blur-3xl opacity-20 bg-gradient-to-br ${exercise.gradient}`} />
      </div>

      <div className="relative z-10 flex items-center justify-between px-5 pt-4">
        <BackButton
          variant="close"
          onClick={requestLeave}
          aria-label={t('common.close')}
        />
        <span className="text-sm font-medium text-white/50">{exName}</span>
        <div className="w-12" />
      </div>

      <div className="relative z-10 flex-1 flex flex-col px-6 py-4 overflow-y-auto">
        <AnimatePresence mode="wait">
          {phase === 'intro' && (
            <motion.div key="intro" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="flex-1 flex flex-col">
              <ExerciseDemoVideo type={type} className="mb-6" />
              <h2 className="text-2xl font-bold mb-3">{exName}</h2>
              <p className="text-white/55 text-base leading-relaxed mb-4">{howTo}</p>
              <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 mb-4">
                <p className="text-xs font-semibold text-emerald-300 uppercase tracking-wider mb-1">{t('exercise.focusOn')}</p>
                <p className="text-sm text-white/70 leading-relaxed">{focusTip}</p>
              </div>
            </motion.div>
          )}

          {phase === 'plan' && (
            <motion.div key="plan" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="flex-1 flex flex-col justify-center max-w-sm mx-auto w-full">
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
                <div className="mt-6 p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/25 text-center">
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

          {phase === 'setReady' && (
            <motion.div key="ready" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="flex-1 flex flex-col items-center justify-center text-center">
              <p className="text-sm font-medium text-white/40 uppercase tracking-wider mb-2">
                {t('exercise.setOf', { current: currentSet, total: setCount })}
              </p>
              <p className="text-6xl font-bold tracking-tighter tabular-nums gradient-text mb-2">{currentSetTarget}</p>
              <p className="text-white/40 text-sm mb-6">{unitLabel}</p>
              <h2 className="text-2xl font-bold mb-2">{t('exercise.readyTitle')}</h2>
              <p className="text-white/45 text-sm max-w-xs leading-relaxed">{t('exercise.readyDesc')}</p>
            </motion.div>
          )}

          {(phase === 'setActive' || phase === 'paused') && (
            <motion.div key="active" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex-1 flex flex-col items-center justify-center text-center">
              <p className="text-sm font-medium text-white/40 uppercase tracking-wider mb-4">
                {t('exercise.setOf', { current: currentSet, total: setCount })}
              </p>
              {isTimer ? (
                <>
                  <CircularProgress value={elapsed} max={Math.max(1, currentSetTarget)} size={200} strokeWidth={8}>
                    <div className="text-center">
                      <p className="text-5xl font-bold tracking-tighter tabular-nums">
                        {formatSessionTimer(remaining)}
                      </p>
                    </div>
                  </CircularProgress>
                  <p className="text-white/40 text-sm mt-5 mb-1">{t('exercise.holdFor', { seconds: currentSetTarget })}</p>
                  <p className="text-white/30 text-xs">{t('exercise.holdCountdown')}</p>
                </>
              ) : (
                <>
                  <p className="text-7xl font-bold tracking-tighter tabular-nums gradient-text mb-2">{currentSetTarget}</p>
                  <p className="text-white/40 text-sm mb-5">{unitLabel}</p>
                  <div className="w-full max-w-xs mb-3">
                    <Progress value={elapsed} max={Math.max(1, dwellTarget)} size="md" />
                  </div>
                  <p className="text-white/35 text-xs max-w-xs leading-relaxed">
                    {canCompleteSet
                      ? t('exercise.confirmRepsDone')
                      : t('exercise.waitingToConfirm', { seconds: remaining })}
                  </p>
                </>
              )}
              <p className="text-white/25 text-xs mt-4">{focusTip}</p>
            </motion.div>
          )}

          {phase === 'setRest' && (
            <motion.div key="rest" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="flex-1 flex flex-col items-center justify-center text-center">
              <div className="w-16 h-16 rounded-full bg-cyan-500/15 flex items-center justify-center mb-5">
                <Droplets size={28} className="text-cyan-400" />
              </div>
              <h2 className="text-2xl font-bold mb-2">{t('exercise.restTitle')}</h2>
              <p className="text-5xl font-bold tracking-tighter tabular-nums mb-3">
                {formatSessionTimer(restRemaining)}
              </p>
              <p className="text-white/45 text-sm max-w-xs leading-relaxed">
                {canStartNextSet ? t('exercise.restReady') : t('exercise.restDesc')}
              </p>
            </motion.div>
          )}

          {phase === 'complete' && (
            <motion.div key="complete" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="flex-1 flex flex-col items-center justify-center text-center">
              <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-emerald-500/20 flex items-center justify-center">
                <Check size={40} className="text-emerald-400" />
              </div>
              <h2 className="text-2xl font-bold mb-3">{t('exercise.workoutComplete')}</h2>
              <p className="text-lg text-white/70 leading-relaxed max-w-xs">
                {encouragement || getEncouragingMessage(earned)}
              </p>
              <p className="text-sm text-white/35 mt-3">
                {isTimer
                  ? t('exercise.completedTotal', { amount: totalAmount, unit: unitLabel })
                  : t('exercise.completedReps', { count: totalAmount })}
              </p>
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
          <MotionButton fullWidth size="xl" disabled={!setsValid} onClick={beginWorkout}>
            {t('exercise.startExercise')}
          </MotionButton>
        )}
        {phase === 'setReady' && (
          <MotionButton fullWidth size="xl" onClick={startCurrentSet}>
            {isTimer ? t('exercise.startHold') : t('exercise.readyGo')}
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
            <MotionButton
              size="lg"
              className="flex-1"
              disabled={!canCompleteSet}
              onClick={finishCurrentSet}
            >
              {isTimer ? t('exercise.finishedSet') : t('exercise.confirmRepsDone')}
            </MotionButton>
          </div>
        )}
        {phase === 'setRest' && (
          <MotionButton fullWidth size="xl" disabled={!canStartNextSet} onClick={startNextSet}>
            {canStartNextSet
              ? t('exercise.startSet', { number: currentSet + 1 })
              : t('exercise.restCountdown', { seconds: restRemaining })}
          </MotionButton>
        )}
        {phase === 'complete' && (
          <MotionButton fullWidth size="xl" onClick={handleComplete}>
            {t('exercise.claimTime')}
          </MotionButton>
        )}
      </div>

      <Modal open={abandonOpen} onClose={() => setAbandonOpen(false)} title={t('exercise.abandonTitle')}>
        <p className="text-sm text-white/55 leading-relaxed mb-6">{t('exercise.abandonDesc')}</p>
        <div className="flex gap-3">
          <MotionButton variant="secondary" className="flex-1" onClick={() => setAbandonOpen(false)}>
            {t('exercise.abandonKeep')}
          </MotionButton>
          <MotionButton variant="danger" className="flex-1" onClick={confirmAbandon}>
            {t('exercise.abandonConfirm')}
          </MotionButton>
        </div>
      </Modal>
    </div>
  )
}
