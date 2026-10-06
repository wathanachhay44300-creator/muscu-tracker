import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '../db'
import { BackToTopButton } from '../components/BackToTopButton'
import { ContextMenuSheet } from '../components/ContextMenuSheet'
import { RenameSheet } from '../components/RenameSheet'
import { PullToRefreshIndicator } from '../components/PullToRefreshIndicator'
import { useLongPress } from '../hooks/useLongPress'
import { usePreferences } from '../hooks/usePreferences'
import { usePullToRefresh } from '../hooks/usePullToRefresh'
import { useWorkoutHistory, type WorkoutSummary } from '../hooks/useHistory'
import { hapticMenuOpen } from '../lib/haptics'
import { updateWorkoutTitle } from '../lib/workoutActions'
import { applyHistoryFilters, groupByMonth, layoutMonths, type MonthGroup } from '../lib/historyGroups'
import { formatDateFr } from '../lib/date'
import { formatVolume } from '../lib/stats'
import {
  ActivityIcon,
  CalendarIcon,
  ChartIcon,
  ChevronRightIcon,
  DownloadIcon,
  PencilIcon,
  ScaleIcon,
  SettingsIcon,
  XIcon,
} from '../components/Icons'

const PAGE_SIZE = 10

const SHORTCUTS = [
  { to: '/historique/calendrier', label: 'Calendrier', icon: CalendarIcon },
  { to: '/historique/semaine', label: 'Muscles', icon: ChartIcon },
  { to: '/suivi', label: 'Pas · poids · kcal', icon: ActivityIcon },
  { to: '/corps', label: 'Poids & mesures', icon: ScaleIcon },
  { to: '/donnees', label: 'Export / import', icon: DownloadIcon },
  { to: '/reglages', label: 'Réglages', icon: SettingsIcon },
]

