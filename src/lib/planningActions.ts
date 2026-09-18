import { db } from '../db'
import type { SetEntry } from '../types'
import { getLastPerformance } from './performance'
import { addExerciseToWorkout, getOrCreateWorkout } from './workoutActions'

/** The most recent other workout started from this same template, if any. */
async function getLastTemplateWorkoutId(
  templateId: number,
  excludeWorkoutId: number,
): Promise<number | null> {
  const workouts = await db.workouts
    .where('templateId')
    .equals(templateId)
    .and((w) => w.id !== excludeWorkoutId)
    .sortBy('date')
  const last = workouts[workouts.length - 1]
  return last?.id ?? null
}

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
 * pre-creates its sets — prefilled from the last time *this same program*
 * was run (same weight/reps, same number of sets per exercise). If an
 * exercise has no history within that last run of the program (e.g. it was
 * just added to the template), falls back to the last time that exercise was
 * performed anywhere; with no history at all, its sets default to 0.
 */
export async function startWorkoutFromTemplate(date: string, templateId: number): Promise<number> {
  const workoutId = await getOrCreateWorkout(date)
  await db.workouts.update(workoutId, { templateId })

  const templateExercises = await db.templateExercises
    .where('templateId')
    .equals(templateId)
    .sortBy('order')
  const lastTemplateWorkoutId = await getLastTemplateWorkoutId(templateId, workoutId)

  for (const te of templateExercises) {
    const alreadyPresent = await db.workoutExercises
      .where('workoutId')
      .equals(workoutId)
      .and((we) => we.exerciseId === te.exerciseId)
      .first()
    if (alreadyPresent) continue

    const workoutExerciseId = await addExerciseToWorkout(workoutId, te.exerciseId)

    let sourceSets: SetEntry[] | null = null
    if (lastTemplateWorkoutId) {
      const link = await db.workoutExercises
        .where('workoutId')
        .equals(lastTemplateWorkoutId)
        .and((we) => we.exerciseId === te.exerciseId)
        .first()
      if (link) {
        const sets = await db.sets.where('workoutExerciseId').equals(link.id!).sortBy('order')
        if (sets.some((s) => s.weight > 0 || s.reps > 0)) sourceSets = sets
      }
    }
    if (!sourceSets) {
      const lastTime = await getLastPerformance(te.exerciseId, workoutId)
      sourceSets = lastTime?.sets ?? null
    }

    const setCount = sourceSets?.length ?? te.targetSets
    for (let i = 0; i < setCount; i++) {
      const source = sourceSets?.[i]
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

/**
 * Quick-starts a session by copying another past session wholesale (every
 * exercise, with the exact weights/reps it used) — for a one-off session
 * you don't want to turn into a permanent program.
 */
export async function startWorkoutFromPreviousSession(date: string, sourceWorkoutId: number): Promise<number> {
  const workoutId = await getOrCreateWorkout(date)
  const links = await db.workoutExercises.where('workoutId').equals(sourceWorkoutId).sortBy('order')

  for (const link of links) {
    const alreadyPresent = await db.workoutExercises
      .where('workoutId')
      .equals(workoutId)
      .and((we) => we.exerciseId === link.exerciseId)
      .first()
    if (alreadyPresent) continue

    const newLinkId = await addExerciseToWorkout(workoutId, link.exerciseId)
    const sets = await db.sets.where('workoutExerciseId').equals(link.id!).sortBy('order')
    await Promise.all(
      sets.map((s, i) =>
        db.sets.add({ workoutExerciseId: newLinkId, weight: s.weight, reps: s.reps, order: i, createdAt: Date.now() }),
      ),
    )
  }

  return workoutId
}
