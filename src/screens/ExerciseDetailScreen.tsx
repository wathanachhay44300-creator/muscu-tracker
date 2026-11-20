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
      .map((entry) => {
        const value =
          metric === 'weight' ? Math.max(...entry.sets.map((s) => s.weight)) : totalVolume(entry.sets)
        const isPR =
          metric === 'weight'
            ? !!records && records.bestWeight > 0 && value === records.bestWeight
            : !!records && records.bestVolume > 0 && value === records.bestVolume
        return { date: entry.workout.date, value, isPR }
      })
  }, [history, metric, records])

  if (!history) {
    return (
      <div className="mx-auto max-w-md px-4 pt-safe pb-28 pt-4 animate-fade-in">
        <p className="text-muted">Exercice introuvable.</p>
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
          className="-ml-2 rounded-full p-2 text-muted active:bg-surface-3"
          aria-label="Retour aux exercices"
        >
          <ChevronLeftIcon className="h-5 w-5" />
        </button>
        <div>
          <h1 className="font-exercise text-lg text-ink">{exercise.name}</h1>
          <p className="text-xs font-medium text-muted">
            {exercise.muscleGroup}
            {exercise.deletedAt && ' · Supprimé de la bibliothèque'}
          </p>
        </div>
      </div>

      {entries.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-line-strong px-4 py-14 text-center">
          <p className="text-muted">Pas encore de séries enregistrées</p>
          <p className="mt-1 text-sm text-muted">
            L'historique de cet exercice apparaîtra ici après votre première séance.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {records && (records.bestWeight > 0 || records.bestVolume > 0) && (
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-2xl border border-highlight-line bg-highlight-soft p-3.5 text-center">
                <p className="flex items-center justify-center gap-1 text-xs font-semibold text-highlight-ink">
                  <StarIcon className="h-3.5 w-3.5" /> Meilleur poids
                </p>
                <p className="mt-1 font-numbers text-xl font-bold text-ink">
                  {formatWeight(records.bestWeight)} <span className="text-sm font-medium">kg</span>
                </p>
              </div>
              <div className="rounded-2xl border border-highlight-line bg-highlight-soft p-3.5 text-center">
                <p className="flex items-center justify-center gap-1 text-xs font-semibold text-highlight-ink">
                  <StarIcon className="h-3.5 w-3.5" /> Meilleur volume
                </p>
                <p className="mt-1 font-numbers text-xl font-bold text-ink">
                  {formatVolume(records.bestVolume)} <span className="text-sm font-medium">kg</span>
                </p>
              </div>
            </div>
          )}

          {entries.length < 2 ? (
            <div className="rounded-2xl border border-dashed border-line-strong px-4 py-6 text-center">
              <p className="text-sm font-medium text-muted">
                Pas encore assez de données pour un graphique
              </p>
              <p className="mt-1 text-xs text-muted">
                Reviens après ta prochaine séance sur cet exercice.
              </p>
            </div>
          ) : (
            <div className="rounded-2xl border border-line bg-surface p-4 shadow-sm">
              <div className="mb-2 flex items-center justify-between">
                <p className="text-sm font-semibold text-ink-2">Progression</p>
                <div className="flex rounded-lg bg-surface-3 p-0.5 text-xs font-medium">
                  <button
                    type="button"
                    onClick={() => setMetric('weight')}
                    className={`rounded-md px-2.5 py-1 ${metric === 'weight' ? 'bg-surface text-accent-ink shadow-sm' : 'text-muted'}`}
                  >
                    Poids max
                  </button>
                  <button
                    type="button"
                    onClick={() => setMetric('volume')}
                    className={`rounded-md px-2.5 py-1 ${metric === 'volume' ? 'bg-surface text-accent-ink shadow-sm' : 'text-muted'}`}
                  >
                    Volume
                  </button>
                </div>
              </div>
              <ProgressChart points={chartPoints} unit="kg" />
              <p className="mt-1 text-center text-[11px] text-muted">Touchez un point pour voir sa valeur</p>
            </div>
          )}

          <div className="space-y-3">
            {entries.map((entry) => {
              const entryVolume = totalVolume(entry.sets)
              return (
                <div
                  key={entry.workout.id}
                  className="rounded-2xl border border-line bg-surface p-4 shadow-sm"
                >
                  <div className="mb-2 flex items-center justify-between">
                    <p className="text-sm font-semibold text-ink-2">
                      {relativeDateLabel(entry.workout.date)}{' '}
                      <span className="font-normal text-muted">
                        · {formatDateFr(entry.workout.date, { withYear: false })}
                      </span>
                    </p>
                    {entryVolume > 0 && (
                      <p className="text-xs font-medium text-muted">
                        {formatVolume(entryVolume)} kg
                      </p>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {entry.sets.map((set, i) => (
                      <span
                        key={set.id}
                        className={`flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-sm font-medium ${
                          isPR(set) ? 'bg-highlight-soft text-highlight-ink' : 'bg-surface-2 text-ink-2'
                        }`}
                      >
                        {isPR(set) ? (
                          <StarIcon className="h-3 w-3 text-highlight" />
                        ) : (
                          <span className="text-muted">{i + 1}·</span>
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
