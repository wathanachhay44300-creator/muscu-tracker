import { db } from '../db'
import { EXERCISE_LIBRARY, LIBRARY_VERSION } from '../data/exerciseLibrary'
import type { Exercise, ExerciseLibraryState } from '../types'

const STATE_ID = 'exerciseLibrary' as const

/** Accent-, case- and punctuation-insensitive key, to recognise "the same name". */
export function nameKey(name: string): string {
  return name
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
}

/**
 * Brings the predefined exercise library into the database — on a fresh
 * install, and again whenever LIBRARY_VERSION is bumped — without ever
 * disturbing user data:
 *
 * - a library entry already present (matched by its stable `seedId`) is left
 *   alone, *including* when the user deleted it, so deleted ones don't come back;
 * - an existing exercise with the same name (the old built-in list, or one the
 *   user created themselves) is adopted by giving it the `seedId`: the user's
 *   own row, history, records, favorites and programs are kept as they are, and
 *   no visible duplicate is created;
 * - everything else is added as a new predefined exercise.
 */
export async function syncExerciseLibrary(): Promise<void> {
  await db.transaction('rw', db.exercises, db.settings, async () => {
    const state = (await db.settings.get(STATE_ID)) as ExerciseLibraryState | undefined
    if (state && state.version >= LIBRARY_VERSION) return

    const all = await db.exercises.toArray() // includes soft-deleted rows on purpose
    const bySeedId = new Set(all.filter((e) => e.seedId).map((e) => e.seedId!))
    const byName = new Map<string, Exercise[]>()
    for (const e of all) {
      const key = nameKey(e.name)
      const list = byName.get(key)
      if (list) list.push(e)
      else byName.set(key, [e])
    }

    const now = Date.now()
    const toAdd: Exercise[] = []
    for (const entry of EXERCISE_LIBRARY) {
      if (bySeedId.has(entry.seedId)) continue
      const sameName = byName.get(nameKey(entry.name))?.find((e) => !e.seedId)
      if (sameName) {
        await db.exercises.update(sameName.id!, {
          seedId: entry.seedId,
          equipment: sameName.equipment ?? entry.equipment,
        })
        sameName.seedId = entry.seedId
        continue
      }
      toAdd.push({
        name: entry.name,
        muscleGroup: entry.group,
        loadType: entry.loadType,
        isCustom: false,
        createdAt: now,
        seedId: entry.seedId,
        equipment: entry.equipment,
      })
    }
    if (toAdd.length > 0) await db.exercises.bulkAdd(toAdd)
    await db.settings.put({ id: STATE_ID, version: LIBRARY_VERSION })
  })
}
