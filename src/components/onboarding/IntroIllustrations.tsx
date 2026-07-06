import { motion } from 'framer-motion'
import { Clock, Hourglass, Dumbbell, TrendingDown } from 'lucide-react'
import { AppBrandIcon } from '@/components/AppBrandIcon'
import type { AppBrand } from '@/types'

/** Slide 1: Blocked apps with timer card (AppBlock-style) */
export function BlockAppsIllustration() {
  const apps: { brand: AppBrand; rotate: string }[] = [
    { brand: 'instagram', rotate: '-12deg' },
    { brand: 'youtube', rotate: '6deg' },
    { brand: 'tiktok', rotate: '-4deg' },
  ]

  return (
    <div className="relative w-full max-w-[280px] mx-auto h-[220px]">
      {apps.map((app, i) => (
        <motion.div
          key={app.brand}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 + i * 0.08 }}
          className="absolute"
          style={{
            left: `${18 + i * 28}%`,
            top: `${8 + (i % 2) * 12}%`,
            transform: `rotate(${app.rotate})`,
          }}
        >
          <AppBrandIcon brand={app.brand} size="lg" className="w-16 h-16 shadow-xl" />
          <div className="absolute -top-1.5 -right-1.5 w-6 h-6 rounded-full bg-white shadow flex items-center justify-center">
            <Hourglass size={12} className="text-slate-700" />
          </div>
        </motion.div>
      ))}

      <motion.div
        initial={{ opacity: 0, scale: 0.92, y: 16 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ delay: 0.35, duration: 0.5 }}
        className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[92%] rounded-2xl bg-gradient-to-br from-indigo-950 to-violet-950 border border-indigo-500/20 p-4 shadow-2xl text-white"
      >
        <div className="flex items-center gap-2 mb-2">
          <Clock size={16} className="opacity-80" />
          <span className="text-xs opacity-80">Blocked until</span>
        </div>
        <p className="text-2xl font-bold mb-3">15:30</p>
        <div className="h-1.5 rounded-full bg-white/20 overflow-hidden">
          <div className="h-full w-[62%] rounded-full bg-white" />
        </div>
        <div className="flex justify-between text-[10px] opacity-60 mt-1.5">
          <span>08:30</span>
          <span>15:30</span>
        </div>
      </motion.div>
    </div>
  )
}

/** Slide 2: Earn screen time through workouts */
export function EarnWorkoutIllustration() {
  return (
    <div className="relative w-full max-w-[280px] mx-auto h-[220px] flex items-center justify-center">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-32 h-32 rounded-[2rem] bg-gradient-to-br from-indigo-500 to-violet-600 shadow-2xl shadow-indigo-500/40 flex items-center justify-center"
      >
        <Dumbbell size={48} className="text-white" strokeWidth={1.75} />
      </motion.div>

      <motion.div
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.2 }}
        className="absolute right-0 top-8 bg-white rounded-2xl px-4 py-3 shadow-xl"
      >
        <p className="text-xs text-slate-500 font-medium">Earned</p>
        <p className="text-xl font-bold text-emerald-500">+25 min</p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.3 }}
        className="absolute left-0 bottom-10 bg-white/95 rounded-2xl px-3 py-2 shadow-lg flex items-center gap-2"
      >
        <span className="text-lg">🔥</span>
        <div>
          <p className="text-[10px] text-slate-500">Streak</p>
          <p className="text-sm font-bold text-slate-900">7 days</p>
        </div>
      </motion.div>
    </div>
  )
}

/** Slide 3: Progress / screen time going down */
export function ProgressIllustration() {
  const bars = [72, 58, 48, 38, 28, 22]

  return (
    <div className="relative w-full max-w-[280px] mx-auto h-[220px]">
      <div className="absolute inset-x-4 bottom-8 top-12 flex items-end justify-between gap-2">
        {bars.map((h, i) => (
          <motion.div
            key={i}
            initial={{ height: 0 }}
            animate={{ height: `${h}%` }}
            transition={{ delay: 0.1 + i * 0.06, duration: 0.5 }}
            className="flex-1 rounded-t-lg bg-white/25 min-h-[20%]"
          />
        ))}
      </div>

      <svg className="absolute inset-x-2 bottom-8 top-12 w-[calc(100%-1rem)] h-[calc(100%-4rem)]" viewBox="0 0 240 120" preserveAspectRatio="none">
        <motion.path
          d="M0,90 Q40,70 80,55 T160,35 T240,20"
          fill="none"
          stroke="#22C55E"
          strokeWidth="4"
          strokeLinecap="round"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ delay: 0.4, duration: 0.8 }}
        />
      </svg>

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.55 }}
        className="absolute top-6 left-1/2 -translate-x-1/2 bg-white rounded-full px-4 py-2 shadow-xl flex items-center gap-2"
      >
        <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center">
          <TrendingDown size={16} className="text-emerald-600" />
        </div>
        <span className="text-sm font-bold text-emerald-600">-3h 12m</span>
      </motion.div>
    </div>
  )
}
