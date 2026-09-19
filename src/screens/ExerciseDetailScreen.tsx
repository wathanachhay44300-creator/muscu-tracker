import { useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useExerciseHistory } from '../hooks/useExerciseHistory'
import { usePersonalRecords } from '../hooks/usePersonalRecords'
import { ChevronLeftIcon, StarIcon } from '../components/Icons'
import { ProgressChart } from '../components/ProgressChart'
import { formatDateFr, relativeDateLabel } from '../lib/date'
import { formatVolume, formatWeight, setVolume, totalVolume } from '../lib/stats'

type Metric = 'weight' | 'volume'

export function ExerciseDetailScreen() {
  const { exerciseId } = useParams()
  const id = exerciseId ? Number(exerciseId) : undefined
  const history = useExerciseHistory(id)
  const records = usePersonalRecords(id)
  const navigate = useNavigate()
  const [metric, setMetric] = useState<Metric>('weight')

  const chartPoints = useMemo(() => {
    if (!history) return []
    return [...history.entries]
      .reverse() // chronological, oldest first
      .map((entry) => ({
        date: entry.workout.date,
        value:
          metric === 'weight'
            ? Math.max(...entry.sets.map((s) => s.weight))
            : totalVolume(entry.sets),
      }))
  }, [history, metric])

  if (!history) {
    return (
      <div className="mx-auto max-w-md px-4 pt-safe pb-28 pt-4 animate-fade-in">
        <p className="text-slate-400">Exercice introuvable.</p>
      </div>
    )
  }

  const { exercise, entries } = history

  function isPR(set: { weight: number; reps: number }): boolean {
    if (!records) return false
    const vol = setVolume(set)
    return (
      (records.bestWeight > 0 && set.weight === records.bestWeight) ||
      (records.bestVolume > 0 && vol === records.bestVolume)
    )
  }

  return (
    <div className="mx-auto max-w-md px-4 pt-safe pb-28 pt-4 animate-fade-in">
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
          <h1 className="font-exercise text-lg text-slate-900">{exercise.name}</h1>
          <p className="text-xs font-medium text-slate-400">
            {exercise.muscleGroup}
            {exercise.deletedAt && ' · Supprimé de la bibliothèque'}
          </p>
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
        <div className="space-y-4">
          {records && (records.bestWeight > 0 || records.bestVolume > 0) && (
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-2xl border border-amber-200 bg-amber-50 p-3.5 text-center">
                <p className="flex items-center justify-center gap-1 text-xs font-semibold text-amber-600">
                  <StarIcon className="h-3.5 w-3.5" /> Meilleur poids
                </p>
                <p className="mt-1 text-xl font-bold text-slate-900">
                  {formatWeight(records.bestWeight)} <span className="text-sm font-medium">kg</span>
                </p>
              </div>
              <div className="rounded-2xl border border-amber-200 bg-amber-50 p-3.5 text-center">
                <p className="flex items-center justify-center gap-1 text-xs font-semibold text-amber-600">
                  <StarIcon className="h-3.5 w-3.5" /> Meilleur volume
                </p>
                <p className="mt-1 text-xl font-bold text-slate-900">
                  {formatVolume(records.bestVolume)} <span className="text-sm font-medium">kg</span>
                </p>
              </div>
            </div>
          )}

          {chartPoints.length >= 2 && (
            <div className="rounded-2xl border border-slate-200 bg-surface p-4 shadow-sm">
              <div className="mb-2 flex items-center justify-between">
                <p className="text-sm font-semibold text-slate-700">Progression</p>
                <div className="flex rounded-lg bg-slate-100 p-0.5 text-xs font-medium">
                  <button
                    type="button"
                    onClick={() => setMetric('weight')}
                    className={`rounded-md px-2.5 py-1 ${metric === 'weight' ? 'bg-surface text-accent shadow-sm' : 'text-slate-500'}`}
                  >
                    Poids max
                  </button>
                  <button
                    type="button"
                    onClick={() => setMetric('volume')}
                    className={`rounded-md px-2.5 py-1 ${metric === 'volume' ? 'bg-surface text-accent shadow-sm' : 'text-slate-500'}`}
                  >
                    Volume
                  </button>
                </div>
              </div>
              <ProgressChart points={chartPoints} unit="kg" />
            </div>
          )}

          <div className="space-y-3">
            {entries.map((entry) => {
              const entryVolume = totalVolume(entry.sets)
              return (
                <div
                  key={entry.workout.id}
                  className="rounded-2xl border border-slate-200 bg-surface p-4 shadow-sm"
                >
                  <div className="mb-2 flex items-center justify-between">
                    <p className="text-sm font-semibold text-slate-700">
                      {relativeDateLabel(entry.workout.date)}{' '}
                      <span className="font-normal text-slate-400">
                        · {formatDateFr(entry.workout.date, { withYear: false })}
                      </span>
                    </p>
                    {entryVolume > 0 && (
                      <p className="text-xs font-medium text-slate-400">
                        {formatVolume(entryVolume)} kg
                      </p>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {entry.sets.map((set, i) => (
                      <span
                        key={set.id}
                        className={`flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-sm font-medium ${
                          isPR(set) ? 'bg-amber-50 text-amber-700' : 'bg-slate-50 text-slate-700'
                        }`}
                      >
                        {isPR(set) ? (
                          <StarIcon className="h-3 w-3 text-amber-500" />
                        ) : (
                          <span className="text-slate-400">{i + 1}·</span>
                        )}
                        {formatWeight(set.weight)}kg × {set.reps}
                      </span>
                    ))}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
