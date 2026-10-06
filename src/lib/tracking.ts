import type { BodyMeasurement, WeightGoal } from '../types'
import { addDays, mondayOf } from './date'

/** One day of weight / steps / calories. Every field is optional. */
export interface DayEntry {
  date: string
  weight?: number
  steps?: number
  calories?: number
}

/** Accepted ranges: anything outside is treated as a typo / bad input, not data. */
export const LIMITS = {
  weight: { min: 20, max: 400 },
  steps: { min: 1, max: 200_000 },
  calories: { min: 1, max: 20_000 },
} as const

export type TrackedField = keyof typeof LIMITS

/** Parses "8500", "8 500", "78,4", "78.4"; returns null when it isn't a plain number. */
export function parseNumber(raw: string | null | undefined): number | null {
  if (raw == null) return null
  const cleaned = raw.trim().replace(/[\s  ]/g, '').replace(',', '.')
  if (!/^\d+(\.\d+)?$/.test(cleaned)) return null
  const n = Number(cleaned)
  return Number.isFinite(n) ? n : null
}

/** A value within the accepted range for this field, or null. Steps/kcal are rounded. */
export function validValue(field: TrackedField, n: number | null): number | null {
  if (n == null || !Number.isFinite(n)) return null
  const { min, max } = LIMITS[field]
  const v = field === 'weight' ? Math.round(n * 10) / 10 : Math.round(n)
  return v >= min && v <= max ? v : null
}

/** True for a real calendar date written yyyy-mm-dd. */
export function isValidISODate(s: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(s)) return false
  const [y, m, d] = s.split('-').map(Number)
  const date = new Date(y, m - 1, d)
  return date.getFullYear() === y && date.getMonth() === m - 1 && date.getDate() === d
}

/** Parses yyyy-mm-dd, dd/mm/yyyy or dd-mm-yyyy (and yyyy/mm/dd) into an ISO date, or null. */
export function parseAnyDate(raw: string): string | null {
  const s = raw.trim()
  let iso: string | null = null
  let m = /^(\d{4})[-/](\d{1,2})[-/](\d{1,2})/.exec(s)
  if (m) iso = `${m[1]}-${m[2].padStart(2, '0')}-${m[3].padStart(2, '0')}`
  else if ((m = /^(\d{1,2})[-/.](\d{1,2})[-/.](\d{4})/.exec(s))) {
    iso = `${m[3]}-${m[2].padStart(2, '0')}-${m[1].padStart(2, '0')}`
  }
  return iso && isValidISODate(iso) ? iso : null
}

/** "2026-10-06" -> "06/10" (day/month, as shown in confirmations). */
export function shortDate(iso: string): string {
  const [, m, d] = iso.split('-')
  return `${d}/${m}`
}

export function formatInt(n: number): string {
  return Math.round(n).toLocaleString('fr-FR')
}

export function formatKg(n: number, digits = 1): string {
  return n.toFixed(digits).replace('.', ',')
}

export function formatSigned(n: number, digits = 1): string {
  const s = Math.abs(n).toFixed(digits).replace('.', ',')
  if (Math.abs(n) < Math.pow(10, -digits) / 2) return s
  return `${n > 0 ? '+' : '−'}${s}`
}

/* ------------------------------------------------------------------ */
/* Deep link (iOS Shortcuts): ?steps=8500&date=2026-10-06[&weight=&kcal=] */
/* ------------------------------------------------------------------ */

export type DeepLinkResult =
  | { kind: 'entry'; entry: DayEntry }
  | { kind: 'ignored'; reason: string }

/** Whether these parameters look like an import link at all. */
export function hasDeepLinkParams(params: URLSearchParams): boolean {
  return ['steps', 'weight', 'kcal', 'calories'].some((k) => params.has(k))
}

/**
 * Validates import parameters. Invalid values are dropped one by one (a bad
 * `weight` doesn't cancel valid `steps`); an invalid or future `date` cancels
 * the whole import, since there's no telling which day it was meant for.
 */
