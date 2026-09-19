import { db } from '../db'
import type { SetEntry } from '../types'
import { setVolume } from './stats'

export interface LastPerformance {
  date: string
  sets: SetEntry[]
  /** Note left on this exercise during that session, if any. */
  note?: string
}

/**
 * The most recent *other* session that logged this exercise. Returns `null`
 * when there is no earlier session. Shared between the live "last time"
 * comparison hook and the template-based quick-start (which uses it to
 * suggest weights for pre-filled sets).
 *
 * `beforeDate`, when given, restricts candidates to sessions strictly before
 * that date — used when comparing a specific (possibly past) session against
 * whatever came before it, rather than just "the most recent other one".
 */
export async function getLastPerformance(
  exerciseId: number,
  excludeWorkoutId?: number,
  beforeDate?: string,
): Promise<LastPerformance | null> {
  const links = await db.workoutExercises.where('exerciseId').equals(exerciseId).toArray()
  const candidates = excludeWorkoutId ? links.filter((l) => l.workoutId !== excludeWorkoutId) : links

  let best: LastPerformance | null = null
  for (const link of candidates) {
    const workout = await db.workouts.get(link.workoutId)
    if (!workout) continue
    if (beforeDate && workout.date >= beforeDate) continue
    const sets = await db.sets.where('workoutExerciseId').equals(link.id!).sortBy('order')
    // Skip sessions with no sets, and ones that were started (e.g. from a
    // template) but never actually filled in — they'd otherwise mask real
    // history with a run of 0kg × 0 reps.
    const hasData = sets.some((s) => s.weight > 0 || s.reps > 0)
    if (!hasData) continue
    if (!best || workout.date > best.date) {
      best = { date: workout.date, sets, note: link.note?.trim() ? link.note : undefined }
    }
  }
  return best
}

export interface PersonalRecords {
  /** Heaviest weight ever logged for a single set of this exercise. */
  bestWeight: number
  /** Highest single-set volume (weight × reps) ever logged for this exercise. */
  bestVolume: number
}

/** All-time bests for one exercise, across every session that ever used it. */
export async function getPersonalRecords(exerciseId: number): Promise<PersonalRecords> {
  const links = await db.workoutExercises.where('exerciseId').equals(exerciseId).toArray()
  let bestWeight = 0
  let bestVolume = 0
  for (const link of links) {
    const sets = await db.sets.where('workoutExerciseId').equals(link.id!).toArray()
    for (const s of sets) {
      if (s.weight > bestWeight) bestWeight = s.weight
      const vol = setVolume(s)
      if (vol > bestVolume) bestVolume = vol
    }
  }
  return { bestWeight, bestVolume }
}