export function HistoriqueScreen() {
  const history = useWorkoutHistory()
  const pullToRefresh = usePullToRefresh()
  const templates = useLiveQuery(() => db.workoutTemplates.toArray(), [])
  const exercises = useLiveQuery(() => db.exercises.toArray(), [])

  const [program, setProgram] = useState('')
  const [exercise, setExercise] = useState('')
  const [limit, setLimit] = useState(PAGE_SIZE)
  // Per-month open/closed choices made by the user; anything not chosen
  // follows the default (see isOpen below).
  const [overrides, setOverrides] = useState<Record<string, boolean>>({})

  const filtersActive = program !== '' || exercise !== ''
  const all = useMemo(() => history ?? [], [history])
  const filtered = useMemo(() => applyHistoryFilters(all, { program, exercise }), [all, program, exercise])
  const groups = useMemo(() => groupByMonth(filtered), [filtered])

  // The newest month is open on arrival (it's the current month whenever it has
  // sessions) so the latest session is visible without scrolling; when
  // filtering, every month is open so no result hides behind a fold.
  const defaultOpenKey = groups[0]?.key
  const { months, remaining } = useMemo(
    () => layoutMonths(groups, (key) => overrides[key] ?? (filtersActive || key === defaultOpenKey), limit),
    [groups, overrides, filtersActive, defaultOpenKey, limit],
  )

  // Filter choices: only programs / exercises that were actually used.
  const programOptions = useMemo(() => {
    const used = new Set(all.map((s) => s.workout.templateId).filter((id): id is number => id != null))
    const list = (templates ?? [])
      .filter((t) => used.has(t.id!))
      .map((t) => ({ value: String(t.id), label: t.name }))
      .sort((a, b) => a.label.localeCompare(b.label, 'fr'))
    if (all.some((s) => s.workout.templateId == null)) list.push({ value: 'free', label: 'Séance libre' })
    return list
  }, [all, templates])
  const exerciseOptions = useMemo(() => {
    const used = new Set(all.flatMap((s) => s.exerciseIds))
    return (exercises ?? [])
      .filter((e) => used.has(e.id!))
      .map((e) => ({ value: String(e.id), label: e.name }))
      .sort((a, b) => a.label.localeCompare(b.label, 'fr'))
  }, [all, exercises])

  function changeFilter(setter: (v: string) => void, value: string) {
    setter(value)
    setLimit(PAGE_SIZE)
    setOverrides({})
  }

  const programLabel = programOptions.find((o) => o.value === program)?.label
  const exerciseLabel = exerciseOptions.find((o) => o.value === exercise)?.label

  return (
    <div
      className="mx-auto max-w-md px-4 pt-safe pb-28 pt-4 animate-fade-in"
      onPointerDown={pullToRefresh.handlers.onPointerDown}
      onPointerMove={pullToRefresh.handlers.onPointerMove}
      onPointerUp={pullToRefresh.handlers.onPointerUp}
      onPointerCancel={pullToRefresh.handlers.onPointerCancel}
    >
      <PullToRefreshIndicator indicatorRef={pullToRefresh.indicatorRef} refreshing={pullToRefresh.refreshing} />
      <h1 className="mb-3 text-lg font-bold text-slate-900">Historique</h1>

      {/* Compact shortcuts: a single scrollable row instead of a tall list, so sessions start high on screen. */}
      <div className="-mx-4 mb-3 flex gap-2 overflow-x-auto px-4 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {SHORTCUTS.map((s) => (
          <Link
            key={s.to}
            to={s.to}
            className="flex min-h-11 shrink-0 items-center gap-1.5 rounded-full border border-slate-200 bg-surface px-3.5 text-xs font-semibold text-slate-700 shadow-sm active:bg-slate-100"
          >
            <s.icon className="h-4 w-4 text-accent" />
            {s.label}
          </Link>
        ))}
      </div>

      {all.length > 0 && (
        <div className="mb-2 grid grid-cols-2 gap-2">
          <FilterSelect
            label="Programme"
            value={program}
            options={programOptions}
            onChange={(v) => changeFilter(setProgram, v)}
          />
          <FilterSelect
            label="Exercice"
            value={exercise}
            options={exerciseOptions}
            onChange={(v) => changeFilter(setExercise, v)}
          />
        </div>
      )}

      {filtersActive && (
        <div className="mb-2 flex flex-wrap items-center gap-1.5">
          {program !== '' && <FilterChip label={programLabel ?? 'Programme'} onClear={() => changeFilter(setProgram, '')} />}
          {exercise !== '' && <FilterChip label={exerciseLabel ?? 'Exercice'} onClear={() => changeFilter(setExercise, '')} />}
        </div>
      )}

      {all.length > 0 && (
        <p className="mb-1 px-1 text-xs font-medium text-slate-400" aria-live="polite">
          {filtered.length} séance{filtered.length > 1 ? 's' : ''}
          {filtersActive && ` sur ${all.length}`}
        </p>
      )}

      {history && all.length === 0 && (
        <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-slate-300 px-4 py-14 text-center">
          <CalendarIcon className="h-10 w-10 text-slate-300" />
          <p className="font-medium text-slate-600">Pas encore de séance enregistrée</p>
          <p className="text-sm text-slate-400">Vos séances passées apparaîtront ici une fois enregistrées.</p>
        </div>
      )}

      {all.length > 0 && filtered.length === 0 && (
        <div className="rounded-2xl border border-dashed border-slate-300 px-4 py-10 text-center">
          <p className="font-medium text-slate-600">Aucune séance ne correspond à ces filtres</p>
          <button
            type="button"
            onClick={() => {
              setProgram('')
              setExercise('')
            }}
            className="mt-3 rounded-full bg-slate-100 px-4 py-2.5 text-sm font-semibold text-slate-700 active:bg-slate-200"
          >
            Effacer les filtres
          </button>
        </div>
      )}

      {months.map(({ group, open, rows }) => (
        <MonthSection
          key={group.key}
          group={group}
          open={open}
          rows={rows}
          onToggle={() => setOverrides((o) => ({ ...o, [group.key]: !open }))}
        />
      ))}

      {remaining > 0 && (
        <button
          type="button"
          onClick={() => setLimit((l) => l + PAGE_SIZE)}
          className="mt-2 w-full rounded-2xl bg-slate-100 py-3.5 text-sm font-semibold text-slate-700 active:bg-slate-200"
        >
          Voir plus ({remaining} séance{remaining > 1 ? 's' : ''} restante{remaining > 1 ? 's' : ''})
        </button>
      )}

      <BackToTopButton />
    </div>
  )
}

function FilterSelect({
  label,
  value,
  options,
  onChange,
}: {
  label: string
  value: string
  options: { value: string; label: string }[]
  onChange: (v: string) => void
}) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      aria-label={label}
      className={`h-11 min-w-0 rounded-xl border bg-surface px-3 text-sm outline-none ${
        value ? 'border-brand-400 font-semibold text-accent' : 'border-slate-200 text-slate-500'
      }`}
    >
      <option value="">{label}</option>
      {options.map((o) => (
        <option key={o.value} value={o.value}>
          {o.label}
        </option>
      ))}
    </select>
  )
}

function FilterChip({ label, onClear }: { label: string; onClear: () => void }) {
  return (
    <button
      type="button"
      onClick={onClear}
      aria-label={`Retirer le filtre ${label}`}
      className="flex min-h-9 items-center gap-1.5 rounded-full bg-brand-50 py-1.5 pl-3 pr-2.5 text-xs font-semibold text-accent active:bg-brand-100"
    >
      <span className="max-w-[10rem] truncate">{label}</span>
      <XIcon className="h-3.5 w-3.5" />
    </button>
  )
}

