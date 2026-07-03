import { useState, useEffect, useCallback, useRef } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Pause, Play, RotateCcw, Check } from 'lucide-react'
import { MotionButton } from '@/components/ui/Button'
import { useStore } from '@/store'
import { EXERCISES, isTimerExercise, type ExerciseType } from '@/types'
import { formatMinutes } from '@/lib/utils'
import { useToast } from '@/components/ui/Toast'
import { useTranslation } from '@/i18n/context'

type Phase = 'ready' | 'active' | 'paused' | 'complete'

export function ExerciseSessionPage() {
  const [searchParams] = useSearchParams()
  const type = (searchParams.get('type') as ExerciseType) || 'pushups'
  const exercise = EXERCISES[type]
  const isTimer = isTimerExercise(type)

  const navigate = useNavigate()
  const { toast } = useToast()
  const { t } = useTranslation()
  const { completeExercise, getEarnedMinutes } = useStore()

  const [phase, setPhase] = useState<Phase>('ready')
  const [count, setCount] = useState(0)
  const [elapsed, setElapsed] = useState(0)
  const target = exercise.defaultTarget
  const startTimeRef = useRef<number>(0)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const exName = t(`exercises.${type}.name`)
  const earned = getEarnedMinutes(type, isTimer ? elapsed : count)

  const startSession = () => {
    setPhase('active')
    startTimeRef.current = Date.now()
    if (isTimer) {
      timerRef.current = setInterval(() => setElapsed((e) => e + 1), 1000)
    }
  }

  const pauseSession = () => {
    setPhase('paused')
    if (timerRef.current) clearInterval(timerRef.current)
  }

  const resumeSession = () => {
    setPhase('active')
    if (isTimer) {
      timerRef.current = setInterval(() => setElapsed((e) => e + 1), 1000)
    }
  }

  const addRep = useCallback(() => {
    if (phase !== 'active') return
    setCount((c) => {
      const next = c + 1
      if (next >= target) setPhase('complete')
      return next
    })
    if (navigator.vibrate) navigator.vibrate(10)
  }, [phase, target])

  const finishTimer = () => {
    if (timerRef.current) clearInterval(timerRef.current)
    setPhase('complete')
  }

  const handleComplete = () => {
    const duration = Math.round((Date.now() - startTimeRef.current) / 1000)
    const amount = isTimer ? elapsed : count
    const earnedMinutes = completeExercise(type, amount, duration)
    toast(`+${formatMinutes(earnedMinutes)}`, 'success')
    navigate('/')
  }

  const reset = () => {
    setCount(0)
    setElapsed(0)
    setPhase('ready')
    if (timerRef.current) clearInterval(timerRef.current)
  }

  useEffect(() => () => { if (timerRef.current) clearInterval(timerRef.current) }, [])

  useEffect(() => {
    if (!isTimer && count >= target && phase === 'active') setPhase('complete')
  }, [count, target, phase, isTimer])

  const formatTimer = (seconds: number) => {
    const m = Math.floor(seconds / 60)
    const s = seconds % 60
    return `${m}:${s.toString().padStart(2, '0')}`
  }

  return (
    <div className="min-h-dvh bg-surface-0 noise flex flex-col safe-top safe-bottom">
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className={`absolute top-1/3 left-1/2 -translate-x-1/2 w-80 h-80 rounded-full blur-3xl opacity-20 bg-gradient-to-br ${exercise.gradient}`} />
      </div>

      <div className="relative z-10 flex items-center justify-between px-5 pt-4">
        <button onClick={() => navigate(-1)} className="p-2 -ml-2 rounded-xl hover:bg-white/5 text-white/40 hover:text-white transition-colors">
          <X size={22} />
        </button>
        <span className="text-sm font-medium text-white/50">{exName}</span>
        <div className="w-10" />
      </div>

      <div className="relative z-10 flex-1 flex flex-col items-center justify-center px-6">
        <AnimatePresence mode="wait">
          {phase === 'ready' && (
            <motion.div key="ready" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }} className="text-center">
              <div className={`w-24 h-24 mx-auto mb-6 rounded-3xl bg-gradient-to-br ${exercise.gradient} flex items-center justify-center text-4xl shadow-2xl`}>
                {exercise.icon}
              </div>
              <h2 className="text-2xl font-bold mb-2">{exName}</h2>
              <p className="text-white/40 mb-2">
                {isTimer ? t('exercise.holdAsLong') : t('exercise.completeReps', { count: target })}
              </p>
              <p className="text-indigo-400 text-sm">
                {t('exercise.targetEarn', { amount: formatMinutes(getEarnedMinutes(type, isTimer ? target : target)) })}
              </p>
            </motion.div>
          )}

          {(phase === 'active' || phase === 'paused') && (
            <motion.div key="active" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="text-center w-full">
              {isTimer ? (
                <>
                  <p className="text-7xl font-bold tracking-tighter tabular-nums mb-4">{formatTimer(elapsed)}</p>
                  <p className="text-white/40 text-sm mb-8">{t('exercise.earning', { amount: formatMinutes(earned) })}</p>
                </>
              ) : (
                <>
                  <p className="text-8xl font-bold tracking-tighter tabular-nums mb-2 gradient-text">{count}</p>
                  <p className="text-white/30 text-sm mb-8">
                    {t('exercise.ofReps', { target, amount: formatMinutes(earned) })}
                  </p>
                  <button
                    onClick={addRep}
                    className={`w-48 h-48 mx-auto rounded-full bg-gradient-to-br ${exercise.gradient} flex items-center justify-center text-white shadow-2xl shadow-indigo-500/30 active:scale-95 transition-transform`}
                  >
                    <div className="text-center">
                      <span className="text-3xl font-bold block">+1</span>
                      <span className="text-sm opacity-70">{t('common.tap')}</span>
                    </div>
                  </button>
                </>
              )}
            </motion.div>
          )}

          {phase === 'complete' && (
            <motion.div key="complete" initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} className="text-center">
              <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-emerald-500/20 flex items-center justify-center">
                <Check size={40} className="text-emerald-400" />
              </div>
              <h2 className="text-2xl font-bold mb-2">{t('exercise.workoutComplete')}</h2>
              <p className="text-4xl font-bold gradient-text mb-2">+{formatMinutes(earned)}</p>
              <p className="text-white/40 text-sm">{t('exercise.screenTimeEarned')}</p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div className="relative z-10 px-6 pb-6 space-y-3">
        {phase === 'ready' && (
          <MotionButton fullWidth size="xl" onClick={startSession}>{t('exercise.startWorkout')}</MotionButton>
        )}
        {(phase === 'active' || phase === 'paused') && (
          <div className="flex gap-3">
            {isTimer ? (
              <>
                <MotionButton variant="secondary" size="lg" className="flex-1" onClick={phase === 'paused' ? resumeSession : pauseSession}>
                  {phase === 'paused' ? <Play size={18} /> : <Pause size={18} />}
                  {phase === 'paused' ? t('exercise.resume') : t('exercise.pause')}
                </MotionButton>
                <MotionButton size="lg" className="flex-1" onClick={finishTimer}>{t('exercise.finish')}</MotionButton>
              </>
            ) : (
              <MotionButton variant="secondary" size="lg" fullWidth onClick={reset}>
                <RotateCcw size={16} />
                {t('exercise.reset')}
              </MotionButton>
            )}
          </div>
        )}
        {phase === 'complete' && (
          <MotionButton fullWidth size="xl" onClick={handleComplete}>
            {t('exercise.claim', { amount: formatMinutes(earned) })}
          </MotionButton>
        )}
      </div>
    </div>
  )
}
