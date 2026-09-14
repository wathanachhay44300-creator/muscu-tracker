import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '../db'
import type { Exercise, SetEntry, Workout } from '../types'

export interface ExerciseHistoryEntry {
  workout: Workout
  sets: SetEntry[]
}

export interface ExerciseHistory {
  exercise: Exercise
  entries: ExerciseHistoryEntry[]
}

/** All logged sessions for one exercise, most recent first. */
export function useExerciseHistory(exerciseId: number | undefined): ExerciseHistory | undefined {
  return useLiveQuery(async () => {
    if (!exerciseId) return undefined
    const exercise = await db.exercises.get(exerciseId)
    if (!exercise) return undefined

    const links = await db.workoutExercises.where('exerciseId').equals(exerciseId).toArray()
    const entries: ExerciseHistoryEntry[] = []
    for (const link of links) {
      const workout = await db.workouts.get(link.workoutId)
      if (!workout) continue
      const sets = await db.sets.where('workoutExerciseId').equals(link.id!).sortBy('order')
      if (sets.length === 0) continue
      entries.push({ workout, sets })
    }
    entries.sort((a, b) => (a.workout.date < b.workout.date ? 1 : -1))
    return { exercise, entries }
  }, [exerciseId])
}
