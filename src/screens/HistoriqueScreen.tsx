import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
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
import { formatDateShort } from '../lib/date'
import { formatVolume } from '../lib/stats'
import { CalendarIcon, ChevronRightIcon, PencilIcon, XIcon } from '../components/Icons'
import { HistoryTabs } from '../components/HistoryTabs'
import { getLocale, t, tn } from '../i18n'
import { PlainOnly } from '../components/kawaii/Kawaii'
import { EmptyMochi } from '../components/kawaii/Mochi'

const PAGE_SIZE = 10


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
      .sort((a, b) => a.label.localeCompare(b.label, getLocale()))
    if (all.some((s) => s.workout.templateId == null)) list.push({ value: 'free', label: t('common.freeSession') })
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
      <h1 className="mb-4 pt-2 !text-[2rem] leading-none text-ink">{t('screens.history')}</h1>

      <HistoryTabs />

      {all.length > 0 && (
        <div className="mb-2 grid grid-cols-2 gap-2">
          <FilterSelect
            label={t('history.program')}
            value={program}
            options={programOptions}
            onChange={(v) => changeFilter(setProgram, v)}
          />
          <FilterSelect
            label={t('history.exercise')}
            value={exercise}
            options={exerciseOptions}
            onChange={(v) => changeFilter(setExercise, v)}
          />
        </div>
      )}

      {filtersActive && (
        <div className="mb-2 flex flex-wrap items-center gap-1.5">
          {program !== '' && <FilterChip label={programLabel ?? t('history.program')} onClear={() => changeFilter(setProgram, '')} />}
          {exercise !== '' && <FilterChip label={exerciseLabel ?? t('history.exercise')} onClear={() => changeFilter(setExercise, '')} />}
        </div>
      )}

      {all.length > 0 && (
        <p className="mb-1 px-1 text-xs font-medium text-muted" aria-live="polite">
          {tn('common.sessions', filtered.length)}
          {filtersActive && t('history.outOf', { n: all.length })}
        </p>
      )}

      {history && all.length === 0 && (
        <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-line-strong px-4 py-14 text-center">
          <PlainOnly>
            <CalendarIcon className="h-10 w-10 text-faint" />
          </PlainOnly>
          <EmptyMochi />
          <p className="font-medium text-ink-2">{t('history.empty')}</p>
          <p className="text-sm text-muted">{t('history.emptyHint')}</p>
        </div>
      )}

      {all.length > 0 && filtered.length === 0 && (
        <div className="rounded-2xl border border-dashed border-line-strong px-4 py-10 text-center">
          <EmptyMochi className="mb-2" />
          <p className="font-medium text-ink-2">{t('history.noMatch')}</p>
          <button
            type="button"
            onClick={() => {
              setProgram('')
              setExercise('')
            }}
            className="mt-3 rounded-full bg-surface-3 px-4 py-2.5 text-sm font-semibold text-ink-2 active:bg-surface-4"
          >
            {t('history.clearFilters')}
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
          className="mt-2 w-full rounded-2xl bg-surface-3 py-3.5 text-sm font-semibold text-ink-2 active:bg-surface-4"
        >
          {tn('history.moreRemaining', remaining)}
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
        value ? 'border-accent-line font-semibold text-accent-ink' : 'border-line text-muted'
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
      aria-label={t('history.removeFilter', { label })}
      className="flex min-h-9 items-center gap-1.5 rounded-full bg-accent-soft py-1.5 pl-3 pr-2.5 text-xs font-semibold text-accent-ink active:bg-accent-soft"
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
        className="sticky z-10 -mx-4 flex min-h-12 w-[calc(100%+2rem)] items-center justify-between gap-2 border-b border-line/70 bg-page px-5 py-2 text-left active:bg-surface-3"
        style={{ top: 'var(--sticky-top)' }}
      >
        <span className="flex items-center gap-2">
          <ChevronRightIcon
            className="h-4 w-4 shrink-0 text-muted"
            style={{ transform: open ? 'rotate(90deg)' : 'none', transition: 'transform 200ms ease' }}
          />
          <span className="font-display text-base text-ink">{group.label}</span>
        </span>
        <span className="text-xs font-medium tabular-nums text-muted">
          {tn('common.sessions', count)}
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
            <div className="my-2 overflow-hidden rounded-xl border border-line bg-surface shadow-sm">
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
        className={`flex min-h-12 cursor-pointer items-center gap-3 px-3.5 active:bg-surface-2 ${
          bordered ? 'border-t border-line' : ''
        }`}
      >
        <span className="w-[4.25rem] shrink-0 text-xs font-medium text-muted">
          {formatDateShort(workout.date, { withYear: false })}
        </span>
        <span className="min-w-0 flex-1 truncate font-semibold text-ink">{title}</span>
        <span className="shrink-0 text-xs font-medium tabular-nums text-muted">
          {volume > 0 ? `${formatVolume(volume)} kg` : '—'}
        </span>
        <ChevronRightIcon className="h-4 w-4 shrink-0 text-faint" />
      </div>

      {menuOpen && (
        <ContextMenuSheet
          title={title}
          actions={[{ label: t('common.rename'), icon: PencilIcon, onSelect: () => setRenaming(true) }]}
          onClose={() => setMenuOpen(false)}
        />
      )}

      {renaming && (
        <RenameSheet
          title={t('history.renameWorkout')}
          initialName={title}
          allowEmpty
          placeholder={t('common.freeSession')}
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
