import { db } from '../db'
import { getLastPerformance } from './performance'
import { addExerciseToWorkout, getOrCreateWorkout } from './workoutActions'

/** Schedules (or reschedules) a template on a given date — one planned session per date. */
export async function schedulePlannedSession(date: string, templateId: number): Promise<number> {
  const existing = await db.plannedSessions.where('date').equals(date).first()
  if (existing?.id) {
    await db.plannedSessions.update(existing.id, { templateId })
    return existing.id
  }
  return db.plannedSessions.add({ date, templateId, createdAt: Date.now() })
}

export async function unschedulePlannedSession(id: number): Promise<void> {
  await db.plannedSessions.delete(id)
}

/**
 * Quick-starts a session from a template: creates (or reuses) the workout for
 * that date, adds every template exercise that isn't already in it, and
 * pre-creates its target number of sets — prefilled with the weight/reps
 * from the last time each exercise was performed, when available.
 */
export async function startWorkoutFromTemplate(date: string, templateId: number): Promise<number> {
  const workoutId = await getOrCreateWorkout(date)
  const templateExercises = await db.templateExercises
    .where('templateId')
    .equals(templateId)
    .sortBy('order')

  for (const te of templateExercises) {
    const alreadyPresent = await db.workoutExercises
      .where('workoutId')
      .equals(workoutId)
      .and((we) => we.exerciseId === te.exerciseId)
      .first()
    if (alreadyPresent) continue

    const workoutExerciseId = await addExerciseToWorkout(workoutId, te.exerciseId)
    const lastTime = await getLastPerformance(te.exerciseId, workoutId)

    for (let i = 0; i < te.targetSets; i++) {
      const source = lastTime?.sets[i] ?? lastTime?.sets[lastTime.sets.length - 1]
      await db.sets.add({
        workoutExerciseId,
        weight: source?.weight ?? 0,
        reps: source?.reps ?? 0,
        order: i,
        createdAt: Date.now(),
      })
    }
  }

  // Starting the session fulfills whatever was planned for that date.
  await db.plannedSessions.where('date').equals(date).delete()
  return workoutId
}
