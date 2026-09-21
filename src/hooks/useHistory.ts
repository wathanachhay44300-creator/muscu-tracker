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
    const linkCount = new Map<number, number>()
    const workoutOfLink = new Map<number, number>()
    for (const link of links) {
      linkCount.set(link.workoutId, (linkCount.get(link.workoutId) ?? 0) + 1)
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
        exerciseCount: linkCount.get(workout.id!) ?? 0,
        setCount: wSets.length,
        volume: totalVolume(wSets),
      }
    })
  }, [])
}
