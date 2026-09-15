import { db } from '../db'
import { DEFAULT_EXERCISES } from './exercisesSeed'
import { guessLoadType } from './loadType'
import type { Exercise, MuscleGroup } from '../types'

/**
 * The muscle taxonomy used to say "Jambes" (legs) as one broad bucket; it's
 * now split into precise muscles. Exercises already in a user's database
 * carry that old string, which no longer exists in the MuscleGroup type —
 * map each known exercise name to its precise replacement.
 */
const LEGACY_JAMBES_MAP: Record<string, MuscleGroup> = {
  Squat: 'Quadriceps',
  'Presse à cuisses': 'Quadriceps',
  Fentes: 'Quadriceps',
  'Leg curl': 'Ischio-jambiers',
  'Leg extension': 'Quadriceps',
  'Soulevé de terre jambes tendues': 'Ischio-jambiers',
  'Hip thrust': 'Fessiers',
  'Mollets debout': 'Mollets',
}

/** For a custom exercise that was tagged "Jambes" and isn't in the map above. */
function guessMuscleFromLegacyJambes(name: string): MuscleGroup {
  const n = name.toLowerCase()
  if (/mollet|calf/.test(n)) return 'Mollets'
  if (/ischio|hamstring|leg curl/.test(n)) return 'Ischio-jambiers'
  if (/fessier|hip thrust|glute/.test(n)) return 'Fessiers'
  return 'Quadriceps'
}

const DEFAULT_LOAD_TYPE_BY_NAME = new Map(DEFAULT_EXERCISES.map((e) => [e.name, e.loadType]))

/**
 * Brings exercises created before the precise-muscle / load-type update up
 * to date. Safe to run on every launch: once an exercise no longer carries a
 * legacy muscle group and already has a loadType, this is a no-op for it.
 */
export async function migrateLegacyExerciseData(): Promise<void> {
  const all = await db.exercises.toArray()

  for (const ex of all) {
    const patch: Partial<Exercise> = {}

    // "Jambes" and "Cardio" no longer exist as muscle groups.
    const legacyGroup = ex.muscleGroup as string
    if (legacyGroup === 'Jambes') {
      patch.muscleGroup = LEGACY_JAMBES_MAP[ex.name] ?? guessMuscleFromLegacyJambes(ex.name)
    } else if (legacyGroup === 'Cardio') {
      patch.muscleGroup = 'Autre'
    }

    // loadType is a brand new field — every pre-existing exercise lacks it.
    if (!ex.loadType) {
      patch.loadType = DEFAULT_LOAD_TYPE_BY_NAME.get(ex.name) ?? guessLoadType(ex.name, ex.muscleGroup)
    }

    if (Object.keys(patch).length > 0) {
      await db.exercises.update(ex.id!, patch)
    }
  }
}
