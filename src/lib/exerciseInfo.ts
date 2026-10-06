import { EQUIPMENT_NOTES, FAMILIES } from '../data/exerciseFamilies'
import type { LibraryExercise } from '../data/exerciseLibrary'
import type { Equipment, Exercise, MuscleId } from '../types'
import { equipmentOf, libraryEntryOf } from './exerciseSearch'

export interface ExerciseInfo {
  entry: LibraryExercise | undefined
  equipment: Equipment | undefined
  primary: MuscleId[]
  secondary: MuscleId[]
  steps: string[]
  tips: string[]
  equipmentNote: string | undefined
}

/**
 * Everything the exercise sheet shows. Predefined exercises read their
 * muscles and instructions from the bundled library (so it works offline);
 * the user's own exercises use the muscles they chose and have no steps.
 */
export function getExerciseInfo(ex: Exercise): ExerciseInfo {
  const entry = libraryEntryOf(ex)
  const family = entry ? FAMILIES[entry.family] : undefined
  const equipment = equipmentOf(ex)
  return {
    entry,
    equipment,
    primary: entry?.primary ?? ex.primaryMuscles ?? [],
    secondary: entry?.secondary ?? ex.secondaryMuscles ?? [],
    steps: family?.steps ?? [],
    tips: family?.tips ?? [],
    equipmentNote: entry && equipment ? EQUIPMENT_NOTES[equipment] : undefined,
  }
}

/** YouTube search for a demonstration of the exercise (opens in a new tab). */
export function demoSearchUrl(name: string): string {
  return `https://www.youtube.com/results?search_query=${encodeURIComponent(`comment faire ${name}`)}`
}

/** A usable http(s) link, or null. */
export function normalizeVideoUrl(raw: string): string | null {
  const trimmed = raw.trim()
  if (!trimmed) return null
  try {
    const url = new URL(/^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`)
    return url.hostname.includes('.') ? url.toString() : null
  } catch {
    return null
  }
}