const FOLD_MS = 240

function MonthSection({
  group,
  open,
  rows,
  onToggle,
}: {
  group: MonthGroup
  open: boolean
  rows: WorkoutSummary[]
  onToggle: () => void
}) {
  // Rows are kept mounted just long enough for the closing animation to play
  // (the parent hands over no rows once a month is closed).
  const [shown, setShown] = useState(rows)
  useEffect(() => {
    if (rows.length > 0) {
      setShown(rows)
      return
    }
    const t = setTimeout(() => setShown([]), FOLD_MS)
    return () => clearTimeout(t)
  }, [rows])

  const count = group.sessions.length
  return (
    <section className="mb-1">
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={open}
        className="sticky z-10 -mx-4 flex min-h-12 w-[calc(100%+2rem)] items-center justify-between gap-2 border-b border-slate-200/70 bg-page px-5 py-2 text-left active:bg-slate-100"
        style={{ top: 'env(safe-area-inset-top, 0px)' }}
      >
        <span className="flex items-center gap-2">
          <ChevronRightIcon
            className="h-4 w-4 shrink-0 text-slate-400"
            style={{ transform: open ? 'rotate(90deg)' : 'none', transition: 'transform 200ms ease' }}
          />
          <span className="font-display text-base text-slate-900">{group.label}</span>
        </span>
        <span className="text-xs font-medium tabular-nums text-slate-500">
          {count} séance{count > 1 ? 's' : ''}
          {group.volume > 0 && <> · {formatVolume(group.volume)} kg</>}
        </span>
      </button>

      <div
        className="grid"
        style={{
          gridTemplateRows: open ? '1fr' : '0fr',
          transition: `grid-template-rows ${FOLD_MS}ms cubic-bezier(0.22, 1, 0.36, 1)`,
        }}
      >
        <div className="overflow-hidden" inert={!open}>
          {shown.length > 0 && (
            <div className="my-2 overflow-hidden rounded-xl border border-slate-200 bg-surface shadow-sm">
              {shown.map((summary, i) => (
                <SessionRow key={summary.workout.id} summary={summary} bordered={i > 0} />
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  )
}

/** One session on a single line: date, program (or "Séance libre"), total volume. Tap opens the detail; long-press offers "Renommer". */
function SessionRow({ summary, bordered }: { summary: WorkoutSummary; bordered: boolean }) {
  const { workout, volume, title } = summary
  const navigate = useNavigate()
  const preferences = usePreferences()
  const [menuOpen, setMenuOpen] = useState(false)
  const [renaming, setRenaming] = useState(false)
  const longPress = useLongPress(() => {
    hapticMenuOpen(!!preferences?.hapticsEnabled)
    setMenuOpen(true)
  })
  const open = () => navigate(`/historique/${workout.id}`)

  return (
    <>
      {/* A div (not <a>): Safari would show its link-preview menu on long-press. */}
      <div
        role="link"
        tabIndex={0}
        onClick={open}
        onKeyDown={(e) => e.key === 'Enter' && open()}
        onContextMenu={longPress.onContextMenu}
        onPointerDown={longPress.onPointerDown}
        onPointerMove={longPress.onPointerMove}
        onPointerUp={longPress.onPointerUp}
        onPointerCancel={longPress.onPointerCancel}
        onClickCapture={longPress.onClickCapture}
        className={`flex min-h-12 cursor-pointer items-center gap-3 px-3.5 active:bg-slate-50 ${
          bordered ? 'border-t border-slate-100' : ''
        }`}
      >
        <span className="w-[4.25rem] shrink-0 text-xs font-medium text-slate-500">
          {formatDateFr(workout.date, { withYear: false })}
        </span>
        <span className="min-w-0 flex-1 truncate font-semibold text-slate-900">{title}</span>
        <span className="shrink-0 text-xs font-medium tabular-nums text-slate-500">
          {volume > 0 ? `${formatVolume(volume)} kg` : '—'}
        </span>
        <ChevronRightIcon className="h-4 w-4 shrink-0 text-slate-300" />
      </div>

      {menuOpen && (
        <ContextMenuSheet
          title={title}
          actions={[{ label: 'Renommer', icon: PencilIcon, onSelect: () => setRenaming(true) }]}
          onClose={() => setMenuOpen(false)}
        />
      )}

      {renaming && (
        <RenameSheet
          title="Renommer la séance"
          initialName={title}
          allowEmpty
          placeholder="Séance libre"
          onRename={(name) => {
            updateWorkoutTitle(workout.id!, name)
            setRenaming(false)
          }}
          onCancel={() => setRenaming(false)}
        />
      )}
    </>
  )
}
