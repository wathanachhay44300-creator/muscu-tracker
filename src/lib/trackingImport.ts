import { db } from '../db'
import type { BodyMeasurement } from '../types'
import { parseAnyDate, parseNumber, validValue, type DayEntry, type TrackedField } from './tracking'

const FIELDS: TrackedField[] = ['steps', 'weight', 'calories']

/** Merges rows that share a date (later values win), so each day appears once. */
export function dedupeByDate(entries: DayEntry[]): DayEntry[] {
  const map = new Map<string, DayEntry>()
  for (const e of entries) map.set(e.date, { ...map.get(e.date), ...stripUndefined(e) })
  return [...map.values()].sort((a, b) => (a.date < b.date ? -1 : 1))
}

function stripUndefined(e: DayEntry): DayEntry {
  const out: DayEntry = { date: e.date }
  for (const f of FIELDS) if (e[f] != null) out[f] = e[f]
  return out
}

/* ------------------------------- CSV ------------------------------- */

export interface CsvParseResult {
  entries: DayEntry[]
  /** Lines ignored: no readable date, or no valid value at all. */
  skipped: number
}

function stripAccents(s: string): string {
  return s.normalize('NFD').replace(/[̀-ͯ]/g, '')
}

/** Splits one CSV line on `delimiter`, honouring "quoted, fields". */
function splitLine(line: string, delimiter: string): string[] {
  const cells: string[] = []
  let cur = ''
  let quoted = false
  for (let i = 0; i < line.length; i++) {
    const c = line[i]
    if (quoted) {
      if (c === '"' && line[i + 1] === '"') {
        cur += '"'
        i++
      } else if (c === '"') quoted = false
      else cur += c
    } else if (c === '"') quoted = true
    else if (c === delimiter) {
      cells.push(cur)
      cur = ''
    } else cur += c
  }
  cells.push(cur)
  return cells.map((c) => c.trim())
}

function columnFor(header: string): 'date' | TrackedField | null {
  const h = stripAccents(header.toLowerCase()).replace(/\(.*\)/, '').trim()
  if (h === 'date' || h === 'jour') return 'date'
  if (h === 'pas' || h === 'steps' || h === 'nombre de pas') return 'steps'
  if (h === 'poids' || h === 'weight') return 'weight'
  if (h === 'calories' || h === 'calorie' || h === 'kcal') return 'calories'
  return null
}

/**
 * Reads a simple CSV: columns date, pas, poids, calories (header optional,
 * in any order when present; `;` `,` or tab separated; decimal comma OK with
 * `;`). Unreadable cells are ignored, not fatal.
 */
export function parseTrackingCsv(text: string): CsvParseResult {
  const lines = text
    .replace(/^﻿/, '')
    .split(/\r\n|\n|\r/)
    .filter((l) => l.trim() !== '')
  if (lines.length === 0) return { entries: [], skipped: 0 }

  const first = lines[0]
  const delimiter = [';', '\t', ','].reduce((best, d) => (count(first, d) > count(first, best) ? d : best), ';')
  const firstCells = splitLine(first, delimiter)
  const mapped = firstCells.map(columnFor)
  const hasHeader = mapped.includes('date')
  const columns: ('date' | TrackedField | null)[] = hasHeader ? mapped : ['date', 'steps', 'weight', 'calories']
  const body = hasHeader ? lines.slice(1) : lines

  const entries: DayEntry[] = []
  let skipped = 0
  for (const line of body) {
    const cells = splitLine(line, delimiter)
    const entry: DayEntry = { date: '' }
    columns.forEach((col, i) => {
      const cell = cells[i]
      if (!col || cell == null || cell === '') return
      if (col === 'date') {
        entry.date = parseAnyDate(cell) ?? ''
      } else {
        const v = validValue(col, parseNumber(cell))
        if (v != null) entry[col] = v
      }
    })
    if (!entry.date || (entry.steps == null && entry.weight == null && entry.calories == null)) skipped++
    else entries.push(entry)
  }
  return { entries: dedupeByDate(entries), skipped }
}

function count(s: string, ch: string): number {
  return s.split(ch).length - 1
}

/* --------------------------- Apple Health --------------------------- */

export interface HealthParseResult {
  entries: DayEntry[]
  records: number
}

const CHUNK_BYTES = 8 * 1024 * 1024
const STEP_TYPE = 'HKQuantityTypeIdentifierStepCount'

/**
 * Reads daily step totals out of Apple Health's `export.xml` without loading
 * it in memory: the file is read in 8 MB slices and only `<Record>` tags for
 * steps are looked at. iPhone and Apple Watch both log the same steps, so
 * summing everything would double count: per day, each source is totalled
 * separately and the fullest source wins (an approximation of what the Health
 * app displays).
 */