export function parseDeepLink(params: URLSearchParams, today: string): DeepLinkResult {
  const rawDate = params.get('date')
  let date = today
  if (rawDate != null && rawDate !== '') {
    const parsed = parseAnyDate(rawDate)
    if (!parsed) return { kind: 'ignored', reason: 'date invalide' }
    // One day of slack: a phone in another timezone can already be "tomorrow".
    if (parsed > addDays(today, 1)) return { kind: 'ignored', reason: 'date dans le futur' }
    date = parsed
  }

  const entry: DayEntry = { date }
  const steps = validValue('steps', parseNumber(params.get('steps')))
  const weight = validValue('weight', parseNumber(params.get('weight')))
  const calories = validValue('calories', parseNumber(params.get('kcal') ?? params.get('calories')))
  if (steps != null) entry.steps = steps
  if (weight != null) entry.weight = weight
  if (calories != null) entry.calories = calories

  if (entry.steps == null && entry.weight == null && entry.calories == null) {
    return { kind: 'ignored', reason: 'aucune valeur valide' }
  }
  return { kind: 'entry', entry }
}

/** Human confirmation, e.g. "Pas du 06/10 importés : 8 500 · Poids 78,4 kg". */
export function describeImport(entry: DayEntry): string {
  const parts: string[] = []
  if (entry.steps != null) parts.push(`Pas du ${shortDate(entry.date)} importés : ${formatInt(entry.steps)}`)
  const extras: string[] = []
  if (entry.weight != null) extras.push(`poids ${formatKg(entry.weight)} kg`)
  if (entry.calories != null) extras.push(`${formatInt(entry.calories)} kcal`)
  if (parts.length === 0) {
    const text = extras.join(' · ')
    return `Données du ${shortDate(entry.date)} importées : ${text}`
  }
  return extras.length ? `${parts[0]} · ${extras.join(' · ')}` : parts[0]
}

/** Extracts parameters from a pasted URL or a bare "steps=8500&date=…" string. */
export function paramsFromText(text: string): URLSearchParams {
  const t = text.trim()
  const q = t.indexOf('?')
  let query = q >= 0 ? t.slice(q + 1) : t
  const hash = query.indexOf('#')
  if (hash >= 0) query = query.slice(0, hash)
  return new URLSearchParams(query)
}

/* -------------------- Clipboard line (Shortcut output) -------------------- */

export type ClipboardParse = { ok: true; entries: DayEntry[] } | { ok: false; error: string }

export const CLIPBOARD_FORMAT = 'AAAA-MM-JJ;pas;poids;kcal'

const FIELD_LABEL: Record<TrackedField, string> = { steps: 'pas', weight: 'poids', calories: 'calories' }

/**
 * Reads what the iOS Shortcut copied: one `AAAA-MM-JJ;pas;poids;kcal` line per
 * day (poids and kcal may be empty). Strict on purpose: a single bad line
 * rejects everything, so nothing half-valid is ever saved. A pasted import
 * link (`?steps=…&date=…`) is accepted too.
 */
