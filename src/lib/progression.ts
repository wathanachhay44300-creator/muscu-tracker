import type { LastPerformance } from './performance'

export const DEFAULT_PROGRESSION_STEP = 2.5

export interface ProgressionSuggestion {
  weight: number
  reps: number
  step: number
}

function round2(n: number): number {
  return Math.round(n * 100) / 100
}

/**
 * Suggests a small weight bump when last time's sets for this exercise all
 * hit at least the first set's rep count — a simple proxy for "the target
 * was met every set, no fatigue drop-off", which is when progressive
 * overload makes sense. Returns null with no history, no reps logged, or a
 * decline across sets (suggesting the current weight is already the right
 * challenge).
 */
export function getSuggestedProgression(
  lastPerf: LastPerformance | null | undefined,
): ProgressionSuggestion | null {
  if (!lastPerf || lastPerf.sets.length === 0) return null
  const sets = lastPerf.sets
  const firstReps = sets[0].reps
  if (firstReps <= 0) return null
  const metTargetThroughout = sets.every((s) => s.reps >= firstReps)
  if (!metTargetThroughout) return null

  const lastSet = sets[sets.length - 1]
  if (lastSet.weight <= 0) return null
  return { weight: round2(lastSet.weight + DEFAULT_PROGRESSION_STEP), reps: lastSet.reps, step: DEFAULT_PROGRESSION_STEP }
}
