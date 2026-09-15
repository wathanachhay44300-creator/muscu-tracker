import type { MuscleGroup, SetEntry } from '../types'

/** Volume of a single set: weight × reps. */
export function setVolume(set: Pick<SetEntry, 'weight' | 'reps'>): number {
  return set.weight * set.reps
}

/** Total volume across a list of sets. */
export function totalVolume(sets: Pick<SetEntry, 'weight' | 'reps'>[]): number {
  return sets.reduce((sum, s) => sum + setVolume(s), 0)
}

/** "1234.5" -> "1234.5", "10" -> "10" (trims trailing .0 without rounding away real decimals). */
export function formatWeight(n: number): string {
  return Number.isInteger(n) ? String(n) : n.toFixed(2).replace(/0+$/, '').replace(/\.$/, '')
}

/** French thousand-separated integer, e.g. 4250 -> "4 250". */
export function formatVolume(n: number): string {
  return Math.round(n).toLocaleString('fr-FR')
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
