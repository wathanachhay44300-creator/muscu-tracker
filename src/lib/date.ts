/** Converts a Date to yyyy-mm-dd in local time (not UTC). */
export function dateToISO(d: Date): string {
  const offset = d.getTimezoneOffset()
  return new Date(d.getTime() - offset * 60_000).toISOString().slice(0, 10)
}

/** Returns today's date as yyyy-mm-dd, in local time (not UTC). */
export function todayISO(): string {
  return dateToISO(new Date())
}

const WEEKDAYS_FR = ['dim', 'lun', 'mar', 'mer', 'jeu', 'ven', 'sam']
const MONTHS_FR = [
  'jan',
  'fév',
  'mar',
  'avr',
  'mai',
  'juin',
  'juil',
  'août',
  'sep',
  'oct',
  'nov',
  'déc',
]

/** Formats an ISO yyyy-mm-dd date as "lun 14 sep 2026". */
export function formatDateFr(iso: string, opts: { withYear?: boolean } = {}): string {
  const [y, m, d] = iso.split('-').map(Number)
  const date = new Date(y, m - 1, d)
  const weekday = WEEKDAYS_FR[date.getDay()]
  const month = MONTHS_FR[m - 1]
  const year = opts.withYear === false ? '' : ` ${y}`
  return `${weekday} ${d} ${month}${year}`
}

/** Adds (or subtracts) days to an ISO yyyy-mm-dd date, returning a new ISO date. */
export function addDays(iso: string, delta: number): string {
  const [y, m, d] = iso.split('-').map(Number)
  return dateToISO(new Date(y, m - 1, d + delta))
}

export function isToday(iso: string): boolean {
  return iso === todayISO()
}

/** Human label: "Aujourd'hui", "Hier", "Demain", or the formatted date. */
export function relativeDateLabel(iso: string): string {
  if (iso === todayISO()) return "Aujourd'hui"
  if (iso === addDays(todayISO(), -1)) return 'Hier'
  if (iso === addDays(todayISO(), 1)) return 'Demain'
  return formatDateFr(iso)
}