export function parseClipboardText(text: string, today: string): ClipboardParse {
  const trimmed = text.trim()
  if (!trimmed) return { ok: false, error: 'Le presse-papiers est vide.' }

  if (/(^|[?&])(steps|weight|kcal|calories)=/.test(trimmed)) {
    const link = parseDeepLink(paramsFromText(trimmed), today)
    return link.kind === 'entry'
      ? { ok: true, entries: [link.entry] }
      : { ok: false, error: `Lien d'import ignoré : ${link.reason}.` }
  }

  const lines = trimmed.split(/\r\n|\n|\r/).map((l) => l.trim()).filter(Boolean)
  const entries: DayEntry[] = []
  for (const line of lines) {
    const cells = line.split(/;|\t/).map((c) => c.trim())
    if (cells.length < 2 || cells.length > 4 || !/^\d{4}-\d{2}-\d{2}$/.test(cells[0])) {
      if (entries.length === 0 && /^date$/i.test(cells[0])) continue // header line
      return { ok: false, error: `Format non reconnu. Attendu : ${CLIPBOARD_FORMAT} (ex. ${today};8500;78,4;2400).` }
    }
    const date = cells[0]
    if (!isValidISODate(date)) return { ok: false, error: `Date invalide : « ${date} ».` }
    if (date > addDays(today, 1)) return { ok: false, error: `Date dans le futur : « ${date} ».` }

    const entry: DayEntry = { date }
    const fields: TrackedField[] = ['steps', 'weight', 'calories']
    for (let i = 0; i < fields.length; i++) {
      const raw = cells[i + 1]
      if (raw == null || raw === '') continue
      const value = validValue(fields[i], parseNumber(raw))
      if (value == null) {
        return { ok: false, error: `Valeur invalide pour « ${FIELD_LABEL[fields[i]]} » : « ${raw} » (nombre positif attendu).` }
      }
      entry[fields[i]] = value
    }
    if (entry.steps == null && entry.weight == null && entry.calories == null) {
      return { ok: false, error: `Aucune valeur à importer pour le ${date}.` }
    }
    entries.push(entry)
  }
  return { ok: true, entries }
}

/** "Pas du 06/10 importés : 8 500" for one day, "3 jours importés" for several. */
export function describeImports(entries: DayEntry[]): string {
  return entries.length === 1 ? describeImport(entries[0]) : `${entries.length} jours importés`
}

/* ------------------------------ series ------------------------------ */

export function eachDay(start: string, end: string): string[] {
  const days: string[] = []
  for (let d = start; d <= end; d = addDays(d, 1)) days.push(d)
  return days
}

export function mapByDate(measurements: Pick<BodyMeasurement, 'date' | 'weight' | 'steps' | 'calories'>[]): Map<string, DayEntry> {
  const map = new Map<string, DayEntry>()
  for (const m of measurements) {
    map.set(m.date, { date: m.date, weight: m.weight, steps: m.steps, calories: m.calories })
  }
  return map
}

/** Trailing mean of the weights recorded in the last `window` days (including
 * the day itself), computed only over days that have a weight. */
export function trailingWeightAverage(byDate: Map<string, DayEntry>, day: string, window = 7): number | null {
  let sum = 0
  let n = 0
  for (let i = 0; i < window; i++) {
    const w = byDate.get(addDays(day, -i))?.weight
    if (w != null) {
      sum += w
      n++
    }
  }
  return n ? sum / n : null
}

export function mean(values: (number | undefined | null)[]): number | null {
  const present = values.filter((v): v is number => v != null)
  return present.length ? present.reduce((a, b) => a + b, 0) / present.length : null
}

export interface ChartColumn {
  start: string
  end: string
  /** Number of days merged into this column (1 = a single day). */
  span: number
  weight: number | null
  smooth: number | null
  steps: number | null
  calories: number | null
}

/** Beyond this many days, columns become weekly averages so bars stay readable. */
const WEEKLY_THRESHOLD_DAYS = 120

export function buildColumns(byDate: Map<string, DayEntry>, start: string, end: string): ChartColumn[] {
  const days = eachDay(start, end)
  const size = days.length > WEEKLY_THRESHOLD_DAYS ? 7 : 1
  const cols: ChartColumn[] = []
  for (let i = 0; i < days.length; i += size) {
    const chunk = days.slice(i, i + size)
    const entries = chunk.map((d) => byDate.get(d))
    const last = chunk[chunk.length - 1]
    cols.push({
      start: chunk[0],
      end: last,
      span: chunk.length,
      weight: mean(entries.map((e) => e?.weight)),
      smooth: trailingWeightAverage(byDate, last),
      steps: mean(entries.map((e) => e?.steps)),
      calories: mean(entries.map((e) => e?.calories)),
    })
  }
  return cols
}

