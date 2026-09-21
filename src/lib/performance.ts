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

  // Bulk reads (3 queries total) rather than one per past session.
  const workouts = await db.workouts.bulkGet(candidates.map((l) => l.workoutId))
  const allSets = await db.sets.where('workoutExerciseId').anyOf(candidates.map((l) => l.id!)).toArray()
  const setsByLink = new Map<number, SetEntry[]>()
  for (const s of allSets) {
    const list = setsByLink.get(s.workoutExerciseId)
    if (list) list.push(s)
    else setsByLink.set(s.workoutExerciseId, [s])
  }

  let best: LastPerformance | null = null
  candidates.forEach((link, i) => {
    const workout = workouts[i]
    if (!workout) return
    if (beforeDate && workout.date >= beforeDate) return
    const sets = (setsByLink.get(link.id!) ?? []).sort((a, b) => a.order - b.order)
    // Skip sessions with no sets, and ones that were started (e.g. from a
    // template) but never actually filled in — they'd otherwise mask real
    // history with a run of 0kg × 0 reps.
    const hasData = sets.some((s) => s.weight > 0 || s.reps > 0)
    if (!hasData) return
    if (!best || workout.date > best.date) {
      best = { date: workout.date, sets, note: link.note?.trim() ? link.note : undefined }
    }
  })
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
  const sets = await db.sets.where('workoutExerciseId').anyOf(links.map((l) => l.id!)).toArray()
  let bestWeight = 0
  let bestVolume = 0
  for (const s of sets) {
    if (s.weight > bestWeight) bestWeight = s.weight
    const vol = setVolume(s)
    if (vol > bestVolume) bestVolume = vol
  }
  return { bestWeight, bestVolume }
}
