import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '../db'
import type { SetEntry } from '../types'

export interface LastPerformance {
  date: string
  sets: SetEntry[]
}

/**
 * The most recent *other* session that logged this exercise, so it can be
 * shown for comparison while filling in today's sets. Returns `null` when
 * there is no earlier session (as opposed to `undefined`, which means the
 * query hasn't resolved yet).
 */
export function useLastPerformance(
  exerciseId: number | undefined,
  excludeWorkoutId: number | undefined,
): LastPerformance | null | undefined {
  return useLiveQuery(async () => {
    if (!exerciseId) return undefined
    const links = await db.workoutExercises.where('exerciseId').equals(exerciseId).toArray()
    const candidates = links.filter((l) => l.workoutId !== excludeWorkoutId)

    let best: { date: string; sets: SetEntry[] } | null = null
    for (const link of candidates) {
      const workout = await db.workouts.get(link.workoutId)
      if (!workout) continue
      const sets = await db.sets.where('workoutExerciseId').equals(link.id!).sortBy('order')
      if (sets.length === 0) continue
      if (!best || workout.date > best.date) {
        best = { date: workout.date, sets }
      }
    }
    return best
  }, [exerciseId, excludeWorkoutId])
}
