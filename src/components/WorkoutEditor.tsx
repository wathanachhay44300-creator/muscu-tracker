import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useWorkoutDetail } from '../hooks/useWorkout'
import { usePreferences } from '../hooks/usePreferences'
import { hapticSuccess } from '../lib/haptics'
import { useOptimisticOrder } from '../hooks/useOptimisticOrder'
import { useDragReorder } from '../hooks/useDragReorder'
import {
  addExerciseToWorkout,
  finishWorkout,
  reorderWorkoutExercises,
  updateWorkoutNotes,
  updateWorkoutRpe,
} from '../lib/workoutActions'
import { totalVolume, formatVolume } from '../lib/stats'
import { ExercisePickerSheet } from './ExercisePickerSheet'
import { MuscleGroupBreakdown } from './MuscleGroupBreakdown'
import { SessionTimer } from './SessionTimer'
import { WorkoutExerciseCard } from './WorkoutExerciseCard'
import { CheckIcon, PlusIcon } from './Icons'
import type { Exercise, WorkoutExerciseWithSets } from '../types'

interface WorkoutEditorProps {
  workoutId: number
}

const RPE_VALUES = Array.from({ length: 10 }, (_, i) => i + 1)

export function WorkoutEditor({ workoutId }: WorkoutEditorProps) {
  const detail = useWorkoutDetail(workoutId)
  const [pickerOpen, setPickerOpen] = useState(false)
  const navigate = useNavigate()
  const preferences = usePreferences()

  const [notes, setNotes] = useState('')
  const notesLoadedFor = useRef<number | null>(null)
  const notesTimeout = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)

  useEffect(() => {
    if (!detail) return
    if (notesLoadedFor.current === workoutId) return
    notesLoadedFor.current = workoutId
    setNotes(detail.workout.notes ?? '')
  }, [detail, workoutId])

  useEffect(() => () => clearTimeout(notesTimeout.current), [])

  const exercises = detail?.exercises ?? []
  const exerciseIds = exercises.map((we) => we.id!)
  const [orderIds, setOrderIds] = useOptimisticOrder(exerciseIds)
  const byId = new Map(exercises.map((we) => [we.id!, we]))
  const orderedExercises = orderIds.map((id) => byId.get(id)).filter((we): we is WorkoutExerciseWithSets => !!we)

  const dragReorder = useDragReorder(orderIds, (newOrder) => {
    setOrderIds(newOrder)
    reorderWorkoutExercises(newOrder)
  })

  if (!detail) return null
  const { workout } = detail

  const setCount = exercises.reduce((sum, we) => sum + we.sets.length, 0)
  const sessionVolume = totalVolume(exercises.flatMap((we) => we.sets))
  const setTimestamps = exercises.flatMap((we) => we.sets.map((s) => s.createdAt))
  const firstSetAt = setTimestamps.length ? Math.min(...setTimestamps) : null

  function handleNotesChange(value: string) {
    setNotes(value)
    clearTimeout(notesTimeout.current)
    notesTimeout.current = setTimeout(() => updateWorkoutNotes(workoutId, value), 400)
  }

  async function handleSelectExercise(exercise: Exercise) {
    await addExerciseToWorkout(workoutId, exercise.id!)
    setPickerOpen(false)
  }

  async function handleFinish() {
    if (!workout.finishedAt) await finishWorkout(workoutId)
    hapticSuccess(!!preferences?.hapticsEnabled)
    navigate(`/bilan/${workoutId}`)
  }

  return (
    <div className="space-y-4">
      {firstSetAt != null && !workout.finishedAt && <SessionTimer startedAt={firstSetAt} />}

      {exercises.length === 0 && (
        <div className="rounded-2xl border border-dashed border-slate-300 px-4 py-10 text-center">
          <p className="text-slate-500">Aucun exercice pour l'instant.</p>
          <p className="mt-1 text-sm text-slate-400">
            Ajoutez un exercice pour commencer à noter vos séries.
          </p>
        </div>
      )}

      {exercises.length > 0 && (
        <p className="text-center text-xs font-medium text-slate-400">
          {exercises.length} exercice{exercises.length > 1 ? 's' : ''} · {setCount} série
          {setCount > 1 ? 's' : ''}
          {sessionVolume > 0 && <> · {formatVolume(sessionVolume)} kg au total</>}
        </p>
      )}

      {exercises.length > 0 && (
        <MuscleGroupBreakdown
          items={exercises.map((we) => ({ muscleGroup: we.exercise.muscleGroup, setCount: we.sets.length }))}
        />
      )}

      {orderedExercises.map((we) => {
        const row = dragReorder.getRowProps(we.id!)
        return (
          <WorkoutExerciseCard
            key={we.id}
            we={we}
            workoutId={workoutId}
            containerRef={row.containerProps.ref}
            containerStyle={row.containerProps.style}
            isDragging={row.isDragging}
            dragHandleProps={row.handleProps}
          />
        )
      })}

      <button
        type="button"
        onClick={() => setPickerOpen(true)}
        className="flex w-full items-center justify-center gap-2 rounded-2xl bg-brand-600 py-4 font-semibold text-white shadow-sm active:bg-brand-700"
      >
        <PlusIcon className="h-5 w-5" />
        Ajouter un exercice
      </button>

      {exercises.length > 0 && (
        <div className="rounded-2xl border border-slate-200 bg-surface p-4 shadow-sm">
          <div className="mb-2 flex items-center justify-between">
            <p className="text-sm font-semibold text-slate-700">Ressenti de la séance (RPE)</p>
            {workout.rpe != null && (
              <button
                type="button"
                onClick={() => updateWorkoutRpe(workoutId, null)}
                className="text-xs font-medium text-slate-400 active:text-slate-600"
              >
                Effacer
              </button>
            )}
          </div>
          <div className="flex flex-wrap gap-1.5">
            {RPE_VALUES.map((n) => (
              <button
                key={n}
                type="button"
                onClick={() => updateWorkoutRpe(workoutId, n)}
                className={`h-9 w-9 rounded-full text-sm font-semibold ${
                  workout.rpe === n
                    ? 'bg-brand-600 text-white'
                    : 'bg-slate-100 text-slate-600 active:bg-slate-200'
                }`}
              >
                {n}
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="rounded-2xl border border-slate-200 bg-surface p-4 shadow-sm">
        <p className="mb-2 text-sm font-semibold text-slate-700">Notes de séance</p>
        <textarea
          value={notes}
          onChange={(e) => handleNotesChange(e.target.value)}
          placeholder="Fatigue, sommeil, douleurs, contexte…"
          rows={3}
          className="w-full resize-none rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm outline-none focus:border-brand-400"
        />
      </div>

      {pickerOpen && (
        <ExercisePickerSheet
          excludeIds={exercises.map((e) => e.exerciseId)}
          onSelect={handleSelectExercise}
          onClose={() => setPickerOpen(false)}
        />
      )}

      {exercises.length > 0 && (
        <button
          type="button"
          onClick={handleFinish}
          className="flex w-full items-center justify-center gap-2 rounded-2xl bg-emerald-600 py-4 font-semibold text-white shadow-sm active:bg-emerald-700"
        >
          <CheckIcon className="h-5 w-5" />
          {workout.finishedAt ? 'Voir le bilan' : 'Terminer la séance'}
        </button>
      )}

    </div>
  )
}
