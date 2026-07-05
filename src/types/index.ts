export type ExerciseCategory = 'chest' | 'legs' | 'core' | 'cardio' | 'arms'

export type ExerciseType =
  | 'jumping_jacks'
  | 'high_knees'
  | 'squats'
  | 'lunges'
  | 'wall_sit'
  | 'calf_raises'
  | 'glute_bridges'
  | 'pushups'
  | 'diamond_pushups'
  | 'wide_pushups'
  | 'tricep_dips'
  | 'situps'
  | 'crunches'
  | 'plank'
  | 'leg_raises'
  | 'bicycle_crunches'
  | 'mountain_climbers'
  | 'burpees'
  | 'jump_squats'

export type ExerciseTier = 'standard' | 'high'
export type AppBrand =
  | 'instagram' | 'tiktok' | 'x' | 'facebook' | 'snapchat' | 'whatsapp'
  | 'discord' | 'reddit' | 'youtube' | 'netflix' | 'spotify' | 'twitch'
  | 'pinterest' | 'telegram' | 'linkedin' | 'roblox' | 'minecraft'
  | 'candy_crush' | 'gmail' | 'chrome' | 'amazon' | 'shein'

export interface ExerciseConfig {
  id: ExerciseType
  category: ExerciseCategory
  unit: 'reps' | 'seconds'
  earnRate: number
  tier: ExerciseTier
  color: string
  gradient: string
  defaultTarget: number
}

export interface LockedApp {
  id: string
  name: string
  icon: string
  brand?: AppBrand
  packageName?: string
  color: string
  dailyLimitMinutes: number
  usedMinutes: number
  isLocked: boolean
  unlockedUntil: number | null
}

export interface ExerciseSession {
  id: string
  type: ExerciseType
  amount: number
  earnedMinutes: number
  completedAt: number
  durationSeconds: number
  workoutPlanId?: string
}

export interface WorkoutPlanSession {
  id: string
  planId: string
  earnedMinutes: number
  bonusMinutes: number
  completedAt: number
  durationSeconds: number
}

export interface WorkoutPlan {
  id: string
  gradient: string
  bonusPercent: number
  exercises: { type: ExerciseType; target: number }[]
}

export type Locale = 'en' | 'nl' | 'de' | 'fr' | 'es'

export type Difficulty = 'easy' | 'medium' | 'hard' | 'unstoppable'

export interface UserProfile {
  name: string
  email?: string
  locale: Locale
  difficulty: Difficulty
  onboardingComplete: boolean
  isPro: boolean
  stripeCustomerId: string | null
  subscriptionId: string | null
  subscriptionStatus: 'active' | 'canceled' | 'past_due' | null
  notificationsEnabled: boolean
  createdAt: number
}

export interface AppState {
  profile: UserProfile
  screenTimeBalance: number
  totalEarnedMinutes: number
  totalExercises: number
  currentStreak: number
  longestStreak: number
  lastExerciseDate: string | null
  apps: LockedApp[]
  sessions: ExerciseSession[]
  workoutPlanSessions: WorkoutPlanSession[]
}

export const EXERCISE_CATEGORIES: ExerciseCategory[] = ['cardio', 'chest', 'legs', 'core', 'arms']

export const TIMER_EXERCISES: ExerciseType[] = ['plank', 'wall_sit', 'tricep_dips']

export function isTimerExercise(type: ExerciseType): boolean {
  return TIMER_EXERCISES.includes(type)
}

