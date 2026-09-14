import { db } from '../db'

/** Gets today's/this date's workout id, creating it lazily if it doesn't exist yet. */
export async function getOrCreateWorkout(date: string): Promise<number> {
  const existing = await db.workouts.where('date').equals(date).first()
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

/** Removes an exercise block (and its sets) from a workout. */
export async function removeExerciseFromWorkout(workoutExerciseId: number): Promise<void> {
  await db.transaction('rw', db.workoutExercises, db.sets, async () => {
    await db.sets.where('workoutExerciseId').equals(workoutExerciseId).delete()
    await db.workoutExercises.delete(workoutExerciseId)
  })
}

/** Adds a new set, prefilled from the previous last set of that exercise block (fast re-entry). */
export async function addSet(workoutExerciseId: number): Promise<number> {
  const existing = await db.sets
    .where('workoutExerciseId')
    .equals(workoutExerciseId)
    .sortBy('order')
  const last = existing[existing.length - 1]
  const order = last ? last.order + 1 : 0
  return db.sets.add({
    workoutExerciseId,
    weight: last?.weight ?? 0,
    reps: last?.reps ?? 0,
    order,
    createdAt: Date.now(),
  })
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

/** Sets (or clears, with `null`) the overall perceived-difficulty rating for a session. */
export async function updateWorkoutRpe(workoutId: number, rpe: number | null): Promise<void> {
  await db.workouts.update(workoutId, { rpe })
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
