import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '../db'
import { addDays, relativeDateLabel, todayISO } from '../lib/date'
import { formatReps, formatWeight } from '../lib/stats'
import { formatInt, formatKg } from '../lib/tracking'
import { ActivityIcon, ChartIcon, ChevronRightIcon, ScaleIcon, SearchIcon, StarIcon } from '../components/Icons'
import { t, tn } from '../i18n'
import { EmptyMochi } from '../components/kawaii/Mochi'

interface ExerciseProgress {
  id: number
  name: string
  bestWeight: number
  bestReps: number
  lastDate: string
  sessions: number
}

const SHOWN = 12

/** Progrès tab: body tracking, weekly muscle breakdown, and per-exercise records & charts. */
export function ProgresScreen() {
  const [showAll, setShowAll] = useState(false)
  const [query, setQuery] = useState('')

  const body = useLiveQuery(async () => {
    const today = todayISO()
    const rows = await db.bodyMeasurements.where('date').between(addDays(today, -6), today, true, true).toArray()
    const avg = (vals: (number | undefined)[]) => {
      const v = vals.filter((x): x is number => x != null)
      return v.length ? v.reduce((a, b) => a + b, 0) / v.length : null
    }
    return { weight: avg(rows.map((r) => r.weight)), steps: avg(rows.map((r) => r.steps)), calories: avg(rows.map((r) => r.calories)) }
  }, [])

  const exercises = useLiveQuery(async (): Promise<ExerciseProgress[]> => {
    const [workouts, links, sets, all] = await Promise.all([
      db.workouts.toArray(),
      db.workoutExercises.toArray(),
      db.sets.toArray(),
      db.exercises.toArray(),
    ])
    const dateOf = new Map(workouts.map((w) => [w.id!, w.date]))
    const linkOf = new Map(links.map((l) => [l.id!, l]))
    const byExercise = new Map<number, ExerciseProgress & { workouts: Set<number> }>()
    const nameOf = new Map(all.map((e) => [e.id!, e.name]))
    for (const s of sets) {
      if (s.weight <= 0 && s.reps <= 0) continue
      const link = linkOf.get(s.workoutExerciseId)
      if (!link) continue
      const date = dateOf.get(link.workoutId)
      const name = nameOf.get(link.exerciseId)
      if (!date || !name) continue
      let e = byExercise.get(link.exerciseId)
      if (!e) {
        e = { id: link.exerciseId, name, bestWeight: 0, bestReps: 0, lastDate: date, sessions: 0, workouts: new Set() }
        byExercise.set(link.exerciseId, e)
      }
      if (s.weight > e.bestWeight || (s.weight === e.bestWeight && s.reps > e.bestReps)) {
        e.bestWeight = s.weight
        e.bestReps = s.reps
      }
      if (date > e.lastDate) e.lastDate = date
      e.workouts.add(link.workoutId)
    }
    return [...byExercise.values()]
      .map(({ workouts: w, ...rest }) => ({ ...rest, sessions: w.size }))
      .sort((a, b) => (a.lastDate === b.lastDate ? a.name.localeCompare(b.name) : a.lastDate < b.lastDate ? 1 : -1))
  }, [])

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')
    if (!q) return exercises ?? []
    return (exercises ?? []).filter((e) =>
      e.name.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').includes(q),
    )
  }, [exercises, query])
  const list = showAll || query ? filtered : filtered.slice(0, SHOWN)

  return (
    <div className="mx-auto max-w-md px-4 pt-safe pb-28 pt-4 animate-fade-in">
      <h1 className="mb-5 pt-2 !text-[2rem] leading-none text-ink">{t('screens.progress')}</h1>

      <div className="space-y-2.5">
        <Link
          to="/suivi"
          className="flex items-center gap-3 rounded-2xl border border-line bg-surface px-4 py-3.5 active:bg-surface-2"
        >
          <ActivityIcon className="h-6 w-6 shrink-0 text-accent-ink" />
          <div className="min-w-0 flex-1">
            <p className="font-semibold text-ink">{t('progress.trackingTitle')}</p>
            <p className="text-xs text-muted">
              {body && (body.weight != null || body.steps != null || body.calories != null)
                ? [
                    body.weight != null && `${formatKg(body.weight)} kg`,
                    body.steps != null && t('progress.stepsPerDay', { n: formatInt(body.steps) }),
                    body.calories != null && t('progress.kcalPerDay', { n: formatInt(body.calories) }),
                  ]
                    .filter(Boolean)
                    .join(' · ') + t('progress.avg7')
                : t('progress.trackingHint')}
            </p>
          </div>
          <ChevronRightIcon className="h-5 w-5 shrink-0 text-faint" />
        </Link>
        <Link
          to="/corps"
          className="flex items-center gap-3 rounded-2xl border border-line bg-surface px-4 py-3.5 active:bg-surface-2"
        >
          <ScaleIcon className="h-6 w-6 shrink-0 text-accent-ink" />
          <div className="min-w-0 flex-1">
            <p className="font-semibold text-ink">{t('screens.body')}</p>
            <p className="text-xs text-muted">{t('progress.bodyHint')}</p>
          </div>
          <ChevronRightIcon className="h-5 w-5 shrink-0 text-faint" />
        </Link>
        <Link
          to="/progres/muscles"
          className="flex items-center gap-3 rounded-2xl border border-line bg-surface px-4 py-3.5 active:bg-surface-2"
        >
          <ChartIcon className="h-6 w-6 shrink-0 text-accent-ink" />
          <div className="min-w-0 flex-1">
            <p className="font-semibold text-ink">{t('progress.musclesTitle')}</p>
            <p className="text-xs text-muted">{t('progress.musclesHint')}</p>
          </div>
          <ChevronRightIcon className="h-5 w-5 shrink-0 text-faint" />
        </Link>
      </div>

      <h2 className="mb-1 mt-7 px-1 text-ink">{t('progress.records')}</h2>
      <p className="mb-3 px-1 text-xs text-muted">{t('progress.recordsHint')}</p>

      {exercises && exercises.length > 6 && (
        <div className="mb-3 flex items-center gap-2 rounded-xl bg-surface-3 px-3 py-2.5">
          <SearchIcon className="h-4 w-4 shrink-0 text-muted" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t('progress.search')}
            enterKeyHint="search"
            className="w-full bg-transparent text-base outline-none placeholder:text-muted"
          />
        </div>
      )}

      {exercises && exercises.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-line-strong px-4 py-10 text-center text-sm text-muted">
          <EmptyMochi className="mb-2" />
          {t('progress.empty')}
        </p>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-line bg-surface">
          {list.map((e, i) => (
            <Link
              key={e.id}
              to={`/exercices/${e.id}`}
              className={`flex min-h-14 items-center gap-3 px-4 py-2.5 active:bg-surface-2 ${i > 0 ? 'border-t border-line' : ''}`}
            >
              <div className="min-w-0 flex-1">
                <p className="font-exercise truncate text-[1.05rem] text-ink">{e.name}</p>
                <p className="text-xs text-muted">
                  {tn('common.sessions', e.sessions)} · {relativeDateLabel(e.lastDate).toLowerCase()}
                </p>
              </div>
              {e.bestWeight > 0 && (
                <span className="flex shrink-0 items-center gap-1 rounded-full bg-highlight-soft px-2.5 py-1 text-highlight-ink">
                  <StarIcon className="h-3.5 w-3.5" />
                  <span className="font-numbers text-sm font-bold">
                    {formatWeight(e.bestWeight)} kg × {formatReps(e.bestReps)}
                  </span>
                </span>
              )}
              <ChevronRightIcon className="h-4 w-4 shrink-0 text-faint" />
            </Link>
          ))}
        </div>
      )}
      {!showAll && !query && filtered.length > SHOWN && (
        <button
          type="button"
          onClick={() => setShowAll(true)}
          className="mt-2 w-full rounded-2xl bg-surface-3 py-3.5 text-sm font-semibold text-ink-2 active:bg-surface-4"
        >
          {t('common.seeMoreCount', { n: filtered.length - SHOWN })}
        </button>
      )}
    </div>
  )
}