export interface WeekSummary {
  monday: string
  weight: number | null
  steps: number | null
  calories: number | null
  /** Average weight minus the previous calendar week's, when both exist. */
  weightDelta: number | null
}

/** Per-week averages (only over days with data), newest week first. */
export function weeklySummaries(byDate: Map<string, DayEntry>, fromDate: string, today: string): WeekSummary[] {
  const buckets = new Map<string, DayEntry[]>()
  for (const e of byDate.values()) {
    const monday = mondayOf(e.date)
    const list = buckets.get(monday)
    if (list) list.push(e)
    else buckets.set(monday, [e])
  }
  const avg = (monday: string) => {
    const list = buckets.get(monday) ?? []
    return {
      weight: mean(list.map((e) => e.weight)),
      steps: mean(list.map((e) => e.steps)),
      calories: mean(list.map((e) => e.calories)),
    }
  }

  const rows: WeekSummary[] = []
  for (let monday = mondayOf(today); monday >= mondayOf(fromDate); monday = addDays(monday, -7)) {
    if (!buckets.has(monday)) continue
    const cur = avg(monday)
    const prev = avg(addDays(monday, -7))
    rows.push({
      monday,
      ...cur,
      weightDelta: cur.weight != null && prev.weight != null ? cur.weight - prev.weight : null,
    })
  }
  return rows
}

/* --------------------------- trend & advice --------------------------- */

/** Days of the analysis window and the number of weigh-in days it needs. */
export const TREND_WINDOW_DAYS = 28
export const TREND_MIN_DAYS = 14

export type Trend =
  | { status: 'insufficient'; days: number; needed: number }
  | { status: 'ok'; kgPerWeek: number; days: number }

/** Least-squares slope of weight over the last 4 weeks, in kg per week. */
export function computeTrend(byDate: Map<string, DayEntry>, today: string): Trend {
  const points: { x: number; y: number }[] = []
  for (let i = 0; i < TREND_WINDOW_DAYS; i++) {
    const w = byDate.get(addDays(today, -i))?.weight
    if (w != null) points.push({ x: -i, y: w })
  }
  if (points.length < TREND_MIN_DAYS) {
    return { status: 'insufficient', days: points.length, needed: TREND_MIN_DAYS }
  }
  const n = points.length
  const mx = points.reduce((a, p) => a + p.x, 0) / n
  const my = points.reduce((a, p) => a + p.y, 0) / n
  let num = 0
  let den = 0
  for (const p of points) {
    num += (p.x - mx) * (p.y - my)
    den += (p.x - mx) ** 2
  }
  const slopePerDay = den === 0 ? 0 : num / den
  return { status: 'ok', kgPerWeek: slopePerDay * 7, days: n }
}

export interface Advice {
  tone: 'ok' | 'calories-down' | 'calories-up'
  title: string
  text: string
}

/** Target pace in kg/week (negative = losing). */
export function targetRate(goal: WeightGoal, rateKg: number): number {
  return goal === 'loss' ? -Math.abs(rateKg) : goal === 'gain' ? Math.abs(rateKg) : 0
}

