import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '../db'
import type { Workout } from '../types'

export interface WorkoutSummary {
  workout: Workout
  exerciseCount: number
  setCount: number
}

/** All workouts, most recent first, with a light summary of each. */
export function useWorkoutHistory(): WorkoutSummary[] | undefined {
  return useLiveQuery(async () => {
    const workouts = await db.workouts.orderBy('date').reverse().toArray()
    return Promise.all(
      workouts.map(async (workout) => {
        const links = await db.workoutExercises.where('workoutId').equals(workout.id!).toArray()
        let setCount = 0
        for (const link of links) {
          setCount += await db.sets.where('workoutExerciseId').equals(link.id!).count()
        }
        return { workout, exerciseCount: links.length, setCount }
      }),
    )
  }, [])
}
