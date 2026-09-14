import { db } from '../db'
import type { MuscleGroup } from '../types'

/** Number of past sessions (workouts) that used this exercise at least once. */
export async function countExerciseUsage(exerciseId: number): Promise<number> {
  const links = await db.workoutExercises.where('exerciseId').equals(exerciseId).toArray()
  const workoutIds = new Set(links.map((l) => l.workoutId))
  return workoutIds.size
}

/**
 * Removes an exercise from the library (picker + list) without touching any
 * past session that already used it — those keep their exercise name and
 * sets exactly as logged. Soft-delete only: we never lose historical data.
 */
export async function softDeleteExercise(exerciseId: number): Promise<void> {
  await db.exercises.update(exerciseId, { deletedAt: Date.now() })
}

export async function renameExercise(
  exerciseId: number,
  patch: { name: string; muscleGroup: MuscleGroup },
): Promise<void> {
  await db.exercises.update(exerciseId, patch)
}