export async function parseHealthSteps(
  file: File,
  onProgress: (ratio: number) => void,
): Promise<HealthParseResult> {
  const decoder = new TextDecoder('utf-8')
  const perDay = new Map<string, Map<string, number>>()
  let tail = ''
  let records = 0

  for (let offset = 0; offset < file.size; offset += CHUNK_BYTES) {
    const buffer = await file.slice(offset, offset + CHUNK_BYTES).arrayBuffer()
    const text = tail + decoder.decode(buffer, { stream: offset + CHUNK_BYTES < file.size })
    let lastEnd = 0
    const tagRe = /<Record\b[^>]*>/g
    let m: RegExpExecArray | null
    while ((m = tagRe.exec(text))) {
      lastEnd = m.index + m[0].length
      const tag = m[0]
      if (!tag.includes(STEP_TYPE)) continue
      const start = /startDate="(\d{4}-\d{2}-\d{2})/.exec(tag)?.[1]
      const value = Number(/value="([^"]*)"/.exec(tag)?.[1])
      if (!start || !Number.isFinite(value) || value < 0) continue
      const source = /sourceName="([^"]*)"/.exec(tag)?.[1] ?? '?'
      const day = perDay.get(start) ?? new Map<string, number>()
      day.set(source, (day.get(source) ?? 0) + value)
      perDay.set(start, day)
      records++
    }
    // Keep only what may be the start of a tag cut by the slice boundary.
    const rest = text.slice(lastEnd)
    const lt = rest.lastIndexOf('<')
    tail = lt >= 0 ? rest.slice(lt) : ''
    onProgress(Math.min(1, (offset + CHUNK_BYTES) / file.size))
  }

  const entries: DayEntry[] = []
  for (const [date, sources] of perDay) {
    const steps = validValue('steps', Math.max(...sources.values()))
    if (steps != null) entries.push({ date, steps })
  }
  entries.sort((a, b) => (a.date < b.date ? -1 : 1))
  return { entries, records }
}

/* ------------------------------ merging ------------------------------ */

export interface MergePlan {
  days: number
  /** Values that fill an empty slot (always safe to write). */
  fresh: number
  /** Values that differ from one already saved. */
  conflicts: number
  unchanged: number
}

async function loadExisting(dates: string[]): Promise<Map<string, BodyMeasurement>> {
  const rows = await db.bodyMeasurements.where('date').anyOf(dates).toArray()
  return new Map(rows.map((r) => [r.date, r]))
}

/** Dry run: how many values are new, identical, or would overwrite an existing one. */
export async function planMerge(entries: DayEntry[]): Promise<MergePlan> {
  const existing = await loadExisting(entries.map((e) => e.date))
  const plan: MergePlan = { days: entries.length, fresh: 0, conflicts: 0, unchanged: 0 }
  for (const e of entries) {
    const row = existing.get(e.date)
    for (const f of FIELDS) {
      if (e[f] == null) continue
      const current = row?.[f]
      if (current == null) plan.fresh++
      else if (current === e[f]) plan.unchanged++
      else plan.conflicts++
    }
  }
  return plan
}

/**
 * Writes entries into the shared per-day rows. `keep` never touches a value
 * that is already saved; `replace` overwrites it. Empty slots are always
 * filled. One row per date: existing days are updated, never duplicated.
 */
export async function applyMerge(
  entries: DayEntry[],
  policy: 'replace' | 'keep',
): Promise<{ written: number }> {
  let written = 0
  await db.transaction('rw', db.bodyMeasurements, async () => {
    const existing = await loadExisting(entries.map((e) => e.date))
    for (const e of entries) {
      const row = existing.get(e.date)
      const patch: Partial<Pick<BodyMeasurement, TrackedField>> = {}
      for (const f of FIELDS) {
        const incoming = e[f]
        if (incoming == null) continue
        const current = row?.[f]
        if (current === incoming) continue
        if (current == null || policy === 'replace') patch[f] = incoming
      }
      if (Object.keys(patch).length === 0) continue
      written += Object.keys(patch).length
      if (row?.id) await db.bodyMeasurements.update(row.id, patch)
      else await db.bodyMeasurements.add({ date: e.date, createdAt: Date.now(), ...patch })
    }
  })
  return { written }
}

/* ------------------------------ export ------------------------------ */

/** Tracking history as CSV (date;pas;poids;calories), re-importable as is. */
export async function trackingToCsv(): Promise<string> {
  const rows = await db.bodyMeasurements.orderBy('date').toArray()
  const lines = ['date;pas;poids;calories']
  for (const r of rows) {
    if (r.steps == null && r.weight == null && r.calories == null) continue
    lines.push([r.date, r.steps ?? '', r.weight != null ? String(r.weight).replace('.', ',') : '', r.calories ?? ''].join(';'))
  }
  return lines.join('\r\n')
}
