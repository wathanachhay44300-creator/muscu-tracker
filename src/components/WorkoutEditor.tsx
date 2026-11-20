import { useState } from 'react'
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
} from '../lib/workoutActions'
import { totalVolume, formatVolume } from '../lib/stats'
import { ExercisePickerSheet } from './ExercisePickerSheet'
import { MuscleGroupBreakdown } from './MuscleGroupBreakdown'
import { SessionTimer } from './SessionTimer'
import { SessionNotes, SessionRpe } from './SessionExtras'
import { WorkoutExerciseCard } from './WorkoutExerciseCard'
import { CheckIcon, PlusIcon } from './Icons'
import type { Exercise, WorkoutExerciseWithSets } from '../types'
import { t, tn } from '../i18n'

interface WorkoutEditorProps {
  workoutId: number
}

export function WorkoutEditor({ workoutId }: WorkoutEditorProps) {
  const detail = useWorkoutDetail(workoutId)
  const [pickerOpen, setPickerOpen] = useState(false)
  const navigate = useNavigate()
  const preferences = usePreferences()

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
        <div className="rounded-2xl border border-dashed border-line-strong px-4 py-10 text-center">
          <p className="text-muted">{t('editor.empty')}</p>
          <p className="mt-1 text-sm text-muted">
            {t('editor.emptyHint')}
          </p>
        </div>
      )}

      {exercises.length > 0 && (
        <p className="text-center text-xs font-medium text-muted">
          {tn('common.exercises', exercises.length)} · {tn('common.sets', setCount)}
          {sessionVolume > 0 && <> · {t('editor.totalVolume', { v: formatVolume(sessionVolume) })}</>}
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
        className="flex w-full items-center justify-center gap-2 rounded-2xl bg-accent py-4 font-semibold text-on-accent shadow-sm active:bg-accent-hover"
      >
        <PlusIcon className="h-5 w-5" />
        {t('session.addExercise')}
      </button>

      {exercises.length > 0 && <SessionRpe workout={workout} />}

      <SessionNotes key={workout.id} workout={workout} />

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
          className="flex w-full items-center justify-center gap-2 rounded-2xl bg-good py-4 font-semibold text-on-good shadow-sm active:bg-good"
        >
          <CheckIcon className="h-5 w-5" />
          {workout.finishedAt ? t('editor.seeSummary') : t('editor.finish')}
        </button>
      )}

    </div>
  )
}
