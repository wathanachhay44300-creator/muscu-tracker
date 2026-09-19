import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '../db'
import { totalVolume } from '../lib/stats'
import type { Workout } from '../types'

export interface WorkoutSummary {
  workout: Workout
  exerciseCount: number
  setCount: number
  volume: number
  /** Program the session was started from, or 'Séance libre'. */
  title: string
}

/** All workouts, most recent first, with a light summary of each. */
export function useWorkoutHistory(): WorkoutSummary[] | undefined {
  return useLiveQuery(async () => {
    const workouts = await db.workouts.orderBy('date').reverse().toArray()
    workouts.sort((a, b) => (a.date === b.date ? b.createdAt - a.createdAt : 0))
    return Promise.all(
      workouts.map(async (workout) => {
        const links = await db.workoutExercises.where('workoutId').equals(workout.id!).toArray()
        let setCount = 0
        let volume = 0
        for (const link of links) {
          const sets = await db.sets.where('workoutExerciseId').equals(link.id!).toArray()
          setCount += sets.length
          volume += totalVolume(sets)
        }
        const template = workout.templateId ? await db.workoutTemplates.get(workout.templateId) : undefined
        const title = workout.title ?? template?.name ?? 'Séance libre'
        return { title, workout, exerciseCount: links.length, setCount, volume }
      }),
    )
  }, [])
}
