import type { Difficulty, ExerciseType } from '@/types'
import { EXERCISES } from '@/types'

/** Global scale — base rates were too generous; this tunes earn to ~25–35 min per full workout. */
export const BASE_EARN_SCALE = 0.28

export const DIFFICULTY_MULTIPLIERS: Record<Difficulty, number> = {
  easy: 1.35,
  medium: 1,
  hard: 0.72,
  unstoppable: 0.5,
}

export const DIFFICULTIES: Difficulty[] = ['easy', 'medium', 'hard', 'unstoppable']

export const FREE_DIFFICULTY: Difficulty = 'medium'

export function isProDifficulty(difficulty: Difficulty): boolean {
  return difficulty !== FREE_DIFFICULTY
}

export function getDifficultyMultiplier(difficulty: Difficulty): number {
  return DIFFICULTY_MULTIPLIERS[difficulty]
}

export function computeEarnedMinutes(
  type: ExerciseType,
  amount: number,
  difficulty: Difficulty = 'medium'
): number {
  const config = EXERCISES[type]
  const raw = config.earnRate * amount * BASE_EARN_SCALE * getDifficultyMultiplier(difficulty)
  return Math.round(raw * 10) / 10
}
