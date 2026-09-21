import { useRef } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '../db'
import { getWorkoutForDate } from '../lib/workoutActions'
import type { Workout, WorkoutExerciseWithSets } from '../types'

export interface WorkoutDetail {
  workout: Workout
  exercises: WorkoutExerciseWithSets[]
}

/** Loads a workout with all its exercises and sets, live-updating on any change. */
export function useWorkoutDetail(workoutId: number | undefined): WorkoutDetail | undefined {
  // Every query run builds fresh objects; reusing the previous ones when their
  // content is unchanged lets memoized exercise cards skip re-rendering when
  // only a sibling exercise was edited.
  const previous = useRef<WorkoutDetail | undefined>(undefined)

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
    const prev = previous.current?.workout.id === workoutId ? previous.current : undefined
    const prevById = new Map(prev?.exercises.map((we) => [we.id!, we]))
    const stable = exercises.map((we) => {
      const old = prevById.get(we.id!)
      return old && JSON.stringify(old) === JSON.stringify(we) ? old : we
    })
    const detail = { workout, exercises: stable }
    previous.current = detail
    return detail
  }, [workoutId])
}

/** Finds the workout for a given date, if one already exists. */
export function useWorkoutIdForDate(date: string): number | undefined {
  const workout = useLiveQuery(() => getWorkoutForDate(date), [date])
  return workout?.id
}
