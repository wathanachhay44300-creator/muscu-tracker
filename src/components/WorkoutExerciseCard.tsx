import { Link } from 'react-router-dom'
import type { WorkoutExerciseWithSets } from '../types'
import { usePersonalRecords } from '../hooks/usePersonalRecords'
import { useLastPerformance } from '../hooks/useLastPerformance'
import { addSet, removeExerciseFromWorkout, removeSet, updateSet } from '../lib/workoutActions'
import { formatVolume, formatWeight, setVolume, totalVolume } from '../lib/stats'
import { relativeDateLabel } from '../lib/date'
import { SetRow } from './SetRow'
import { PlusIcon, TrashIcon } from './Icons'

interface WorkoutExerciseCardProps {
  we: WorkoutExerciseWithSets
  workoutId: number
}

export function WorkoutExerciseCard({ we, workoutId }: WorkoutExerciseCardProps) {
  const records = usePersonalRecords(we.exerciseId)
  const lastTime = useLastPerformance(we.exerciseId, workoutId)
  const volume = totalVolume(we.sets)

  function isPR(set: { weight: number; reps: number }): boolean {
    if (!records) return false
    const vol = setVolume(set)
    return (
      (records.bestWeight > 0 && set.weight === records.bestWeight) ||
      (records.bestVolume > 0 && vol === records.bestVolume)
    )
  }

  return (
    <div className="animate-fade-in rounded-2xl border border-slate-200 bg-surface p-4 shadow-sm">
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

      {lastTime && (
        <p className="mb-3 rounded-lg bg-slate-50 px-2.5 py-2 text-xs text-slate-500">
          <span className="font-medium text-slate-600">
            Dernière fois ({relativeDateLabel(lastTime.date).toLowerCase()})
          </span>{' '}
          : {lastTime.sets.map((s) => `${formatWeight(s.weight)}kg×${s.reps}`).join(', ')}
        </p>
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

      {volume > 0 && (
        <p className="mt-2.5 text-right text-xs font-medium text-slate-400">
          Volume : {formatVolume(volume)} kg
        </p>
      )}
    </div>
  )
}
