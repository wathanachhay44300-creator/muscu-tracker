import { LIBRARY_BY_SEED_ID, type LibraryExercise } from '../data/exerciseLibrary'
import { MUSCLES } from '../data/muscles'
import { EQUIPMENT_LABEL, type Equipment, type Exercise, type MuscleGroup } from '../types'
import { nameKey } from './exerciseLibrarySync'

/** The library entry behind a predefined (or adopted) exercise, if any. */
export function libraryEntryOf(ex: Pick<Exercise, 'seedId'>): LibraryExercise | undefined {
  return ex.seedId ? LIBRARY_BY_SEED_ID.get(ex.seedId) : undefined
}

const LOAD_TYPE_EQUIPMENT: Record<string, Equipment> = {
  'Barre libre': 'barre',
  Haltères: 'halteres',
  'Machine à plaques': 'machine',
  'Poulie / pile de poids': 'poulie',
  'Poids du corps': 'poids_du_corps',
}

export function equipmentOf(ex: Exercise): Equipment | undefined {
  return ex.equipment ?? libraryEntryOf(ex)?.equipment ?? LOAD_TYPE_EQUIPMENT[ex.loadType]
}

/* ------------------------------- matching ------------------------------- */

function tokenize(s: string): string[] {
  return nameKey(s).split(' ').filter(Boolean)
}

/** Levenshtein distance, giving up (returning max+1) as soon as it must exceed `max`. */
function editDistance(a: string, b: string, max: number): number {
  if (Math.abs(a.length - b.length) > max) return max + 1
  let prev = Array.from({ length: b.length + 1 }, (_, i) => i)
  for (let i = 1; i <= a.length; i++) {
    const cur = [i]
    let rowMin = i
    for (let j = 1; j <= b.length; j++) {
      const v = Math.min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1))
      cur.push(v)
      if (v < rowMin) rowMin = v
    }
    if (rowMin > max) return max + 1
    prev = cur
  }
  return prev[b.length]
}

/** How well one typed word matches one indexed word (0 = no match). */
function wordScore(q: string, d: string): number {
  if (q === d) return 4
  if (d.startsWith(q)) return 3
  if (q.length >= 3 && d.includes(q)) return 2
  if (q.length >= 5) {
    const max = q.length >= 8 ? 2 : 1
    // Typo anywhere in the word, or only in the part typed so far.
    if (editDistance(q, d, max) <= max || editDistance(q, d.slice(0, q.length), max) <= max) return 1
  }
  return 0
}

interface Indexed {
  name: string[]
  extra: string[]
  /** Whole name and each synonym, normalized: for whole-phrase bonuses. */
  phrases: string[]
}

const cache = new WeakMap<Exercise, Indexed>()

function indexOf(ex: Exercise): Indexed {
  let idx = cache.get(ex)
  if (idx) return idx
  const entry = libraryEntryOf(ex)
  const eq = equipmentOf(ex)
  const muscles = [...(entry?.primary ?? ex.primaryMuscles ?? [])].map((m) => MUSCLES[m].label)
  idx = {
    name: tokenize(ex.name),
    extra: [
      ...(entry?.synonyms ?? []).flatMap(tokenize),
      ...(eq ? tokenize(EQUIPMENT_LABEL[eq]) : []),
      ...tokenize(ex.muscleGroup),
      ...muscles.flatMap(tokenize),
    ],
    phrases: [nameKey(ex.name), ...(entry?.synonyms ?? []).map(nameKey)],
  }
  cache.set(ex, idx)
  return idx
}

/** Score of an exercise for a query (0 = does not match). Every typed word must match something. */
export function scoreExercise(ex: Exercise, queryTokens: string[]): number {
  if (queryTokens.length === 0) return 1
  const idx = indexOf(ex)
  let total = 0
  for (const q of queryTokens) {
    let best = 0
    for (const d of idx.name) best = Math.max(best, wordScore(q, d) * 2)
    if (best < 6) for (const d of idx.extra) best = Math.max(best, wordScore(q, d))
    if (best === 0) return 0
    total += best
  }
  // Typing a whole name or synonym ("leg press") should beat words that merely appear in it.
  const phrase = queryTokens.join(' ')
  let bonus = 0
  for (const p of idx.phrases) {
    if (p === phrase) bonus = Math.max(bonus, 6)
    else if (p.startsWith(phrase)) bonus = Math.max(bonus, 4)
    else if (p.includes(phrase)) bonus = Math.max(bonus, 2)
  }
  return total + bonus
}

export interface ExerciseFilterState {
  query: string
  groups: MuscleGroup[]
  equipment: Equipment[]
}

/** Applies search (ranked) and the cumulative group / equipment filters. */
export function filterExercises(list: Exercise[], f: ExerciseFilterState): Exercise[] {
  const q = tokenize(f.query)
  const scored: { ex: Exercise; score: number }[] = []
  for (const ex of list) {
    if (f.groups.length && !f.groups.includes(ex.muscleGroup)) continue
    if (f.equipment.length) {
      const eq = equipmentOf(ex)
      if (!eq || !f.equipment.includes(eq)) continue
    }
    const score = scoreExercise(ex, q)
    if (score > 0) scored.push({ ex, score })
  }
  if (q.length > 0) scored.sort((a, b) => b.score - a.score || a.ex.name.localeCompare(b.ex.name, 'fr'))
  return scored.map((s) => s.ex)
}