export function adviceFor(goal: WeightGoal, rateKg: number, actualKgPerWeek: number): Advice {
  const target = targetRate(goal, rateKg)
  const tolerance = Math.max(0.15, 0.4 * Math.abs(target))
  const diff = actualKgPerWeek - target // > 0: heavier than planned

  if (Math.abs(diff) <= tolerance) {
    return { tone: 'ok', title: 'Dans la cible', text: 'Continue comme ça.' }
  }
  if (goal === 'loss') {
    return diff > 0
      ? {
          tone: 'calories-down',
          title: 'Perte plus lente que prévu',
          text: 'Tu peux ajuster légèrement les calories ou augmenter tes pas.',
        }
      : {
          tone: 'calories-up',
          title: 'Perte plus rapide que prévu',
          text: 'Tu peux corriger un peu les calories.',
        }
  }
  if (goal === 'gain') {
    return diff < 0
      ? {
          tone: 'calories-up',
          title: 'Prise plus lente que prévu',
          text: 'Tu peux ajuster légèrement les calories.',
        }
      : {
          tone: 'calories-down',
          title: 'Prise plus rapide que prévu',
          text: 'Tu peux corriger un peu les calories.',
        }
  }
  return diff < 0
    ? {
        tone: 'calories-up',
        title: 'Perte plus rapide que prévu',
        text: 'Tu peux corriger un peu les calories.',
      }
    : {
        tone: 'calories-down',
        title: 'Poids en hausse plus que prévu',
        text: 'Tu peux ajuster légèrement les calories ou augmenter tes pas.',
      }
}


/* ------------------- maintenance estimate & steps context ------------------- */

/** kcal per kg of body weight gained or lost (usual rule of thumb). */
export const KCAL_PER_KG = 7700
export const CALORIE_MIN_DAYS = 14

export type MaintenanceEstimate =
  | { status: 'insufficient'; calorieDays: number; needed: number }
  | { status: 'unreliable'; maintenance: number; calorieDays: number }
  | { status: 'ok'; maintenance: number; avgCalories: number; calorieDays: number; windowDays: number }

/**
 * Rough maintenance calories: average intake over the window minus the
 * energy the weight change represents (kg/day × 7700). Only meaningful once
 * both weights and calories were logged on enough days.
 */
export function estimateMaintenance(byDate: Map<string, DayEntry>, today: string, kgPerWeek: number): MaintenanceEstimate {
  const cals: number[] = []
  for (let i = 0; i < TREND_WINDOW_DAYS; i++) {
    const c = byDate.get(addDays(today, -i))?.calories
    if (c != null) cals.push(c)
  }
  if (cals.length < CALORIE_MIN_DAYS) {
    return { status: 'insufficient', calorieDays: cals.length, needed: CALORIE_MIN_DAYS }
  }
  const avgCalories = cals.reduce((a, b) => a + b, 0) / cals.length
  const maintenance = avgCalories - (kgPerWeek / 7) * KCAL_PER_KG
  // Outside any plausible range the logs are probably incomplete: don't coach on it.
  if (maintenance < 1000 || maintenance > 6000) {
    return { status: 'unreliable', maintenance, calorieDays: cals.length }
  }
  return { status: 'ok', maintenance, avgCalories, calorieDays: cals.length, windowDays: TREND_WINDOW_DAYS }
}

/** Daily calories to aim for to hit the target pace, from the maintenance estimate. */
export function calorieTarget(maintenance: number, goal: WeightGoal, rateKg: number): number {
  return maintenance + (targetRate(goal, rateKg) / 7) * KCAL_PER_KG
}

export function roundTo(n: number, step: number): number {
  return Math.round(n / step) * step
}

export interface StepsShift {
  recent: number
  previous: number
  /** Relative change, e.g. -0.25 for 25 % fewer steps. */
  change: number
}

/** Average steps over the last 7 days vs the 7 before, when the gap is large enough to matter. */
export function stepsShift(byDate: Map<string, DayEntry>, today: string): StepsShift | null {
  const avgOf = (from: number) => {
    const vals: number[] = []
    for (let i = from; i < from + 7; i++) {
      const s = byDate.get(addDays(today, -i))?.steps
      if (s != null) vals.push(s)
    }
    return vals.length >= 3 ? vals.reduce((a, b) => a + b, 0) / vals.length : null
  }
  const recent = avgOf(0)
  const previous = avgOf(7)
  if (recent == null || previous == null || previous === 0) return null
  const change = (recent - previous) / previous
  return Math.abs(change) >= 0.2 && Math.abs(recent - previous) >= 1000 ? { recent, previous, change } : null
}
