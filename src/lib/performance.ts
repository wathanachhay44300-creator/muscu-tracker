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

export interface BestSet {
  weight: number
  reps: number
  date: string
}

/** Heaviest set ever logged for an exercise (most reps on a tie), or null.
 * `excludeWorkoutId` leaves out a session (the one in progress). */
export async function getBestSet(exerciseId: number, excludeWorkoutId?: number): Promise<BestSet | null> {
  const links = (await db.workoutExercises.where('exerciseId').equals(exerciseId).toArray()).filter(
    (l) => l.workoutId !== excludeWorkoutId,
  )
  if (links.length === 0) return null
  const [sets, workouts] = await Promise.all([
    db.sets.where('workoutExerciseId').anyOf(links.map((l) => l.id!)).toArray(),
    db.workouts.bulkGet(links.map((l) => l.workoutId)),
  ])
  const dateByLink = new Map(links.map((l, i) => [l.id!, workouts[i]?.date ?? '']))
  let best: BestSet | null = null
  for (const s of sets) {
    if (s.weight <= 0 || s.reps <= 0) continue
    if (!best || s.weight > best.weight || (s.weight === best.weight && s.reps > best.reps)) {
      best = { weight: s.weight, reps: s.reps, date: dateByLink.get(s.workoutExerciseId) ?? '' }
    }
  }
  return best
}

export interface LatestRecord {
  exerciseId: number
  weight: number
  reps: number
  date: string
}

/**
 * The most recent personal record across all exercises: the latest set
 * whose weight beat every earlier set of the same exercise (a first-ever
 * set doesn't count as a record).
 */
export async function getLatestRecord(): Promise<LatestRecord | null> {
  const [workouts, links, sets] = await Promise.all([
    db.workouts.toArray(),
    db.workoutExercises.toArray(),
    db.sets.toArray(),
  ])
  const dateOfWorkout = new Map(workouts.map((w) => [w.id!, w.date]))
  const linkInfo = new Map(links.map((l) => [l.id!, { exerciseId: l.exerciseId, date: dateOfWorkout.get(l.workoutId) }]))
  const rows = sets
    .map((s) => ({ s, info: linkInfo.get(s.workoutExerciseId) }))
    .filter((r): r is { s: SetEntry; info: { exerciseId: number; date: string } } => !!r.info?.date && r.s.weight > 0 && r.s.reps > 0)
    .sort((a, b) => (a.info.date === b.info.date ? a.s.createdAt - b.s.createdAt : a.info.date < b.info.date ? -1 : 1))
  const best = new Map<number, number>()
  let latest: LatestRecord | null = null
  for (const { s, info } of rows) {
    const prev = best.get(info.exerciseId)
    if (prev != null && s.weight > prev) latest = { exerciseId: info.exerciseId, weight: s.weight, reps: s.reps, date: info.date }
    if (prev == null || s.weight > prev) best.set(info.exerciseId, s.weight)
  }
  return latest
}
