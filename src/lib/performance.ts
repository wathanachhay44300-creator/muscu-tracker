import { db } from '../db'
import type { SetEntry } from '../types'

export interface LastPerformance {
  date: string
  sets: SetEntry[]
}

/**
 * The most recent *other* session that logged this exercise. Returns `null`
 * when there is no earlier session. Shared between the live "last time"
 * comparison hook and the template-based quick-start (which uses it to
 * suggest weights for pre-filled sets).
 */
export async function getLastPerformance(
  exerciseId: number,
  excludeWorkoutId?: number,
): Promise<LastPerformance | null> {
  const links = await db.workoutExercises.where('exerciseId').equals(exerciseId).toArray()
  const candidates = excludeWorkoutId ? links.filter((l) => l.workoutId !== excludeWorkoutId) : links

  let best: LastPerformance | null = null
  for (const link of candidates) {
    const workout = await db.workouts.get(link.workoutId)
    if (!workout) continue
    const sets = await db.sets.where('workoutExerciseId').equals(link.id!).sortBy('order')
    // Skip sessions with no sets, and ones that were started (e.g. from a
    // template) but never actually filled in — they'd otherwise mask real
    // history with a run of 0kg × 0 reps.
    const hasData = sets.some((s) => s.weight > 0 || s.reps > 0)
    if (!hasData) continue
    if (!best || workout.date > best.date) {
      best = { date: workout.date, sets }
    }
  }
  return best
}
