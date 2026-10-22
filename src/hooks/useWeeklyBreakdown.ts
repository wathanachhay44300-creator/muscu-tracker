import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '../db'
import { addDays } from '../lib/date'
import type { MuscleGroup } from '../types'

/** One entry per exercise-in-workout during the week, ready for countByMuscleGroup. */
export function useWeeklyMuscleBreakdown(
  weekStart: string,
): { muscleGroup: MuscleGroup | undefined; setCount: number }[] | undefined {
  const weekEnd = addDays(weekStart, 6)
  return useLiveQuery(async () => {
    const workouts = await db.workouts.where('date').between(weekStart, weekEnd, true, true).toArray()
    const items: { muscleGroup: MuscleGroup | undefined; setCount: number }[] = []
    for (const workout of workouts) {
      const links = await db.workoutExercises.where('workoutId').equals(workout.id!).toArray()
      for (const link of links) {
        const exercise = await db.exercises.get(link.exerciseId)
        const setCount = await db.sets.where('workoutExerciseId').equals(link.id!).count()
        items.push({ muscleGroup: exercise?.muscleGroup, setCount })
      }
    }
    return items
  }, [weekStart, weekEnd])
}
