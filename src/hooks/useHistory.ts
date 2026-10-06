import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '../db'
import { totalVolume } from '../lib/stats'
import type { SetEntry, Workout } from '../types'

export interface WorkoutSummary {
  workout: Workout
  exerciseCount: number
  setCount: number
  volume: number
  /** Program the session was started from, or 'Séance libre'. */
  title: string
  /** Exercises done in the session, for the history's exercise filter. */
  exerciseIds: number[]
}

/** All workouts, most recent first, with a light summary of each. */
export function useWorkoutHistory(): WorkoutSummary[] | undefined {
  return useLiveQuery(async () => {
    const workouts = await db.workouts.orderBy('date').reverse().toArray()
    workouts.sort((a, b) => (a.date === b.date ? b.createdAt - a.createdAt : 0))
    // Three bulk reads grouped in memory, instead of 2+ queries per session.
    const [links, sets, templates] = await Promise.all([
      db.workoutExercises.toArray(),
      db.sets.toArray(),
      db.workoutTemplates.toArray(),
    ])
    const exercisesByWorkout = new Map<number, number[]>()
    const workoutOfLink = new Map<number, number>()
    for (const link of links) {
      const ids = exercisesByWorkout.get(link.workoutId)
      if (ids) ids.push(link.exerciseId)
      else exercisesByWorkout.set(link.workoutId, [link.exerciseId])
      workoutOfLink.set(link.id!, link.workoutId)
    }
    const setsByWorkout = new Map<number, SetEntry[]>()
    for (const s of sets) {
      const wid = workoutOfLink.get(s.workoutExerciseId)
      if (wid == null) continue
      const list = setsByWorkout.get(wid)
      if (list) list.push(s)
      else setsByWorkout.set(wid, [s])
    }
    const templateName = new Map(templates.map((t) => [t.id!, t.name]))
    return workouts.map((workout) => {
      const wSets = setsByWorkout.get(workout.id!) ?? []
      const template = workout.templateId ? templateName.get(workout.templateId) : undefined
      return {
        title: workout.title ?? template ?? 'Séance libre',
        workout,
        exerciseIds: exercisesByWorkout.get(workout.id!) ?? [],
        exerciseCount: exercisesByWorkout.get(workout.id!)?.length ?? 0,
        setCount: wSets.length,
        volume: totalVolume(wSets),
      }
    })
  }, [])
}
