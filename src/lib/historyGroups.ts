import { formatMonthFr } from './date'
import type { WorkoutSummary } from '../hooks/useHistory'

export interface MonthGroup {
  /** yyyy-mm */
  key: string
  /** "Octobre 2026" */
  label: string
  sessions: WorkoutSummary[]
  volume: number
}

export interface HistoryFilters {
  /** '' = all, 'free' = sessions not started from a program, otherwise a template id. */
  program: string
  /** '' = all, otherwise an exercise id. */
  exercise: string
}

export function applyHistoryFilters(history: WorkoutSummary[], filters: HistoryFilters): WorkoutSummary[] {
  const programId = filters.program && filters.program !== 'free' ? Number(filters.program) : null
  const exerciseId = filters.exercise ? Number(filters.exercise) : null
  return history.filter((s) => {
    if (filters.program === 'free' && s.workout.templateId != null) return false
    if (programId != null && s.workout.templateId !== programId) return false
    if (exerciseId != null && !s.exerciseIds.includes(exerciseId)) return false
    return true
  })
}

/** Groups sessions (already newest first) by calendar month, newest month first. */
export function groupByMonth(sessions: WorkoutSummary[]): MonthGroup[] {
  const groups: MonthGroup[] = []
  for (const s of sessions) {
    const key = s.workout.date.slice(0, 7)
    let group = groups[groups.length - 1]
    if (!group || group.key !== key) {
      const label = formatMonthFr(`${key}-01`)
      group = { key, label: label.charAt(0).toUpperCase() + label.slice(1), sessions: [], volume: 0 }
      groups.push(group)
    }
    group.sessions.push(s)
    group.volume += s.volume
  }
  return groups
}

export interface VisibleMonth {
  group: MonthGroup
  open: boolean
  /** Rows to render (only for an open month, within the progressive budget). */
  rows: WorkoutSummary[]
}

/**
 * Lays out the list under a progressive-display budget: only rows of open
 * months count against it, collapsed months cost nothing (header only). Stops
 * at the first open month the budget can't fully show, and reports how many
 * open-month sessions remain hidden behind "Voir plus".
 */
export function layoutMonths(
  groups: MonthGroup[],
  isOpen: (key: string) => boolean,
  limit: number,
): { months: VisibleMonth[]; remaining: number } {
  const months: VisibleMonth[] = []
  let budget = limit
  for (let i = 0; i < groups.length; i++) {
    const group = groups[i]
    const open = isOpen(group.key)
    if (!open) {
      months.push({ group, open, rows: [] })
      continue
    }
    if (budget <= 0) {
      const remaining = groups.slice(i).reduce((n, g) => n + (isOpen(g.key) ? g.sessions.length : 0), 0)
      return { months, remaining }
    }
    const rows = group.sessions.slice(0, budget)
    budget -= rows.length
    months.push({ group, open, rows })
    if (rows.length < group.sessions.length) {
      const remaining =
        group.sessions.length - rows.length +
        groups.slice(i + 1).reduce((n, g) => n + (isOpen(g.key) ? g.sessions.length : 0), 0)
      return { months, remaining }
    }
  }
  return { months, remaining: 0 }
}
