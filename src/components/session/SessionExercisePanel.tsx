import { useEffect, useRef, useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import type { LoadType, WorkoutExerciseWithSets } from '../../types'
import { EQUIPMENT_LABEL } from '../../types'
import { useLastPerformance } from '../../hooks/useLastPerformance'
import { usePreferences } from '../../hooks/usePreferences'
import { useSnackbar } from '../../contexts/SnackbarContext'
import { getBestSet } from '../../lib/performance'
import { getSuggestedProgression } from '../../lib/progression'
import { equipmentOf } from '../../lib/exerciseSearch'
import { secondaryGroupsOf } from '../../lib/muscleGroups'
import { hapticLight } from '../../lib/haptics'
import { formatWeight } from '../../lib/stats'
import {
  addSet,
  duplicateExerciseInWorkout,
  duplicateSet,
  removeExerciseFromWorkout,
  removeSet,
  restoreExercise,
  restoreSet,
  setSetDone,
  updateExerciseNote,
  updateSet,
} from '../../lib/workoutActions'
import { ContextMenuSheet } from '../ContextMenuSheet'
import { ExerciseInfoSheet } from '../ExerciseInfoSheet'
import { PlateCalculatorSheet } from '../PlateCalculatorSheet'
import { CopyIcon, DumbbellIcon, InfoIcon, ListIcon, MoreIcon, NoteIcon, PlusIcon, StarIcon, TrashIcon, XIcon } from '../Icons'
import { SET_GRID, SessionSetRow } from './SessionSetRow'
import { equipmentLabel, groupLabel, t } from '../../i18n'

const PLATE_CALC_LOAD_TYPES: LoadType[] = ['Barre libre', 'Machine à plaques']

function kg(n: number): string {
  return formatWeight(n)
}

/** "60 kg × 8 · 8 · 7" when every set used the same weight, else "60×8 · 62,5×6". */
function formatLastTime(sets: { weight: number; reps: number }[]): string {
  if (sets.length === 0) return ''
  if (sets.every((s) => s.weight === sets[0].weight)) {
    return `${kg(sets[0].weight)} kg × ${sets.map((s) => s.reps).join(' · ')}`
  }
  return sets.map((s) => `${kg(s.weight)}×${s.reps}`).join(' · ')
}

interface SessionExercisePanelProps {
  we: WorkoutExerciseWithSets
  workoutId: number
  position: number
  total: number
  onOpenOverview: () => void
  /** Called after the exercise was removed from the session. */
  onRemoved: () => void
  /** A set was just ticked: the screen starts the rest timer. */
  onSetDone: () => void
  showHint: boolean
  onDismissHint: () => void
}

/** The focused one-exercise view of session mode. */
export function SessionExercisePanel({
  we,
  workoutId,
  position,
  total,
  onOpenOverview,
  onRemoved,
  onSetDone,
  showHint,
  onDismissHint,
}: SessionExercisePanelProps) {
  const preferences = usePreferences()
  const { showSnackbar } = useSnackbar()
  const lastTime = useLastPerformance(we.exerciseId, workoutId)
  // Best set before this session: the bar to beat, and what makes a ticked set a record.
  const bestSet = useLiveQuery(() => getBestSet(we.exerciseId, workoutId), [we.exerciseId, workoutId])
  const [menuOpen, setMenuOpen] = useState(false)
  const [infoOpen, setInfoOpen] = useState(false)
  const [plateOpen, setPlateOpen] = useState(false)
  const [noteOpen, setNoteOpen] = useState(false)
  const [noteText, setNoteText] = useState(we.note ?? '')
  const noteTimeout = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)
  useEffect(() => () => clearTimeout(noteTimeout.current), [])

  const equipment = equipmentOf(we.exercise)
  const secondary = secondaryGroupsOf(we.exercise)
  const currentIndex = we.sets.findIndex((s) => !s.done)
  const suggestion = we.sets.length === 0 ? getSuggestedProgression(lastTime) : null
  const canPlate = PLATE_CALC_LOAD_TYPES.includes(we.exercise.loadType)
  const plateWeight = (we.sets[currentIndex] ?? we.sets[we.sets.length - 1])?.weight ?? 0

  /** A ticked set that beats the previous best (heavier, or same weight for more reps). */
  function isPR(set: { weight: number; reps: number; done?: boolean }): boolean {
    if (!set.done || !bestSet || set.weight <= 0 || set.reps <= 0) return false
    return set.weight > bestSet.weight || (set.weight === bestSet.weight && set.reps > bestSet.reps)
  }

  function changeNote(value: string) {
    setNoteText(value)
    clearTimeout(noteTimeout.current)
    noteTimeout.current = setTimeout(() => updateExerciseNote(we.id!, value), 400)
  }

  async function handleAddSet(override?: { weight: number; reps: number }) {
    await addSet(we.id!, override)
    hapticLight(!!preferences?.hapticsEnabled)
  }

  async function handleRemoveSet(setId: number) {
    const removed = we.sets.find((s) => s.id === setId)
    await removeSet(setId)
    if (removed) showSnackbar(t('card.setRemoved'), () => restoreSet(removed))
  }

  async function handleToggle(setId: number, done: boolean) {
    await setSetDone(setId, !done)
    if (!done) {
      hapticLight(!!preferences?.hapticsEnabled)
      onSetDone()
    }
  }

  async function handleRemoveExercise() {
    const link = { id: we.id, workoutId: we.workoutId, exerciseId: we.exerciseId, order: we.order, note: we.note }
    const sets = [...we.sets]
    await removeExerciseFromWorkout(we.id!)
    onRemoved()
    showSnackbar(t('card.exerciseRemoved'), () => restoreExercise(link, sets))
  }

  return (
    <div>
      <div className="mb-1 flex items-center justify-between gap-2">
        <button
          type="button"
          onClick={onOpenOverview}
          className="-ml-1 flex min-h-11 items-center gap-1.5 rounded-xl px-1 text-sm font-semibold text-muted active:bg-surface-3"
        >
          <ListIcon className="h-4 w-4" />
          {t('panel.position', { position, total })}
        </button>
        <button
          type="button"
          onClick={() => setMenuOpen(true)}
          aria-label={t('panel.options')}
          className="flex h-11 w-11 items-center justify-center rounded-full text-muted active:bg-surface-3"
        >
          <MoreIcon className="h-5 w-5" />
        </button>
      </div>

      <h1 className="font-exercise !text-[2.4rem] !leading-[1.02] text-ink">{we.exercise.name}</h1>
      <p className="mt-1.5 text-sm text-muted">
        {[equipment ? equipmentLabel(EQUIPMENT_LABEL[equipment]) : null, [we.exercise.muscleGroup, ...secondary].map(groupLabel).join(', ')]
          .filter(Boolean)
          .join(' · ')}
      </p>

      {(lastTime || bestSet) && (
        <div className="mt-3 flex flex-wrap gap-1.5">
          {lastTime && (
            <span className="rounded-full bg-surface-3 px-3 py-1.5 text-xs font-semibold text-ink-2">
              {t('panel.lastTime')} <span className="font-numbers text-[0.85rem] text-ink">{formatLastTime(lastTime.sets)}</span>
            </span>
          )}
          {bestSet && (
            <span className="flex items-center gap-1 rounded-full bg-highlight-soft px-3 py-1.5 text-xs font-semibold text-highlight-ink">
              <StarIcon className="h-3.5 w-3.5" />
              {t('panel.record')} <span className="font-numbers text-[0.85rem]">{kg(bestSet.weight)} kg × {bestSet.reps}</span>
            </span>
          )}
        </div>
      )}

      {lastTime?.note && <p className="mt-2 text-xs italic text-highlight-ink">{t('panel.lastNote', { note: lastTime.note })}</p>}
      {!noteOpen && noteText.trim() && (
        <button type="button" onClick={() => setNoteOpen(true)} className="mt-2 block text-left text-xs text-accent-ink">
          {noteText}
        </button>
      )}
      {noteOpen && (
        <textarea
          autoFocus
          value={noteText}
          onChange={(e) => changeNote(e.target.value)}
          onBlur={() => setNoteOpen(false)}
          placeholder={t('panel.notePlaceholder')}
          rows={2}
          className="mt-3 w-full resize-none rounded-xl border border-line bg-surface-2 px-3 py-2 text-sm outline-none focus:border-accent-line"
        />
      )}

      {suggestion && (
        <button
          type="button"
          onClick={() => handleAddSet({ weight: suggestion.weight, reps: suggestion.reps })}
          className="mt-3 flex w-full items-center justify-between gap-2 rounded-xl bg-good-soft px-3 py-2.5 text-left text-xs text-good-ink active:opacity-80"
        >
          <span>
            {t('panel.suggest', { weight: `${kg(suggestion.weight)} kg`, step: kg(suggestion.step) })}
          </span>
          <span className="shrink-0 font-semibold underline">{t('card.apply')}</span>
        </button>
      )}

      <div className="mt-4">
        <div className={`${SET_GRID} px-1 pb-1.5 text-center text-[11px] font-bold uppercase tracking-wide text-muted`}>
          <span>{t('panel.colSet')}</span>
          <span>{t('panel.colKg')}</span>
          <span>{t('panel.colReps')}</span>
          <span>{t('panel.colOk')}</span>
        </div>
        <div className="space-y-1.5">
          {we.sets.map((set, i) => (
            <SessionSetRow
              key={set.id}
              set={set}
              index={i}
              current={i === currentIndex}
              isPR={isPR(set)}
              onChangeWeight={(weight) => updateSet(set.id!, { weight })}
              onChangeReps={(reps) => updateSet(set.id!, { reps })}
              onToggleDone={() => handleToggle(set.id!, !!set.done)}
              onRemove={() => handleRemoveSet(set.id!)}
              onDuplicate={() => duplicateSet(set.id!)}
            />
          ))}
        </div>
        <button
          type="button"
          onClick={() => handleAddSet()}
          className="mt-2 flex min-h-12 w-full items-center justify-center gap-1.5 rounded-xl border-2 border-dashed border-line-strong text-sm font-semibold text-ink-2 active:bg-surface-3"
        >
          <PlusIcon className="h-4 w-4" />
          {t('card.addSet')}
        </button>
        {showHint && we.sets.length > 0 && (
          <div className="mt-2 flex items-center gap-1">
            <p className="flex-1 text-center text-xs text-muted">
              {t('panel.hint')}
            </p>
            <button
              type="button"
              onClick={onDismissHint}
              aria-label={t('panel.hideHint')}
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-faint active:bg-surface-3"
            >
              <XIcon className="h-4 w-4" />
            </button>
          </div>
        )}
      </div>

      {menuOpen && (
        <ContextMenuSheet
          title={we.exercise.name}
          actions={[
            { label: t('panel.details'), icon: InfoIcon, onSelect: () => setInfoOpen(true) },
            { label: noteText.trim() ? t('panel.editNote') : t('panel.addNote'), icon: NoteIcon, onSelect: () => setNoteOpen(true) },
            ...(canPlate ? [{ label: t('set.plateCalc'), icon: DumbbellIcon, onSelect: () => setPlateOpen(true) }] : []),
            { label: t('panel.allExercises'), icon: ListIcon, onSelect: onOpenOverview },
            { label: t('panel.duplicate'), icon: CopyIcon, onSelect: () => duplicateExerciseInWorkout(we.id!) },
            { label: t('card.removeFromWorkout'), icon: TrashIcon, onSelect: handleRemoveExercise, danger: true },
          ]}
          onClose={() => setMenuOpen(false)}
        />
      )}
      {infoOpen && <ExerciseInfoSheet exerciseId={we.exerciseId} fallback={we.exercise} onClose={() => setInfoOpen(false)} />}
      {plateOpen && (
        <PlateCalculatorSheet initialWeight={plateWeight} loadType={we.exercise.loadType} onClose={() => setPlateOpen(false)} />
      )}
    </div>
  )
}
