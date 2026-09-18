import { useState, type CSSProperties, type PointerEvent as ReactPointerEvent } from 'react'
import { Link } from 'react-router-dom'
import type { WorkoutExerciseWithSets } from '../types'
import { usePersonalRecords } from '../hooks/usePersonalRecords'
import { useLastPerformance } from '../hooks/useLastPerformance'
import { usePreferences } from '../hooks/usePreferences'
import { useLongPress } from '../hooks/useLongPress'
import { useSnackbar } from '../contexts/SnackbarContext'
import {
  addSet,
  duplicateExerciseInWorkout,
  duplicateSet,
  removeExerciseFromWorkout,
  removeSet,
  restoreSet,
  updateSet,
} from '../lib/workoutActions'
import { getSuggestedProgression } from '../lib/progression'
import { hapticLight, hapticMenuOpen } from '../lib/haptics'
import { formatVolume, formatWeight, setVolume, totalVolume } from '../lib/stats'
import { relativeDateLabel } from '../lib/date'
import { SetRow } from './SetRow'
import { ContextMenuSheet } from './ContextMenuSheet'
import { CopyIcon, GripIcon, PlusIcon, TrashIcon } from './Icons'

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
}

export function WorkoutExerciseCard({
  we,
  workoutId,
  containerRef,
  containerStyle,
  isDragging,
  dragHandleProps,
}: WorkoutExerciseCardProps) {
  const records = usePersonalRecords(we.exerciseId)
  const lastTime = useLastPerformance(we.exerciseId, workoutId)
  const preferences = usePreferences()
  const { showSnackbar } = useSnackbar()
  const [menuOpen, setMenuOpen] = useState(false)
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
  }

  async function handleRemoveSet(setId: number) {
    const removed = we.sets.find((s) => s.id === setId)
    await removeSet(setId)
    if (removed) {
      showSnackbar('Série supprimée', () => restoreSet(removed))
    }
  }

  return (
    <div
      ref={containerRef}
      style={containerStyle}
      className={`animate-fade-in rounded-2xl border bg-surface p-4 ${
        isDragging ? 'border-brand-300 shadow-lg' : 'border-slate-200 shadow-sm'
      }`}
      onPointerDown={longPress.onPointerDown}
      onPointerMove={longPress.onPointerMove}
      onPointerUp={longPress.onPointerUp}
      onPointerCancel={longPress.onPointerCancel}
      onClickCapture={longPress.onClickCapture}
    >
      <div className="mb-3 flex items-start justify-between gap-2">
        <div className="flex min-w-0 items-start gap-1.5">
          {dragHandleProps && (
            <button
              type="button"
              aria-label="Glisser pour réordonner"
              className="-ml-1.5 shrink-0 cursor-grab touch-none rounded-lg p-1.5 text-slate-300 active:cursor-grabbing active:text-slate-500"
              {...dragHandleProps}
            >
              <GripIcon className="h-5 w-5" />
            </button>
          )}
          <div className="min-w-0">
            <Link
              to={`/exercices/${we.exercise.id}`}
              className="text-base font-semibold text-slate-900 active:opacity-60"
            >
              {we.exercise.name}
            </Link>
            <p className="text-xs font-medium text-slate-400">{we.exercise.muscleGroup}</p>
          </div>
        </div>
        <button
          type="button"
          data-no-long-press
          onClick={() => removeExerciseFromWorkout(we.id!)}
          className="shrink-0 p-1.5 text-slate-300 active:text-red-500"
          aria-label="Supprimer cet exercice de la séance"
        >
          <TrashIcon className="h-5 w-5" />
        </button>
      </div>

      {lastTime && (
        <p className="mb-3 rounded-lg bg-slate-50 px-2.5 py-2 text-xs text-slate-500">
          <span className="font-medium text-slate-600">
            Dernière fois ({relativeDateLabel(lastTime.date).toLowerCase()})
          </span>{' '}
          : {lastTime.sets.map((s) => `${formatWeight(s.weight)}kg×${s.reps}`).join(', ')}
        </p>
      )}

      {suggestion && (
        <button
          type="button"
          data-no-long-press
          onClick={() => handleAddSet({ weight: suggestion.weight, reps: suggestion.reps })}
          className="mb-3 flex w-full items-center justify-between gap-2 rounded-lg bg-emerald-50 px-2.5 py-2 text-left text-xs text-emerald-700 active:bg-emerald-100"
        >
          <span>
            💪 Objectifs atteints la dernière fois — essayer{' '}
            <span className="font-semibold">{formatWeight(suggestion.weight)} kg</span> (+{suggestion.step} kg) ?
          </span>
          <span className="shrink-0 font-semibold underline">Appliquer</span>
        </button>
      )}

      <div className="space-y-2">
        {we.sets.map((set, i) => (
          <SetRow
            key={set.id}
            set={set}
            index={i}
            loadType={we.exercise.loadType}
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
        onClick={() => handleAddSet()}
        className="mt-3 flex w-full items-center justify-center gap-1.5 rounded-xl bg-slate-50 py-2.5 text-sm font-semibold text-brand-600 active:bg-slate-100"
      >
        <PlusIcon className="h-4 w-4" />
        Ajouter une série
      </button>

      {volume > 0 && (
        <p className="mt-2.5 text-right text-xs font-medium text-slate-400">
          Volume : {formatVolume(volume)} kg
        </p>
      )}

      {menuOpen && (
        <ContextMenuSheet
          title={we.exercise.name}
          actions={[
            {
              label: 'Dupliquer cet exercice',
              icon: CopyIcon,
              onSelect: () => duplicateExerciseInWorkout(we.id!),
            },
            {
              label: 'Supprimer de la séance',
              icon: TrashIcon,
              onSelect: () => removeExerciseFromWorkout(we.id!),
              danger: true,
            },
          ]}
          onClose={() => setMenuOpen(false)}
        />
      )}
    </div>
  )
}
