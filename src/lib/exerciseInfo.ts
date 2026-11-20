import { EQUIPMENT_NOTES, FAMILIES } from '../data/exerciseFamilies'
import { EQUIPMENT_NOTES_EN, FAMILIES_EN } from '../data/exerciseFamiliesEn'
import type { LibraryExercise } from '../data/exerciseLibrary'
import type { Equipment, Exercise, MuscleId } from '../types'
import { equipmentOf, libraryEntryOf } from './exerciseSearch'
import { musclesOfGroup, musclesOfGroups, secondaryGroupsOf } from './muscleGroups'
import { getLang, groupLabel, muscleShortLabel, t } from '../i18n'

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
  const en = getLang() === 'en'
  const family = entry ? ((en ? FAMILIES_EN[entry.family] : undefined) ?? FAMILIES[entry.family]) : undefined
  const equipment = equipmentOf(ex)
  return {
    entry,
    equipment,
    ...musclesFor(ex, entry),
    steps: family?.steps ?? [],
    tips: family?.tips ?? [],
    equipmentNote: entry && equipment ? (en ? EQUIPMENT_NOTES_EN : EQUIPMENT_NOTES)[equipment] : undefined,
  }
}

/** YouTube search for a demonstration of the exercise (opens in a new tab). */
export function demoSearchUrl(name: string): string {
  return `https://www.youtube.com/results?search_query=${encodeURIComponent(t('exerciseInfo.howToQuery', { name }))}`
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

/** The exercise's main and secondary muscles, for the body diagram (light: no instructions). */
export function exerciseMuscles(ex: Exercise): { primary: MuscleId[]; secondary: MuscleId[] } {
  return musclesFor(ex, libraryEntryOf(ex))
}

/**
 * Short names for the pills under an exercise's name: its precise muscles
 * when they're known, otherwise (the user's own exercises) its groups.
 */
export function muscleChips(ex: Exercise): { primary: string[]; secondary: string[] } {
  const entry = libraryEntryOf(ex)
  if (entry || ex.primaryMuscles?.length) {
    const { primary, secondary } = musclesFor(ex, entry)
    return { primary: primary.map(muscleShortLabel), secondary: secondary.map(muscleShortLabel) }
  }
  return {
    primary: ex.muscleGroup === 'Autre' ? [] : [groupLabel(ex.muscleGroup)],
    secondary: secondaryGroupsOf(ex).map(groupLabel),
  }
}

/**
 * Detailed muscles for the sheet and diagram. Predefined exercises use the
 * bundled library; the user's own exercises show every muscle of their main
 * group, and of each secondary group (older exercises that stored finer
 * muscles keep showing those).
 */
function musclesFor(ex: Exercise, entry: LibraryExercise | undefined): { primary: MuscleId[]; secondary: MuscleId[] } {
  if (entry) return { primary: entry.primary, secondary: entry.secondary }
  const primary = ex.primaryMuscles?.length ? ex.primaryMuscles : musclesOfGroup(ex.muscleGroup)
  const secondary = ex.secondaryMuscles?.length ? ex.secondaryMuscles : musclesOfGroups(secondaryGroupsOf(ex))
  return { primary, secondary: secondary.filter((m) => !primary.includes(m)) }
}
