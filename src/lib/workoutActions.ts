import { db } from '../db'
import type { SetEntry, Workout, WorkoutExercise } from '../types'
import { todayISO } from './date'

/**
 * The workout to show/edit for a date: the most recent one. A session that
 * was already finished *today* is treated as done — the Séance screen goes
 * back to the start screen so a new session can begin (it stays reachable
 * from the history). Past days keep showing their session as before.
 */
export async function getWorkoutForDate(date: string): Promise<Workout | undefined> {
  const rows = await db.workouts.where('date').equals(date).sortBy('createdAt')
  const latest = rows[rows.length - 1]
  if (!latest) return undefined
  if (latest.finishedAt && date === todayISO()) return undefined
  return latest
}

/** Gets this date's current workout id, creating one if there's none (or today's last one is finished). */
export async function getOrCreateWorkout(date: string): Promise<number> {
  const existing = await getWorkoutForDate(date)
  if (existing?.id) return existing.id
  return db.workouts.add({ date, createdAt: Date.now() })
}

/** Adds an exercise to a workout (as the last one) and returns the new link id. */
export async function addExerciseToWorkout(
  workoutId: number,
  exerciseId: number,
): Promise<number> {
  const existing = await db.workoutExercises
    .where('workoutId')
    .equals(workoutId)
    .and((we) => we.exerciseId === exerciseId)
    .first()
  if (existing?.id) return existing.id

  const links = await db.workoutExercises.where('workoutId').equals(workoutId).toArray()
  const order = links.length ? Math.max(...links.map((l) => l.order)) + 1 : 0
  return db.workoutExercises.add({ workoutId, exerciseId, order })
}

/** Persists a new exercise order for a workout, from a drag-and-drop reorder. */
export async function reorderWorkoutExercises(workoutExerciseIds: number[]): Promise<void> {
  await db.transaction('rw', db.workoutExercises, async () => {
    await Promise.all(workoutExerciseIds.map((id, index) => db.workoutExercises.update(id, { order: index })))
  })
}

/** Removes an exercise block (and its sets) from a workout. */
export async function removeExerciseFromWorkout(workoutExerciseId: number): Promise<void> {
  await db.transaction('rw', db.workoutExercises, db.sets, async () => {
    await db.sets.where('workoutExerciseId').equals(workoutExerciseId).delete()
    await db.workoutExercises.delete(workoutExerciseId)
  })
}

/** Re-adds an exercise block and its sets after removal (the "Annuler" snackbar action). */
export async function restoreExercise(link: WorkoutExercise, sets: SetEntry[]): Promise<number> {
  const { id: _id, ...linkRest } = link
  const newId = await db.workoutExercises.add(linkRest)
  await Promise.all(
    sets.map((s) => {
      const { id: _sid, ...rest } = s
      return db.sets.add({ ...rest, workoutExerciseId: newId })
    }),
  )
  return newId
}

/** Duplicates an exercise block within the same workout, sets included, as a new block at the end. */
export async function duplicateExerciseInWorkout(workoutExerciseId: number): Promise<number> {
  const original = await db.workoutExercises.get(workoutExerciseId)
  if (!original) throw new Error('Exercice introuvable')
  const sets = await db.sets.where('workoutExerciseId').equals(workoutExerciseId).sortBy('order')
  const links = await db.workoutExercises.where('workoutId').equals(original.workoutId).toArray()
  const order = links.length ? Math.max(...links.map((l) => l.order)) + 1 : 0
  const newLinkId = await db.workoutExercises.add({
    workoutId: original.workoutId,
    exerciseId: original.exerciseId,
    order,
  })
  await Promise.all(
    sets.map((s, i) =>
      db.sets.add({ workoutExerciseId: newLinkId, weight: s.weight, reps: s.reps, order: i, createdAt: Date.now() }),
    ),
  )
  return newLinkId
}

/** Adds a new set, prefilled from the previous last set of that exercise block (fast re-entry),
 * or from `override` when given (e.g. accepting a progression suggestion). */
export async function addSet(
  workoutExerciseId: number,
  override?: { weight: number; reps: number },
): Promise<number> {
  const existing = await db.sets
    .where('workoutExerciseId')
    .equals(workoutExerciseId)
    .sortBy('order')
  const last = existing[existing.length - 1]
  const order = last ? last.order + 1 : 0
  return db.sets.add({
    workoutExerciseId,
    weight: override?.weight ?? last?.weight ?? 0,
    reps: override?.reps ?? last?.reps ?? 0,
    order,
    createdAt: Date.now(),
  })
}

/** Duplicates a set, inserting the copy right after the original. */
export async function duplicateSet(setId: number): Promise<number> {
  const original = await db.sets.get(setId)
  if (!original) throw new Error('Série introuvable')
  const newSetId = await db.sets.add({
    workoutExerciseId: original.workoutExerciseId,
    weight: original.weight,
    reps: original.reps,
    order: original.order + 0.5,
    createdAt: Date.now(),
  })
  const siblings = await db.sets.where('workoutExerciseId').equals(original.workoutExerciseId).sortBy('order')
  await Promise.all(siblings.map((s, i) => db.sets.update(s.id!, { order: i })))
  return newSetId
}

export async function updateSet(
  setId: number,
  patch: Partial<{ weight: number; reps: number; rpe: number }>,
): Promise<void> {
  await db.sets.update(setId, patch)
}

export async function removeSet(setId: number): Promise<void> {
  await db.sets.delete(setId)
}

/** Re-adds a set previously removed (used by the "Annuler" snackbar action). */
export async function restoreSet(set: SetEntry): Promise<number> {
  const { id: _id, ...rest } = set
  return db.sets.add(rest)
}

/** Sets (or clears, with `null`) the overall perceived-difficulty rating for a session. */
export async function updateWorkoutRpe(workoutId: number, rpe: number | null): Promise<void> {
  await db.workouts.update(workoutId, { rpe })
}

/** Sets a custom title for one session; an empty title reverts to the program name / "Séance libre". */
export async function updateWorkoutTitle(workoutId: number, title: string): Promise<void> {
  await db.workouts.update(workoutId, { title: title.trim() ? title.trim() : undefined })
}

/** Sets (or clears) the note attached to an exercise within one session. */
export async function updateExerciseNote(workoutExerciseId: number, note: string): Promise<void> {
  await db.workoutExercises.update(workoutExerciseId, { note: note.trim() ? note : undefined })
}

/** Sets the free-text note for a session (fatigue, sommeil, douleurs, contexte…). */
export async function updateWorkoutNotes(workoutId: number, notes: string): Promise<void> {
  await db.workouts.update(workoutId, { notes: notes.trim() ? notes : undefined })
}

/**
 * Marks a session as done — purely a UX signal to close out the "in
 * progress" state and unlock the duration in its summary. Data is already
 * saved continuously as the user edits it, with or without this being called.
 */
export async function finishWorkout(workoutId: number): Promise<void> {
  await db.workouts.update(workoutId, { finishedAt: Date.now() })
}

/** Deletes an entire workout and all its exercises/sets. */
export async function deleteWorkout(workoutId: number): Promise<void> {
  await db.transaction('rw', db.workouts, db.workoutExercises, db.sets, async () => {
    const links = await db.workoutExercises.where('workoutId').equals(workoutId).toArray()
    for (const link of links) {
      await db.sets.where('workoutExerciseId').equals(link.id!).delete()
    }
    await db.workoutExercises.where('workoutId').equals(workoutId).delete()
    await db.workouts.delete(workoutId)
  })
}
