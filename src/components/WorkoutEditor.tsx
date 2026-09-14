import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useWorkoutDetail } from '../hooks/useWorkout'
import {
  addExerciseToWorkout,
  addSet,
  removeExerciseFromWorkout,
  removeSet,
  updateSet,
} from '../lib/workoutActions'
import { ExercisePickerSheet } from './ExercisePickerSheet'
import { SetRow } from './SetRow'
import { PlusIcon, TrashIcon } from './Icons'
import type { Exercise } from '../types'

interface WorkoutEditorProps {
  workoutId: number
}

export function WorkoutEditor({ workoutId }: WorkoutEditorProps) {
  const detail = useWorkoutDetail(workoutId)
  const [pickerOpen, setPickerOpen] = useState(false)

  if (!detail) return null
  const { exercises } = detail

  async function handleSelectExercise(exercise: Exercise) {
    await addExerciseToWorkout(workoutId, exercise.id!)
    setPickerOpen(false)
  }

  return (
    <div className="space-y-4">
      {exercises.length === 0 && (
        <div className="rounded-2xl border border-dashed border-slate-300 px-4 py-10 text-center">
          <p className="text-slate-500">Aucun exercice pour l'instant.</p>
          <p className="mt-1 text-sm text-slate-400">
            Ajoutez un exercice pour commencer à noter vos séries.
          </p>
        </div>
      )}

      {exercises.map((we) => (
        <div key={we.id} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="mb-3 flex items-start justify-between gap-2">
            <div>
              <Link
                to={`/exercices/${we.exercise.id}`}
                className="text-base font-semibold text-slate-900 active:opacity-60"
              >
                {we.exercise.name}
              </Link>
              <p className="text-xs font-medium text-slate-400">{we.exercise.muscleGroup}</p>
            </div>
            <button
              type="button"
              onClick={() => removeExerciseFromWorkout(we.id!)}
              className="shrink-0 p-1.5 text-slate-300 active:text-red-500"
              aria-label="Supprimer cet exercice de la séance"
            >
              <TrashIcon className="h-5 w-5" />
            </button>
          </div>

          <div className="space-y-2">
            {we.sets.map((set, i) => (
              <SetRow
                key={set.id}
                set={set}
                index={i}
                onChangeWeight={(weight) => updateSet(set.id!, { weight })}
                onChangeReps={(reps) => updateSet(set.id!, { reps })}
                onRemove={() => removeSet(set.id!)}
              />
            ))}
          </div>

          <button
            type="button"
            onClick={() => addSet(we.id!)}
            className="mt-3 flex w-full items-center justify-center gap-1.5 rounded-xl bg-slate-50 py-2.5 text-sm font-semibold text-brand-600 active:bg-slate-100"
          >
            <PlusIcon className="h-4 w-4" />
            Ajouter une série
          </button>
        </div>
      ))}

      <button
        type="button"
        onClick={() => setPickerOpen(true)}
        className="flex w-full items-center justify-center gap-2 rounded-2xl bg-brand-600 py-4 font-semibold text-white shadow-sm active:bg-brand-700"
      >
        <PlusIcon className="h-5 w-5" />
        Ajouter un exercice
      </button>

      {pickerOpen && (
        <ExercisePickerSheet
          excludeIds={exercises.map((e) => e.exerciseId)}
          onSelect={handleSelectExercise}
          onClose={() => setPickerOpen(false)}
        />
      )}
    </div>
  )
}
