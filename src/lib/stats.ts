import { formatDecimal, formatNumber } from '../i18n'
import type { MuscleGroup, SetEntry } from '../types'

/** Volume of a single set: weight × reps. */
export function setVolume(set: Pick<SetEntry, 'weight' | 'reps'>): number {
  return set.weight * set.reps
}

/** Total volume across a list of sets. */
export function totalVolume(sets: Pick<SetEntry, 'weight' | 'reps'>[]): number {
  return sets.reduce((sum, s) => sum + setVolume(s), 0)
}

/** A weight in the current language, without useless decimals: "62,5" / "62.5", "60". */
export function formatWeight(n: number): string {
  return formatDecimal(n)
}

/** Reps, half reps included: "6,5" in French, "6.5" in English. */
export function formatReps(n: number): string {
  return formatDecimal(n, 1)
}

/** Thousand-separated integer in the current language: "4 250" / "4,250". */
export function formatVolume(n: number): string {
  return formatNumber(Math.round(n), 0)
}

export interface MuscleGroupCount {
  group: MuscleGroup
  count: number
}

/**
 * Aggregates a set count per muscle group, sorted highest first. Missing or
 * falsy groups fall back to "Autre" so nothing silently disappears.
 */
export function countByMuscleGroup(
  items: { muscleGroup: MuscleGroup | undefined; setCount: number }[],
): MuscleGroupCount[] {
  const map = new Map<MuscleGroup, number>()
  for (const item of items) {
    if (item.setCount <= 0) continue
    const group = item.muscleGroup || 'Autre'
    map.set(group, (map.get(group) ?? 0) + item.setCount)
  }
  return [...map.entries()].map(([group, count]) => ({ group, count })).sort((a, b) => b.count - a.count)
}
