import { useNavigate, useParams } from 'react-router-dom'
import { useWorkoutDetail } from '../hooks/useWorkout'
import { useWorkoutComparison } from '../hooks/useWorkoutComparison'
import { ExerciseComparisonCard } from '../components/ExerciseComparisonCard'
import { ClipboardIcon, StarIcon } from '../components/Icons'
import { formatVolume, totalVolume } from '../lib/stats'
import { formatDateFr, formatDuration } from '../lib/date'

export function BilanScreen() {
  const { workoutId } = useParams()
  const id = workoutId ? Number(workoutId) : undefined
  const detail = useWorkoutDetail(id)
  const comparison = useWorkoutComparison(id)
  const navigate = useNavigate()

  if (!detail || !comparison) {
    return (
      <div className="mx-auto max-w-md px-4 pt-safe pb-28 pt-4 animate-fade-in">
        <p className="text-slate-400">Bilan introuvable.</p>
      </div>
    )
  }

  const { workout, exercises } = detail
  const setCount = exercises.reduce((sum, we) => sum + we.sets.length, 0)
  const volume = totalVolume(exercises.flatMap((we) => we.sets))
  const durationMs = workout.finishedAt ? workout.finishedAt - workout.createdAt : null

  return (
    <div className="mx-auto max-w-md px-4 pt-safe pb-28 pt-4 animate-fade-in">
      <div className="mb-5 text-center">
        <ClipboardIcon className="mx-auto mb-2 h-9 w-9 text-brand-500" />
        <h1 className="text-lg font-bold text-slate-900">Bilan de la séance</h1>
        <p className="text-sm text-slate-400">{formatDateFr(workout.date)}</p>
      </div>

      {comparison.prExerciseNames.length > 0 && (
        <div className="animate-pop-in mb-4 flex items-start gap-2.5 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3.5">
          <StarIcon className="mt-0.5 h-5 w-5 shrink-0 text-amber-500" />
          <p className="text-sm font-semibold text-amber-700">
            {comparison.prExerciseNames.length === 1
              ? `Nouveau record sur ${comparison.prExerciseNames[0]} !`
              : `Nouveaux records sur ${comparison.prExerciseNames.join(', ')} !`}
          </p>
        </div>
      )}

      <div className="mb-5 grid grid-cols-2 gap-2.5">
        <SummaryTile label="Exercices" value={String(exercises.length)} />
        <SummaryTile label="Séries" value={String(setCount)} />
        <SummaryTile label="Volume" value={volume > 0 ? `${formatVolume(volume)} kg` : '—'} />
        <SummaryTile label="Durée" value={durationMs != null ? formatDuration(durationMs) : '—'} />
      </div>

      {exercises.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-slate-300 px-4 py-8 text-center text-sm text-slate-400">
          Aucun exercice dans cette séance.
        </p>
      ) : (
        <div className="space-y-3">
          {exercises.map((we, i) => (
            <ExerciseComparisonCard
              key={we.id}
              we={we}
              comparison={comparison.byWorkoutExerciseId.get(we.id!)}
              style={{ animationDelay: `${i * 40}ms` }}
            />
          ))}
        </div>
      )}

      <button
        type="button"
        onClick={() => navigate('/')}
        className="mt-6 w-full rounded-2xl bg-brand-600 py-3.5 font-semibold text-white shadow-sm active:bg-brand-700"
      >
        Retour à l'accueil
      </button>
    </div>
  )
}

function SummaryTile({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-surface px-3.5 py-3 text-center shadow-sm">
      <p className="text-lg font-bold text-slate-900">{value}</p>
      <p className="text-xs font-medium text-slate-400">{label}</p>
    </div>
  )
}
