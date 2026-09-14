import type { SetEntry } from '../types'

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
