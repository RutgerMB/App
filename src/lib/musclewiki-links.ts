import type { ExerciseType } from '@/types'

const M = '?model=m'
const BASE = 'https://musclewiki.com/exercise'

/** MuscleWiki demo page per exercise (male model). Add URLs as they are provided. */
export const MUSCLEWIKI_LINKS: Record<ExerciseType, string> = {
  // Cardio
  jumping_jacks: `${BASE}/cardio-jumping-jacks${M}`,
  high_knees: `${BASE}/cardio-knee-taps${M}`,
  mountain_climbers: `${BASE}/mountain-climber${M}`,
  burpees: `${BASE}/burpee${M}`,
  jump_squats: `${BASE}/jump-squats${M}`,
  // Chest
  pushups: `${BASE}/push-up${M}`,
  wide_pushups: `${BASE}/push-up${M}`,
  diamond_pushups: `${BASE}/diamond-push-ups${M}`,
  tricep_dips: `${BASE}/bench-dips${M}`,
  // Legs
  squats: `${BASE}/heels-up-squat${M}`,
  lunges: `${BASE}/forward-lunges${M}`,
  wall_sit: `${BASE}/wall-sit${M}`,
  calf_raises: `${BASE}/calf-raises${M}`,
  glute_bridges: `${BASE}/glute-bridge${M}`,
  // Core
  plank: `${BASE}/forearm-plank${M}`,
  situps: `${BASE}/bodyweight-situp${M}`,
  crunches: `${BASE}/crunches${M}`,
  leg_raises: `${BASE}/laying-leg-raises${M}`,
  bicycle_crunches: `${BASE}/bicycle-crunch${M}`,
}

export function getMuscleWikiLink(type: ExerciseType): string {
  return MUSCLEWIKI_LINKS[type]
}
