import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '../db'
import { addDays, mondayOf, todayISO } from '../lib/date'
import { getLatestRecord, type LatestRecord } from '../lib/performance'

export interface HomeStats {
  /** The 7 days of the current week (Mon → Sun) and whether each was trained. */
  week: { date: string; trained: boolean }[]
  sessionsThisWeek: number
  setsThisWeek: number
  /** Mean of the weigh-ins of the last 7 days, or null without any. */
  weightAvg7: number | null
  latestRecord: (LatestRecord & { exerciseName: string }) | null
}

export function useHomeStats(): HomeStats | undefined {
  return useLiveQuery(async () => {
    const today = todayISO()
    const monday = mondayOf(today)
    const sunday = addDays(monday, 6)
    const workouts = await db.workouts.where('date').between(monday, sunday, true, true).toArray()
    const links = workouts.length
      ? await db.workoutExercises.where('workoutId').anyOf(workouts.map((w) => w.id!)).toArray()
      : []
    const sets = links.length ? await db.sets.where('workoutExerciseId').anyOf(links.map((l) => l.id!)).toArray() : []
    const workoutOfLink = new Map(links.map((l) => [l.id!, l.workoutId]))
    const dateOfWorkout = new Map(workouts.map((w) => [w.id!, w.date]))
    // A day counts as trained once at least one set was logged on it.
    const trainedWorkouts = new Set(sets.map((s) => workoutOfLink.get(s.workoutExerciseId)))
    const trainedDates = new Set([...trainedWorkouts].map((id) => (id != null ? dateOfWorkout.get(id) : undefined)))

    const weighIns = await db.bodyMeasurements.where('date').between(addDays(today, -6), today, true, true).toArray()
    const weights = weighIns.map((m) => m.weight).filter((w): w is number => w != null)

    const record = await getLatestRecord()
    const recordExercise = record ? await db.exercises.get(record.exerciseId) : undefined

    return {
      week: Array.from({ length: 7 }, (_, i) => {
        const date = addDays(monday, i)
        return { date, trained: trainedDates.has(date) }
      }),
      sessionsThisWeek: trainedWorkouts.size,
      setsThisWeek: sets.length,
      weightAvg7: weights.length ? weights.reduce((a, b) => a + b, 0) / weights.length : null,
      latestRecord: record && recordExercise ? { ...record, exerciseName: recordExercise.name } : null,
    }
  }, [])
}
