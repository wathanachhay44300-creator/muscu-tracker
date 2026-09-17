import { db } from '../db'
import { addWeeks, mondayOf, todayISO } from './date'

export interface WorkoutDate {
  id: number
  date: string
}

/** Every workout's date and id, oldest first — cheap since it only reads the `workouts` table. */
export async function getAllWorkoutDates(): Promise<WorkoutDate[]> {
  const workouts = await db.workouts.orderBy('date').toArray()
  return workouts.filter((w): w is typeof w & { id: number } => w.id != null).map((w) => ({ id: w.id, date: w.date }))
}

/**
 * Number of consecutive weeks (Monday-Sunday), counting back from the
 * current one, with at least one session each. The current week doesn't
 * break the streak just for being incomplete — it's simply skipped over if
 * it has no session yet, so training today doesn't retroactively erase a
 * streak that's still "in progress".
 */
export function computeWeeklyStreak(dates: string[]): number {
  const weeksWithWorkout = new Set(dates.map((d) => mondayOf(d)))
  let cursor = mondayOf(todayISO())
  if (!weeksWithWorkout.has(cursor)) cursor = addWeeks(cursor, -1)

  let streak = 0
  while (weeksWithWorkout.has(cursor)) {
    streak++
    cursor = addWeeks(cursor, -1)
  }
  return streak
}
