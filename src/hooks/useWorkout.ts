import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '../db'
import type { Workout, WorkoutExerciseWithSets } from '../types'

export interface WorkoutDetail {
  workout: Workout
  exercises: WorkoutExerciseWithSets[]
}

/** Loads a workout with all its exercises and sets, live-updating on any change. */
export function useWorkoutDetail(workoutId: number | undefined): WorkoutDetail | undefined {
  return useLiveQuery(async () => {
    if (!workoutId) return undefined
    const workout = await db.workouts.get(workoutId)
    if (!workout) return undefined

    const links = await db.workoutExercises.where('workoutId').equals(workoutId).sortBy('order')
    const exercises: WorkoutExerciseWithSets[] = await Promise.all(
      links.map(async (link) => {
        const exercise = await db.exercises.get(link.exerciseId)
        const sets = await db.sets.where('workoutExerciseId').equals(link.id!).sortBy('order')
        return { ...link, exercise: exercise!, sets }
      }),
    )
    return { workout, exercises }
  }, [workoutId])
}

/** Finds the workout for a given date, if one already exists. */
export function useWorkoutIdForDate(date: string): number | undefined {
  const workout = useLiveQuery(() => db.workouts.where('date').equals(date).first(), [date])
  return workout?.id
}
