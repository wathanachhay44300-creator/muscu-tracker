import { createPortal } from 'react-dom'
import { useDragReorder } from '../../hooks/useDragReorder'
import { useOptimisticOrder } from '../../hooks/useOptimisticOrder'
import { reorderWorkoutExercises } from '../../lib/workoutActions'
import type { WorkoutDetail } from '../../hooks/useWorkout'
import type { WorkoutExerciseWithSets } from '../../types'
import { MuscleGroupBreakdown } from '../MuscleGroupBreakdown'
import { SessionNotes, SessionRpe } from '../SessionExtras'
import { CheckIcon, GripIcon, PlusIcon, XIcon } from '../Icons'
import { t } from '../../i18n'

interface SessionOverviewSheetProps {
  detail: WorkoutDetail
  currentId: number | null
  onJump: (workoutExerciseId: number) => void
  onAddExercise: () => void
  onClose: () => void
}

/**
 * Everything about the session as a whole, kept out of the focused
 * one-exercise view: the exercise list (tap to jump, drag the handle to
 * reorder), add an exercise, muscle breakdown, RPE and session notes.
 */
export function SessionOverviewSheet({ detail, currentId, onJump, onAddExercise, onClose }: SessionOverviewSheetProps) {
  const exercises = detail.exercises
  const [orderIds, setOrderIds] = useOptimisticOrder(exercises.map((we) => we.id!))
  const byId = new Map(exercises.map((we) => [we.id!, we]))
  const ordered = orderIds.map((id) => byId.get(id)).filter((we): we is WorkoutExerciseWithSets => !!we)
  const drag = useDragReorder(orderIds, (next) => {
    setOrderIds(next)
    reorderWorkoutExercises(next)
  })

  return createPortal(
    <div className="fixed inset-0 z-50 flex flex-col bg-page animate-fade-in-backdrop">
      <div className="flex items-center justify-between border-b border-line px-4 pt-safe pt-3 pb-3">
        <h2 className="text-ink">{t('session.overviewTitle')}</h2>
        <button
          type="button"
          onClick={onClose}
          aria-label={t('common.close')}
          className="flex h-11 w-11 items-center justify-center rounded-full text-muted active:bg-surface-3"
        >
          <XIcon className="h-6 w-6" />
        </button>
      </div>

      <div className="flex-1 space-y-4 overflow-y-auto px-4 py-4 pb-10">
        <div className="space-y-2">
          {ordered.map((we, i) => {
            const row = drag.getRowProps(we.id!)
            const done = we.sets.filter((s) => s.done).length
            const complete = we.sets.length > 0 && done === we.sets.length
            return (
              <div
                key={we.id}
                ref={row.containerProps.ref}
                style={row.containerProps.style}
                className={`flex items-center gap-1 rounded-2xl border bg-surface pr-3 ${
                  we.id === currentId ? 'border-accent' : row.isDragging ? 'border-accent-line shadow-lg' : 'border-line'
                }`}
              >
                <button
                  type="button"
                  aria-label={t('session.dragToReorder', { name: we.exercise.name })}
                  className="flex h-14 w-11 shrink-0 cursor-grab touch-none items-center justify-center text-faint active:text-muted"
                  {...row.handleProps}
                >
                  <GripIcon className="h-5 w-5" />
                </button>
                <button
                  type="button"
                  onClick={() => onJump(we.id!)}
                  className="flex min-h-14 min-w-0 flex-1 items-center gap-3 text-left"
                >
                  <span className="font-numbers w-5 shrink-0 text-sm font-bold text-muted">{i + 1}</span>
                  <span className="min-w-0 flex-1">
                    <span className="font-exercise block truncate text-[1.05rem] text-ink">{we.exercise.name}</span>
                    <span className="block text-xs text-muted">
                      {t('session.setsDone', { done, total: we.sets.length })}
                    </span>
                  </span>
                  {complete && (
                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-accent text-on-accent">
                      <CheckIcon className="h-4 w-4" strokeWidth={3} />
                    </span>
                  )}
                </button>
              </div>
            )
          })}
        </div>

        <button
          type="button"
          onClick={onAddExercise}
          className="flex min-h-14 w-full items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-line-strong font-semibold text-ink-2 active:bg-surface-3"
        >
          <PlusIcon className="h-5 w-5" />
          {t('session.addExercise')}
        </button>

        {exercises.length > 0 && (
          <MuscleGroupBreakdown
            items={exercises.map((we) => ({ muscleGroup: we.exercise.muscleGroup, setCount: we.sets.length }))}
          />
        )}
        {exercises.length > 0 && <SessionRpe workout={detail.workout} />}
        <SessionNotes key={detail.workout.id} workout={detail.workout} />
      </div>
    </div>,
    document.body,
  )
}
