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
import { CheckIcon, CopyIcon, DumbbellIcon, InfoIcon, ListIcon, MoreIcon, NoteIcon, SettingsIcon, StarIcon, TrashIcon, XIcon } from '../Icons'
import { SessionSetRow } from './SessionSetRow'
import { SetEditor } from './SetEditor'
import { setExerciseWeightStep } from '../../lib/exerciseActions'
import { equipmentLabel, formatDecimal, groupLabel, t } from '../../i18n'

const WEIGHT_STEP_CHOICES = [1, 1.25, 2, 2.5, 5]

/** Draws nothing: keeps menu labels aligned with the ticked one. */
function NoIcon(props: React.SVGProps<SVGSVGElement>) {
  return <svg {...props} aria-hidden="true" />
}

const PLATE_CALC_LOAD_TYPES: LoadType[] = ['Barre libre', 'Machine à plaques']

function kg(n: number): string {
  return formatWeight(n)
}

/** "60 kg", or "PDC" / "PDC +10 kg" for a bodyweight exercise. */
function formatLoad(weight: number, bodyweight: boolean): string {
  if (!bodyweight) return `${kg(weight)} kg`
  return weight > 0 ? `${t('editor.bw')} +${kg(weight)} kg` : t('editor.bw')
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
  const [stepOpen, setStepOpen] = useState(false)
  /** Set loaded in the editor: a set id, the next (unsaved) set, or null = automatic. */
  const [selected, setSelected] = useState<number | 'draft' | null>(null)
  /** Values being edited, tied to what's in the editor (`key`). */
  const [edit, setEdit] = useState<{ key: string; weight: number; reps: number } | null>(null)
  const noteTimeout = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)
  useEffect(() => () => clearTimeout(noteTimeout.current), [])

  const equipment = equipmentOf(we.exercise)
  const secondary = secondaryGroupsOf(we.exercise)
  const sets = we.sets
  const currentIndex = sets.findIndex((s) => !s.done)
  const suggestion = sets.length === 0 ? getSuggestedProgression(lastTime) : null
  const canPlate = PLATE_CALC_LOAD_TYPES.includes(we.exercise.loadType)
  const bodyweight = we.exercise.loadType === 'Poids du corps' || equipment === 'poids_du_corps'
  const generalStep = preferences?.weightStep ?? 2.5
  const weightStep = we.exercise.weightStep ?? generalStep
  const haptics = !!preferences?.hapticsEnabled

  // What the editor shows: the chosen set, else the first one not done, else the next new set.
  const target: number | 'draft' =
    selected === 'draft' || (typeof selected === 'number' && sets.some((s) => s.id === selected))
      ? selected
      : currentIndex >= 0
        ? sets[currentIndex].id!
        : 'draft'
  const targetIndex = target === 'draft' ? sets.length : sets.findIndex((s) => s.id === target)
  const targetSet = target === 'draft' ? undefined : sets[targetIndex]
  const editKey = target === 'draft' ? `draft-${sets.length}` : `set-${target}`
  // A new set starts from last session's same set, else repeats the previous one.
  const lastSameSet = lastTime?.sets[sets.length]
  const previous = sets[sets.length - 1]
  const draftDefault = lastSameSet ?? previous ?? { weight: 0, reps: 0 }
  const base = targetSet ?? draftDefault
  const values = edit?.key === editKey ? edit : { key: editKey, weight: base.weight, reps: base.reps }
  const plateWeight = values.weight
  const lastHint = lastTime?.sets[targetIndex]

  function setValue(patch: { weight?: number; reps?: number }) {
    setEdit({ ...values, ...patch })
  }

  /** Saves a correction straight away when editing an existing set. */
  function persist(patch: { weight?: number; reps?: number }) {
    if (targetSet) updateSet(targetSet.id!, patch)
  }

  async function submit() {
    const { weight, reps } = values
    if (targetSet) {
      await updateSet(targetSet.id!, { weight, reps })
      if (!targetSet.done) {
        await setSetDone(targetSet.id!, true)
        hapticLight(haptics)
        onSetDone()
      }
    } else {
      const id = await addSet(we.id!, { weight, reps })
      await setSetDone(id, true)
      hapticLight(haptics)
      onSetDone()
    }
    setSelected(null)
    setEdit(null)
  }

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

  async function handleRemoveSet(setId: number) {
    const removed = we.sets.find((s) => s.id === setId)
    await removeSet(setId)
    if (removed) showSnackbar(t('card.setRemoved'), () => restoreSet(removed))
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
          onClick={() => {
            setSelected('draft')
            setEdit({ key: `draft-${sets.length}`, weight: suggestion.weight, reps: suggestion.reps })
          }}
          className="mt-3 flex w-full items-center justify-between gap-2 rounded-xl bg-good-soft px-3 py-2.5 text-left text-xs text-good-ink active:opacity-80"
        >
          <span>
            {t('panel.suggest', { weight: `${kg(suggestion.weight)} kg`, step: kg(suggestion.step) })}
          </span>
          <span className="shrink-0 font-semibold underline">{t('card.apply')}</span>
        </button>
      )}

      <div className="mt-4 space-y-1.5">
        {sets.map((set, i) => {
          const isTarget = set.id === target
          const shown = isTarget ? values : set
          return (
            <SessionSetRow
              key={set.id}
              index={i}
              text={`${formatLoad(shown.weight, bodyweight)} × ${shown.reps}`}
              done={!!set.done}
              selected={isTarget}
              isPR={isPR(set)}
              onSelect={() => {
                setSelected(set.id!)
                setEdit(null)
              }}
              onRemove={() => handleRemoveSet(set.id!)}
              onDuplicate={() => duplicateSet(set.id!)}
              onUndo={() => setSetDone(set.id!, false)}
            />
          )
        })}
        <SessionSetRow
          index={sets.length}
          text={`${formatLoad(target === 'draft' ? values.weight : draftDefault.weight, bodyweight)} × ${
            target === 'draft' ? values.reps : draftDefault.reps
          }`}
          done={false}
          selected={target === 'draft'}
          isPR={false}
          draft
          onSelect={() => {
            setSelected('draft')
            setEdit(null)
          }}
        />
      </div>

      {/* The editor stays visible at the bottom, above the rest timer and navigation. */}
      <div className="sticky z-10 -mx-4 mt-3 bg-page px-4 pb-3 pt-2" style={{ bottom: 'var(--session-bar-h, 0px)' }}>
        <SetEditor
          key={editKey}
          title={
            targetSet?.done
              ? t('editor.fixSet', { n: targetIndex + 1 })
              : t('set.title', { n: targetIndex + 1 })
          }
          hint={lastHint ? t('editor.lastTimeHint', { v: `${formatLoad(lastHint.weight, bodyweight)} × ${lastHint.reps}` }) : undefined}
          weight={values.weight}
          reps={values.reps}
          weightStep={weightStep}
          bodyweight={bodyweight}
          haptics={haptics}
          buttonLabel={targetSet?.done ? t('editor.saveFix') : t('editor.validate')}
          canSubmit={values.reps > 0}
          onWeight={(weight) => setValue({ weight })}
          onReps={(reps) => setValue({ reps })}
          onSettle={persist}
          onSubmit={submit}
        />
        {showHint && (
          <div className="mt-1 flex items-center gap-1">
            <p className="flex-1 text-center text-xs text-muted">{t('panel.hint')}</p>
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
            { label: t('editor.stepMenu', { v: formatDecimal(weightStep) }), icon: SettingsIcon, onSelect: () => setStepOpen(true) },
            { label: t('panel.allExercises'), icon: ListIcon, onSelect: onOpenOverview },
            { label: t('panel.duplicate'), icon: CopyIcon, onSelect: () => duplicateExerciseInWorkout(we.id!) },
            { label: t('card.removeFromWorkout'), icon: TrashIcon, onSelect: handleRemoveExercise, danger: true },
          ]}
          onClose={() => setMenuOpen(false)}
        />
      )}
      {stepOpen && (
        <ContextMenuSheet
          title={t('editor.stepTitle', { name: we.exercise.name })}
          actions={[
            {
              label: t('editor.stepGeneral', { v: formatDecimal(generalStep) }),
              icon: we.exercise.weightStep == null ? CheckIcon : NoIcon,
              onSelect: () => setExerciseWeightStep(we.exerciseId, undefined),
            },
            ...WEIGHT_STEP_CHOICES.map((v) => ({
              label: `${formatDecimal(v)} kg`,
              icon: we.exercise.weightStep === v ? CheckIcon : NoIcon,
              onSelect: () => setExerciseWeightStep(we.exerciseId, v),
            })),
          ]}
          onClose={() => setStepOpen(false)}
        />
      )}
      {infoOpen && <ExerciseInfoSheet exerciseId={we.exerciseId} fallback={we.exercise} onClose={() => setInfoOpen(false)} />}
      {plateOpen && (
        <PlateCalculatorSheet initialWeight={plateWeight} loadType={we.exercise.loadType} onClose={() => setPlateOpen(false)} />
      )}
    </div>
  )
}
