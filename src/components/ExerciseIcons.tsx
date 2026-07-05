import {
  Activity,
  ArrowBigUp,
  ArrowDown,
  ArrowDownToLine,
  ArrowUp,
  ArrowUpCircle,
  ArrowUpFromLine,
  Bike,
  ChevronsDown,
  Diamond,
  Dumbbell,
  Expand,
  Flame,
  Footprints,
  FoldVertical,
  Grip,
  Maximize2,
  Mountain,
  MoveDiagonal2,
  PanelLeft,
  RectangleHorizontal,
  RotateCw,
  Sunrise,
  Target,
  TrendingUp,
  Zap,
  type LucideIcon,
} from 'lucide-react'
import type { ExerciseCategory, ExerciseType } from '@/types'

export const CATEGORY_ICONS: Record<ExerciseCategory, LucideIcon> = {
  cardio: Activity,
  chest: Maximize2,
  legs: Footprints,
  core: Target,
  arms: Grip,
}

export const EXERCISE_ICONS: Record<ExerciseType, LucideIcon> = {
  jumping_jacks: Expand,
  high_knees: ArrowUp,
  mountain_climbers: Mountain,
  burpees: Zap,
  jump_squats: ArrowUpCircle,
  pushups: ArrowDown,
  wide_pushups: Maximize2,
  diamond_pushups: Diamond,
  squats: ChevronsDown,
  lunges: MoveDiagonal2,
  calf_raises: ArrowUpFromLine,
  glute_bridges: TrendingUp,
  wall_sit: PanelLeft,
  plank: RectangleHorizontal,
  situps: RotateCw,
  crunches: FoldVertical,
  leg_raises: ArrowBigUp,
  bicycle_crunches: Bike,
  tricep_dips: ArrowDownToLine,
}

export const WORKOUT_PLAN_ICONS: Record<string, LucideIcon> = {
  morning_boost: Sunrise,
  leg_day: Footprints,
  core_crusher: Target,
  chest_arms: Dumbbell,
  full_body_burn: Flame,
}

interface IconProps {
  size?: number
  className?: string
  strokeWidth?: number
}

export function CategoryIcon({
  category,
  size = 22,
  className,
  strokeWidth = 2,
}: IconProps & { category: ExerciseCategory }) {
  const Icon = CATEGORY_ICONS[category]
  return <Icon size={size} className={className} strokeWidth={strokeWidth} />
}

export function ExerciseIcon({
  type,
  size = 20,
  className,
  strokeWidth = 2,
}: IconProps & { type: ExerciseType }) {
  const Icon = EXERCISE_ICONS[type]
  return <Icon size={size} className={className} strokeWidth={strokeWidth} />
}

export function WorkoutPlanIcon({
  planId,
  size = 22,
  className,
  strokeWidth = 2,
}: IconProps & { planId: string }) {
  const Icon = WORKOUT_PLAN_ICONS[planId] ?? Dumbbell
  return <Icon size={size} className={className} strokeWidth={strokeWidth} />
}
