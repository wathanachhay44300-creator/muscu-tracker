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

/** How much of a set counts for each secondary muscle group (the main one gets 1). */
export const SECONDARY_WEIGHT = 0.5

export interface MuscleGroupCount {
  group: MuscleGroup
  count: number
}

/**
 * Aggregates a set count per muscle group, sorted highest first. Missing or
 * falsy groups fall back to "Autre" so nothing silently disappears.
 */
export function countByMuscleGroup(
  items: { muscleGroup: MuscleGroup | undefined; secondaryGroups?: MuscleGroup[]; setCount: number }[],
): MuscleGroupCount[] {
  const map = new Map<MuscleGroup, number>()
  const add = (group: MuscleGroup, n: number) => map.set(group, (map.get(group) ?? 0) + n)
  for (const item of items) {
    if (item.setCount <= 0) continue
    const main = item.muscleGroup || 'Autre'
    add(main, item.setCount)
    // A set fully counts for the main muscle and half for each secondary one,
    // so shared work shows up without inflating the totals.
    for (const group of item.secondaryGroups ?? []) {
      if (group !== main) add(group, item.setCount * SECONDARY_WEIGHT)
    }
  }
  return [...map.entries()].map(([group, count]) => ({ group, count })).sort((a, b) => b.count - a.count)
}
