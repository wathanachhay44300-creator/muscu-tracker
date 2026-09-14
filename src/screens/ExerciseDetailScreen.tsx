import { useNavigate, useParams } from 'react-router-dom'
import { useExerciseHistory } from '../hooks/useExerciseHistory'
import { ChevronLeftIcon } from '../components/Icons'
import { formatDateFr, relativeDateLabel } from '../lib/date'

export function ExerciseDetailScreen() {
  const { exerciseId } = useParams()
  const id = exerciseId ? Number(exerciseId) : undefined
  const history = useExerciseHistory(id)
  const navigate = useNavigate()

  if (!history) {
    return (
      <div className="mx-auto max-w-md px-4 pt-safe pb-28 pt-4">
        <p className="text-slate-400">Exercice introuvable.</p>
      </div>
    )
  }

  const { exercise, entries } = history

  return (
    <div className="mx-auto max-w-md px-4 pt-safe pb-28 pt-4">
      <div className="mb-5 flex items-center gap-2">
        <button
          type="button"
          onClick={() => navigate('/exercices')}
          className="-ml-2 rounded-full p-2 text-slate-400 active:bg-slate-100"
          aria-label="Retour aux exercices"
        >
          <ChevronLeftIcon className="h-5 w-5" />
        </button>
        <div>
          <h1 className="text-lg font-bold text-slate-900">{exercise.name}</h1>
          <p className="text-xs font-medium text-slate-400">{exercise.muscleGroup}</p>
        </div>
      </div>

      {entries.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-300 px-4 py-14 text-center">
          <p className="text-slate-500">Pas encore de séries enregistrées</p>
          <p className="mt-1 text-sm text-slate-400">
            L'historique de cet exercice apparaîtra ici après votre première séance.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {entries.map((entry) => (
            <div
              key={entry.workout.id}
              className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"
            >
              <p className="mb-2 text-sm font-semibold text-slate-700">
                {relativeDateLabel(entry.workout.date)}{' '}
                <span className="font-normal text-slate-400">
                  · {formatDateFr(entry.workout.date, { withYear: false })}
                </span>
              </p>
              <div className="flex flex-wrap gap-2">
                {entry.sets.map((set, i) => (
                  <span
                    key={set.id}
                    className="rounded-lg bg-slate-50 px-2.5 py-1.5 text-sm font-medium text-slate-700"
                  >
                    <span className="text-slate-400">{i + 1}·</span> {formatWeight(set.weight)}kg ×{' '}
                    {set.reps}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function formatWeight(n: number): string {
  return Number.isInteger(n) ? String(n) : n.toFixed(2).replace(/0+$/, '').replace(/\.$/, '')
}
