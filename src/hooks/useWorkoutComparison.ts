import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '../db'
import { getLastPerformance, getPersonalRecords, type LastPerformance } from '../lib/performance'
import { setVolume } from '../lib/stats'

export interface SetComparison {
  weight: number
  reps: number
  previousWeight: number | null
  previousReps: number | null
  isPR: boolean
}

export interface ExerciseComparison {
  previous: LastPerformance | null
  sets: SetComparison[]
}

export interface WorkoutComparison {
  byWorkoutExerciseId: Map<number, ExerciseComparison>
  prExerciseNames: string[]
}

/**
 * Per-exercise, per-set comparison against the last time each exercise was
 * performed *before* this workout's date — powers the end-of-session
 * summary. Keyed by workoutExerciseId so it can be joined against
 * `useWorkoutDetail`'s exercise list in the UI.
 */
export function useWorkoutComparison(workoutId: number | undefined): WorkoutComparison | undefined {
  return useLiveQuery(async () => {
    if (!workoutId) return undefined
    const workout = await db.workouts.get(workoutId)
    if (!workout) return undefined

    const links = await db.workoutExercises.where('workoutId').equals(workoutId).sortBy('order')
    const byWorkoutExerciseId = new Map<number, ExerciseComparison>()
    const prExerciseNames: string[] = []

    for (const link of links) {
      const [exercise, sets, previous, records] = await Promise.all([
        db.exercises.get(link.exerciseId),
        db.sets.where('workoutExerciseId').equals(link.id!).sortBy('order'),
        getLastPerformance(link.exerciseId, workoutId, workout.date),
        getPersonalRecords(link.exerciseId),
      ])

      let exerciseHasPR = false
      const setComparisons: SetComparison[] = sets.map((s, i) => {
        const prevSet = previous?.sets[i]
        const isPR =
          (records.bestWeight > 0 && s.weight === records.bestWeight) ||
          (records.bestVolume > 0 && setVolume(s) === records.bestVolume)
        if (isPR) exerciseHasPR = true
        return {
          weight: s.weight,
          reps: s.reps,
          previousWeight: prevSet?.weight ?? null,
          previousReps: prevSet?.reps ?? null,
          isPR,
        }
      })

      if (exerciseHasPR && exercise) prExerciseNames.push(exercise.name)
      byWorkoutExerciseId.set(link.id!, { previous, sets: setComparisons })
    }

    return { byWorkoutExerciseId, prExerciseNames }
  }, [workoutId])
}
