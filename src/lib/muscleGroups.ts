import { LIBRARY_BY_SEED_ID } from '../data/exerciseLibrary'
import { MUSCLE_IDS, MUSCLES } from '../data/muscles'
import type { Exercise, MuscleGroup, MuscleId } from '../types'

/** Groups that can be picked as secondary muscles ("Autre" isn't a muscle). */
export const SECONDARY_CHOICES: MuscleGroup[] = ['Quadriceps', 'Ischio-jambiers', 'Fessiers', 'Mollets', 'Dos', 'Pectoraux', 'Épaules', 'Biceps', 'Triceps', 'Abdominaux', 'Avant-bras']

export function musclesOfGroup(group: MuscleGroup): MuscleId[] {
  return MUSCLE_IDS.filter((m) => MUSCLES[m].group === group)
}

export function musclesOfGroups(groups: MuscleGroup[]): MuscleId[] {
  return groups.flatMap(musclesOfGroup)
}

function uniq<T>(list: T[]): T[] {
  return [...new Set(list)]
}

/**
 * The secondary muscle groups of an exercise (never including its main
 * group). An explicit choice by the user wins; otherwise a predefined
 * exercise derives them from the library's muscle lists — e.g. the Romanian
 * deadlift (main group Ischio-jambiers) gets Fessiers, Dos and Avant-bras —
 * and the user's own exercises have none.
 */
export function secondaryGroupsOf(ex: Pick<Exercise, 'muscleGroup' | 'seedId' | 'secondaryGroups'>): MuscleGroup[] {
  const explicit = ex.secondaryGroups
  const entry = ex.seedId ? LIBRARY_BY_SEED_ID.get(ex.seedId) : undefined
  const groups = explicit ?? (entry ? [...entry.primary, ...entry.secondary].map((m) => MUSCLES[m].group) : [])
  return uniq(groups).filter((g) => g !== ex.muscleGroup && g !== 'Autre')
}
