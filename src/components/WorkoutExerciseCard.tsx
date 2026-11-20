import { memo, useEffect, useRef, useState, type CSSProperties, type PointerEvent as ReactPointerEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import type { WorkoutExerciseWithSets } from '../types'
import { usePersonalRecords } from '../hooks/usePersonalRecords'
import { useLastPerformance } from '../hooks/useLastPerformance'
import { usePreferences } from '../hooks/usePreferences'
import { useLongPress } from '../hooks/useLongPress'
import { useSwipeToDelete } from '../hooks/useSwipeToDelete'
import { useSnackbar } from '../contexts/SnackbarContext'
import {
  addSet,
  duplicateExerciseInWorkout,
  duplicateSet,
  removeExerciseFromWorkout,
  removeSet,
  restoreExercise,
  restoreSet,
  updateExerciseNote,
  updateSet,
} from '../lib/workoutActions'
import { getSuggestedProgression } from '../lib/progression'
import { hapticLight, hapticMenuOpen } from '../lib/haptics'
import { formatReps, formatVolume, formatWeight, setVolume, totalVolume } from '../lib/stats'
import { relativeDateLabel } from '../lib/date'
import { SetRow } from './SetRow'
import { ContextMenuSheet } from './ContextMenuSheet'
import { ExerciseInfoButton } from './ExerciseInfoSheet'
import { CheckIcon, CopyIcon, GripIcon, NoteIcon, PlusIcon, SettingsIcon, TrashIcon } from './Icons'
import { setExerciseWeightStep } from '../lib/exerciseActions'
import { formatDecimal, groupLabel, t } from '../i18n'
import { WEIGHT_STEPS } from '../lib/settingsActions'

const WEIGHT_STEP_CHOICES = WEIGHT_STEPS

/** Draws nothing: keeps menu labels aligned with the ticked one. */
function NoIcon(props: React.SVGProps<SVGSVGElement>) {
  return <svg {...props} aria-hidden="true" />
}

interface WorkoutExerciseCardProps {
  we: WorkoutExerciseWithSets
  workoutId: number
  containerRef?: (el: HTMLElement | null) => void
  containerStyle?: CSSProperties
  isDragging?: boolean
  dragHandleProps?: {
    style: CSSProperties
    onPointerDown: (e: ReactPointerEvent<HTMLElement>) => void
    onPointerMove: (e: ReactPointerEvent<HTMLElement>) => void
    onPointerUp: (e: ReactPointerEvent<HTMLElement>) => void
    onPointerCancel: (e: ReactPointerEvent<HTMLElement>) => void
  }
  /** Called after "Ajouter une série" (the session screen starts the rest timer). */
  onSetAdded?: () => void
}

export const WorkoutExerciseCard = memo(function WorkoutExerciseCard({
  we,
  workoutId,
  containerRef,
  containerStyle,
  isDragging,
  dragHandleProps,
  onSetAdded,
}: WorkoutExerciseCardProps) {
  const records = usePersonalRecords(we.exerciseId)
  const lastTime = useLastPerformance(we.exerciseId, workoutId)
  const preferences = usePreferences()
  const [stepOpen, setStepOpen] = useState(false)
  const generalStep = preferences?.weightStep ?? 2.5
  const weightStep = we.exercise.weightStep ?? generalStep
  const { showSnackbar } = useSnackbar()
  const navigate = useNavigate()
  const [menuOpen, setMenuOpen] = useState(false)
  const [noteOpen, setNoteOpen] = useState(false)
  const [noteText, setNoteText] = useState(we.note ?? '')
  const noteTimeout = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)
  useEffect(() => () => clearTimeout(noteTimeout.current), [])

  function handleNoteChange(value: string) {
    setNoteText(value)
    clearTimeout(noteTimeout.current)
    noteTimeout.current = setTimeout(() => updateExerciseNote(we.id!, value), 400)
  }
  const volume = totalVolume(we.sets)
  const suggestion = we.sets.length === 0 ? getSuggestedProgression(lastTime) : null

  const longPress = useLongPress(() => {
    hapticMenuOpen(!!preferences?.hapticsEnabled)
    setMenuOpen(true)
  })

  function isPR(set: { weight: number; reps: number }): boolean {
    if (!records) return false
    const vol = setVolume(set)
    return (
      (records.bestWeight > 0 && set.weight === records.bestWeight) ||
      (records.bestVolume > 0 && vol === records.bestVolume)
    )
  }

  async function handleAddSet(override?: { weight: number; reps: number }) {
    await addSet(we.id!, override)
    hapticLight(!!preferences?.hapticsEnabled)
    onSetAdded?.()
  }

  async function handleRemoveExercise() {
    const link = { id: we.id, workoutId: we.workoutId, exerciseId: we.exerciseId, order: we.order, note: we.note }
    const sets = [...we.sets]
    await removeExerciseFromWorkout(we.id!)
    showSnackbar(t('card.exerciseRemoved'), () => restoreExercise(link, sets))
  }

  const swipe = useSwipeToDelete(handleRemoveExercise)

  async function handleRemoveSet(setId: number) {
    const removed = we.sets.find((s) => s.id === setId)
    await removeSet(setId)
    if (removed) {
      showSnackbar(t('card.setRemoved'), () => restoreSet(removed))
    }
  }

  return (
    <div
      ref={containerRef}
      style={containerStyle}
      className={`animate-fade-in rounded-2xl border bg-surface ${
        isDragging ? 'border-accent-line shadow-lg' : 'border-line shadow-sm'
      }`}
      onPointerDown={(e) => {
        longPress.onPointerDown(e)
        swipe.handlers.onPointerDown(e)
      }}
      onPointerMove={(e) => {
        longPress.onPointerMove(e)
        swipe.handlers.onPointerMove(e)
      }}
      onPointerUp={(e) => {
        longPress.onPointerUp(e)
        swipe.handlers.onPointerUp(e)
      }}
      onPointerCancel={(e) => {
        longPress.onPointerCancel(e)
        swipe.handlers.onPointerCancel(e)
      }}
      onClickCapture={longPress.onClickCapture}
      onContextMenu={longPress.onContextMenu}
    >
      <div className="relative overflow-hidden rounded-2xl">
      <div
        ref={swipe.revealRef}
        className="absolute inset-0 flex items-center justify-end bg-danger pr-6 opacity-0"
        aria-hidden="true"
      >
        <TrashIcon className="h-6 w-6 text-on-danger" />
      </div>
      <div ref={swipe.contentRef} data-swipe-to-delete className="relative bg-surface p-4">
      <div className="mb-3 flex items-start justify-between gap-2">
        <div className="flex min-w-0 items-start gap-1.5">
          {dragHandleProps && (
            <button
              type="button"
              aria-label={t('card.drag')}
              className="-ml-1.5 shrink-0 cursor-grab touch-none rounded-lg p-1.5 text-faint active:cursor-grabbing active:text-muted"
              {...dragHandleProps}
            >
              <GripIcon className="h-5 w-5" />
            </button>
          )}
          <div className="min-w-0">
            <button
              type="button"
              onClick={() => navigate(`/exercices/${we.exercise.id}`)}
              className="font-exercise text-[0.95rem] text-ink active:opacity-60 text-left"
            >
              {we.exercise.name}
            </button>
            <p className="text-xs font-medium text-muted">{groupLabel(we.exercise.muscleGroup)}</p>
            {lastTime?.note && (
              <p className="mt-1 text-xs italic text-highlight-ink">
                {t('panel.lastNote', { note: lastTime.note })}
              </p>
            )}
            {!noteOpen && noteText.trim() && (
              <p className="mt-1 whitespace-pre-wrap text-xs text-accent-ink">{noteText}</p>
            )}
          </div>
        </div>
        <div className="flex shrink-0 items-center">
          <ExerciseInfoButton exercise={we.exercise} className="!rounded-lg !p-1.5 !text-faint" />
          <button
            type="button"
            data-no-long-press
            data-no-swipe
            onClick={() => setNoteOpen((v) => !v)}
            aria-label={t('card.note')}
            aria-expanded={noteOpen}
            className={`shrink-0 rounded-lg p-1.5 active:bg-surface-3 ${
              noteText.trim() ? 'text-accent-ink' : 'text-faint'
            }`}
          >
            <NoteIcon className="h-5 w-5" />
          </button>
        </div>
      </div>

      {noteOpen && (
        <textarea
          data-no-long-press
          data-no-swipe
          autoFocus
          value={noteText}
          onChange={(e) => handleNoteChange(e.target.value)}
          placeholder={t('card.notePlaceholder')}
          rows={2}
          className="mb-3 w-full resize-none rounded-xl border border-line bg-surface-2 px-3 py-2 text-sm outline-none focus:border-accent-line"
        />
      )}

      {lastTime && (
        <p className="mb-3 rounded-lg bg-surface-2 px-2.5 py-2 text-xs text-muted">
          <span className="font-medium text-ink-2">
            {t('card.lastTime', { when: relativeDateLabel(lastTime.date).toLowerCase() })}
          </span>{' '}
          : {lastTime.sets.map((s) => `${formatWeight(s.weight)}kg×${formatReps(s.reps)}`).join(', ')}
        </p>
      )}

      {suggestion && (
        <button
          type="button"
          data-no-long-press
          data-no-swipe
          onClick={() => handleAddSet({ weight: suggestion.weight, reps: suggestion.reps })}
          className="mb-3 flex w-full items-center justify-between gap-2 rounded-lg bg-good-soft px-2.5 py-2 text-left text-xs text-good-ink active:bg-good-soft"
        >
          <span>
            {t('card.suggest', { weight: `${formatWeight(suggestion.weight)} kg`, step: formatWeight(suggestion.step) })}
          </span>
          <span className="shrink-0 font-semibold underline">{t('card.apply')}</span>
        </button>
      )}

      <div className="space-y-2">
        {we.sets.map((set, i) => (
          <SetRow
            key={set.id}
            set={set}
            index={i}
            loadType={we.exercise.loadType}
            weightStep={weightStep}
            isPR={isPR(set)}
            onChangeWeight={(weight) => updateSet(set.id!, { weight })}
            onChangeReps={(reps) => updateSet(set.id!, { reps })}
            onRemove={() => handleRemoveSet(set.id!)}
            onDuplicate={() => duplicateSet(set.id!)}
          />
        ))}
      </div>

      <button
        type="button"
        data-no-long-press
        data-no-swipe
        onClick={() => handleAddSet()}
        className="mt-3 flex w-full items-center justify-center gap-1.5 rounded-xl bg-surface-2 py-2.5 text-sm font-semibold text-accent-ink active:bg-surface-3"
      >
        <PlusIcon className="h-4 w-4" />
        {t('card.addSet')}
      </button>

      {volume > 0 && (
        <p className="mt-2.5 text-right text-xs font-medium text-muted">
          {t('card.volume', { v: formatVolume(volume) })}
        </p>
      )}

      </div>
      </div>

      {menuOpen && (
        <ContextMenuSheet
          title={we.exercise.name}
          actions={[
            {
              label: t('card.duplicate'),
              icon: CopyIcon,
              onSelect: () => duplicateExerciseInWorkout(we.id!),
            },
            { label: t('editor.stepMenu', { v: formatDecimal(weightStep) }), icon: SettingsIcon, onSelect: () => setStepOpen(true) },
            {
              label: t('card.removeFromWorkout'),
              icon: TrashIcon,
              onSelect: handleRemoveExercise,
              danger: true,
            },
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
    </div>
  )
})