export const EXERCISES: Record<ExerciseType, ExerciseConfig> = {
  jumping_jacks: { id: 'jumping_jacks', category: 'cardio', unit: 'reps', earnRate: 0.6, tier: 'standard', color: '#F59E0B', gradient: 'from-amber-500 to-orange-500', defaultTarget: 25 },
  high_knees: { id: 'high_knees', category: 'cardio', unit: 'reps', earnRate: 0.7, tier: 'standard', color: '#F97316', gradient: 'from-orange-500 to-amber-500', defaultTarget: 30 },
  mountain_climbers: { id: 'mountain_climbers', category: 'cardio', unit: 'reps', earnRate: 1.8, tier: 'high', color: '#EF4444', gradient: 'from-orange-500 to-red-500', defaultTarget: 20 },
  burpees: { id: 'burpees', category: 'cardio', unit: 'reps', earnRate: 2.5, tier: 'high', color: '#DC2626', gradient: 'from-red-500 to-rose-600', defaultTarget: 8 },
  jump_squats: { id: 'jump_squats', category: 'cardio', unit: 'reps', earnRate: 1.6, tier: 'high', color: '#E11D48', gradient: 'from-rose-500 to-red-500', defaultTarget: 12 },
  pushups: { id: 'pushups', category: 'chest', unit: 'reps', earnRate: 1.5, tier: 'standard', color: '#5E6AD2', gradient: 'from-indigo-500 to-violet-600', defaultTarget: 10 },
  wide_pushups: { id: 'wide_pushups', category: 'chest', unit: 'reps', earnRate: 1.6, tier: 'standard', color: '#6366F1', gradient: 'from-indigo-500 to-blue-600', defaultTarget: 10 },
  diamond_pushups: { id: 'diamond_pushups', category: 'chest', unit: 'reps', earnRate: 1.9, tier: 'high', color: '#7C3AED', gradient: 'from-violet-500 to-purple-600', defaultTarget: 8 },
  squats: { id: 'squats', category: 'legs', unit: 'reps', earnRate: 1, tier: 'standard', color: '#8B5CF6', gradient: 'from-violet-500 to-purple-600', defaultTarget: 12 },
  lunges: { id: 'lunges', category: 'legs', unit: 'reps', earnRate: 1.4, tier: 'standard', color: '#EC4899', gradient: 'from-pink-500 to-rose-600', defaultTarget: 10 },
  calf_raises: { id: 'calf_raises', category: 'legs', unit: 'reps', earnRate: 0.8, tier: 'standard', color: '#A855F7', gradient: 'from-purple-500 to-violet-500', defaultTarget: 20 },
  glute_bridges: { id: 'glute_bridges', category: 'legs', unit: 'reps', earnRate: 1.1, tier: 'standard', color: '#D946EF', gradient: 'from-fuchsia-500 to-pink-500', defaultTarget: 15 },
  wall_sit: { id: 'wall_sit', category: 'legs', unit: 'seconds', earnRate: 0.45, tier: 'high', color: '#6366F1', gradient: 'from-indigo-500 to-blue-600', defaultTarget: 45 },
  plank: { id: 'plank', category: 'core', unit: 'seconds', earnRate: 0.33, tier: 'standard', color: '#06B6D4', gradient: 'from-cyan-500 to-blue-600', defaultTarget: 60 },
  situps: { id: 'situps', category: 'core', unit: 'reps', earnRate: 1.3, tier: 'standard', color: '#10B981', gradient: 'from-emerald-500 to-teal-600', defaultTarget: 15 },
  crunches: { id: 'crunches', category: 'core', unit: 'reps', earnRate: 1.0, tier: 'standard', color: '#14B8A6', gradient: 'from-teal-500 to-cyan-500', defaultTarget: 20 },
  leg_raises: { id: 'leg_raises', category: 'core', unit: 'reps', earnRate: 1.4, tier: 'standard', color: '#0D9488', gradient: 'from-teal-600 to-emerald-600', defaultTarget: 12 },
  bicycle_crunches: { id: 'bicycle_crunches', category: 'core', unit: 'reps', earnRate: 1.5, tier: 'high', color: '#059669', gradient: 'from-emerald-600 to-green-600', defaultTarget: 20 },
  tricep_dips: { id: 'tricep_dips', category: 'arms', unit: 'reps', earnRate: 1.7, tier: 'high', color: '#3B82F6', gradient: 'from-blue-500 to-indigo-600', defaultTarget: 10 },
}

export const WORKOUT_PLANS: WorkoutPlan[] = [
  {
    id: 'morning_boost',
    gradient: 'from-amber-500 to-orange-600',
    bonusPercent: 20,
    exercises: [
      { type: 'jumping_jacks', target: 25 },
      { type: 'squats', target: 10 },
      { type: 'pushups', target: 8 },
    ],
  },
  {
    id: 'leg_day',
    gradient: 'from-violet-500 to-purple-600',
    bonusPercent: 25,
    exercises: [
      { type: 'squats', target: 15 },
      { type: 'lunges', target: 12 },
      { type: 'wall_sit', target: 45 },
      { type: 'calf_raises', target: 20 },
    ],
  },
  {
    id: 'core_crusher',
    gradient: 'from-cyan-500 to-teal-600',
    bonusPercent: 25,
    exercises: [
      { type: 'plank', target: 45 },
      { type: 'crunches', target: 20 },
      { type: 'leg_raises', target: 12 },
      { type: 'bicycle_crunches', target: 16 },
    ],
  },
  {
    id: 'chest_arms',
    gradient: 'from-indigo-500 to-blue-600',
    bonusPercent: 22,
    exercises: [
      { type: 'pushups', target: 12 },
      { type: 'diamond_pushups', target: 6 },
      { type: 'tricep_dips', target: 10 },
    ],
  },
  {
    id: 'full_body_burn',
    gradient: 'from-red-500 to-rose-600',
    bonusPercent: 35,
    exercises: [
      { type: 'burpees', target: 6 },
      { type: 'mountain_climbers', target: 20 },
      { type: 'jump_squats', target: 10 },
      { type: 'pushups', target: 10 },
    ],
  },
]

export const DEFAULT_APPS: Omit<LockedApp, 'id'>[] = [
  {
    name: 'Instagram',
    icon: '',
    brand: 'instagram',
    packageName: 'com.instagram.android',
    color: '#E1306C',
    dailyLimitMinutes: 30,
    usedMinutes: 0,
    isLocked: true,
    unlockedUntil: null,
  },
  {
    name: 'TikTok',
    icon: '',
    brand: 'tiktok',
    packageName: 'com.zhiliaoapp.musically',
    color: '#000000',
    dailyLimitMinutes: 20,
    usedMinutes: 0,
    isLocked: true,
    unlockedUntil: null,
  },
  {
    name: 'Twitter / X',
    icon: '',
    brand: 'x',
    packageName: 'com.twitter.android',
    color: '#000000',
    dailyLimitMinutes: 15,
    usedMinutes: 0,
    isLocked: true,
    unlockedUntil: null,
  },
]

export const QUICK_START_EXERCISES: ExerciseType[] = ['pushups', 'squats', 'burpees', 'plank', 'jumping_jacks']

export const FREE_APP_LIMIT = 1
export const TRIAL_APP_LIMIT = 3
export const TRIAL_DAYS = 7
export const PRO_PRICE_MONTHLY = 7.99
export const PRO_CURRENCY = 'EUR'

export function getExercisesByCategory(category: ExerciseCategory): ExerciseType[] {
  return (Object.keys(EXERCISES) as ExerciseType[]).filter((id) => EXERCISES[id].category === category)
}
