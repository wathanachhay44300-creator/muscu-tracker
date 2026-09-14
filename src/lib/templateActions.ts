import { db } from '../db'

const DEFAULT_TARGET_SETS = 3

export async function createTemplate(name: string): Promise<number> {
  return db.workoutTemplates.add({ name, createdAt: Date.now() })
}

export async function renameTemplate(id: number, name: string): Promise<void> {
  await db.workoutTemplates.update(id, { name })
}

/** Number of planned (not-yet-started) sessions that reference this template. */
export async function countTemplateUsage(templateId: number): Promise<number> {
  return db.plannedSessions.where('templateId').equals(templateId).count()
}

/** Deletes a template, its exercise list, and any planned session using it. */
export async function deleteTemplate(id: number): Promise<void> {
  await db.transaction(
    'rw',
    db.workoutTemplates,
    db.templateExercises,
    db.plannedSessions,
    async () => {
      await db.templateExercises.where('templateId').equals(id).delete()
      await db.plannedSessions.where('templateId').equals(id).delete()
      await db.workoutTemplates.delete(id)
    },
  )
}

export async function addExerciseToTemplate(templateId: number, exerciseId: number): Promise<number> {
  const existing = await db.templateExercises
    .where('templateId')
    .equals(templateId)
    .and((te) => te.exerciseId === exerciseId)
    .first()
  if (existing?.id) return existing.id

  const links = await db.templateExercises.where('templateId').equals(templateId).toArray()
  const order = links.length ? Math.max(...links.map((l) => l.order)) + 1 : 0
  return db.templateExercises.add({ templateId, exerciseId, order, targetSets: DEFAULT_TARGET_SETS })
}

export async function removeExerciseFromTemplate(templateExerciseId: number): Promise<void> {
  await db.templateExercises.delete(templateExerciseId)
}

export async function updateTargetSets(templateExerciseId: number, targetSets: number): Promise<void> {
  await db.templateExercises.update(templateExerciseId, { targetSets: Math.max(1, targetSets) })
}
