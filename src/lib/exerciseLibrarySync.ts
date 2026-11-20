import { db } from '../db'
import { EXERCISE_LIBRARY, LIBRARY_BY_SEED_ID, LIBRARY_VERSION } from '../data/exerciseLibrary'
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
 * - everything else is added as a new predefined exercise;
 * - v2 (English names): a row still carrying the original French name of its
 *   library entry is renamed to the English name. Sessions, programs and
 *   records point to exercises by id, never by name, so nothing else moves.
 *   A name the user changed themselves is left untouched.
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
      const sameName = [nameKey(entry.name), nameKey(entry.frenchName)]
        .flatMap((k) => byName.get(k) ?? [])
        .find((e) => !e.seedId)
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

    // French → English names for rows saved before v2 (including adopted ones above).
    for (const row of all) {
      const entry = row.seedId ? LIBRARY_BY_SEED_ID.get(row.seedId) : undefined
      if (entry && row.name !== entry.name && nameKey(row.name) === nameKey(entry.frenchName)) {
        await db.exercises.update(row.id!, { name: entry.name })
      }
    }
    await db.settings.put({ id: STATE_ID, version: LIBRARY_VERSION })
  })
}
