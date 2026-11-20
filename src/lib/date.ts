import { getLang, t, type Lang } from '../i18n'
/** Converts a Date to yyyy-mm-dd in local time (not UTC). */
export function dateToISO(d: Date): string {
  const offset = d.getTimezoneOffset()
  return new Date(d.getTime() - offset * 60_000).toISOString().slice(0, 10)
}

/** Returns today's date as yyyy-mm-dd, in local time (not UTC). */
export function todayISO(): string {
  return dateToISO(new Date())
}

const WEEKDAYS: Record<Lang, string[]> = {
  fr: ['dim', 'lun', 'mar', 'mer', 'jeu', 'ven', 'sam'],
  en: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
}
const WEEKDAYS_FULL: Record<Lang, string[]> = {
  fr: ['dimanche', 'lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi'],
  en: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
}
const MONTHS: Record<Lang, string[]> = {
  fr: ['jan', 'fév', 'mar', 'avr', 'mai', 'juin', 'juil', 'août', 'sep', 'oct', 'nov', 'déc'],
  en: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
}
const MONTHS_FULL: Record<Lang, string[]> = {
  fr: ['janvier', 'février', 'mars', 'avril', 'mai', 'juin', 'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre'],
  en: ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'],
}

function parts(iso: string): { y: number; m: number; d: number; weekday: number } {
  const [y, m, d] = iso.split('-').map(Number)
  return { y, m, d, weekday: new Date(y, m - 1, d).getDay() }
}

/** Short date in the current language: "lun 14 sep 2026" / "Mon 14 Sep 2026". */
export function formatDateShort(iso: string, opts: { withYear?: boolean } = {}): string {
  const lang = getLang()
  const { y, m, d, weekday } = parts(iso)
  const year = opts.withYear === false ? '' : ` ${y}`
  return `${WEEKDAYS[lang][weekday]} ${d} ${MONTHS[lang][m - 1]}${year}`
}

/** "vendredi 20 novembre" / "Friday 20 November". */
export function formatDayMonth(iso: string): string {
  const lang = getLang()
  const { m, d, weekday } = parts(iso)
  return `${WEEKDAYS_FULL[lang][weekday]} ${d} ${MONTHS_FULL[lang][m - 1]}`
}

/** One-letter weekday initials, Monday first: L M M J V S D / M T W T F S S. */
export function weekdayInitials(): string[] {
  return getLang() === 'en' ? ['M', 'T', 'W', 'T', 'F', 'S', 'S'] : ['L', 'M', 'M', 'J', 'V', 'S', 'D']
}

/** Short weekday names, Monday first. */
export function weekdayShortNames(): string[] {
  const w = WEEKDAYS[getLang()]
  return [...w.slice(1), w[0]].map((s) => s.charAt(0).toUpperCase() + s.slice(1))
}

/** Full weekday name for a Monday-first index (0 = Monday). */
export function weekdayFullName(mondayIndex: number): string {
  return WEEKDAYS_FULL[getLang()][(mondayIndex + 1) % 7]
}

/** Adds (or subtracts) days to an ISO yyyy-mm-dd date, returning a new ISO date. */
export function addDays(iso: string, delta: number): string {
  const [y, m, d] = iso.split('-').map(Number)
  return dateToISO(new Date(y, m - 1, d + delta))
}

/** Adds (or subtracts) whole weeks to an ISO date. */
export function addWeeks(iso: string, delta: number): string {
  return addDays(iso, delta * 7)
}

/** The Monday of the ISO week containing this date. */
export function mondayOf(iso: string): string {
  const [y, m, d] = iso.split('-').map(Number)
  const date = new Date(y, m - 1, d)
  const daysSinceMonday = (date.getDay() + 6) % 7 // Sun=0 -> 6, Mon=1 -> 0, ...
  return addDays(iso, -daysSinceMonday)
}

export function isToday(iso: string): boolean {
  return iso === todayISO()
}

/** Adds (or subtracts) whole months, clamping the day if the target month is shorter. */
export function addMonths(iso: string, delta: number): string {
  const [y, m, d] = iso.split('-').map(Number)
  const date = new Date(y, m - 1 + delta, 1)
  const daysInTarget = new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate()
  date.setDate(Math.min(d, daysInTarget))
  return dateToISO(date)
}

/** The first day (yyyy-mm-01) of the ISO month containing this date. */
export function monthStartOf(iso: string): string {
  return `${iso.slice(0, 7)}-01`
}

/** Number of days in the ISO month containing this date. */
export function daysInMonth(iso: string): number {
  const [y, m] = iso.split('-').map(Number)
  return new Date(y, m, 0).getDate()
}

/** Month and year in the current language: "novembre 2026" / "November 2026". */
export function formatMonth(iso: string): string {
  const [y, m] = iso.split('-').map(Number)
  return `${MONTHS_FULL[getLang()][m - 1]} ${y}`
}

/** Human label: "Aujourd'hui"/"Today", "Hier"/"Yesterday", "Demain"/"Tomorrow", or the formatted date. */
export function relativeDateLabel(iso: string): string {
  if (iso === todayISO()) return t('date.today')
  if (iso === addDays(todayISO(), -1)) return t('date.yesterday')
  if (iso === addDays(todayISO(), 1)) return t('date.tomorrow')
  return formatDateShort(iso)
}

/** Formats a duration in milliseconds as "42 min" or "1h05". */
export function formatDuration(ms: number): string {
  const totalMinutes = Math.round(Math.max(0, ms) / 60_000)
  if (totalMinutes < 1) return '< 1 min'
  const h = Math.floor(totalMinutes / 60)
  const m = totalMinutes % 60
  return h === 0 ? `${m} min` : `${h}h${String(m).padStart(2, '0')}`
}

/** Full date in the current language: "18 septembre 2026" / "18 September 2026". */
export function formatDateLong(iso: string): string {
  const { y, m, d } = parts(iso)
  return `${d} ${MONTHS_FULL[getLang()][m - 1]} ${y}`
}
