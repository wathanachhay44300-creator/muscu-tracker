import { useEffect, useRef } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useWorkoutDetail } from '../hooks/useWorkout'
import { useWorkoutComparison } from '../hooks/useWorkoutComparison'
import { usePreferences } from '../hooks/usePreferences'
import { useCountUp } from '../hooks/useCountUp'
import { ExerciseComparisonCard } from '../components/ExerciseComparisonCard'
import { Confetti } from '../components/Confetti'
import { ClipboardIcon, SpeakerOffIcon, SpeakerOnIcon, StarIcon } from '../components/Icons'
import { formatVolume, totalVolume } from '../lib/stats'
import { formatDateFr, formatDuration } from '../lib/date'
import { setSoundEnabled } from '../lib/settingsActions'
import { playRecordChime } from '../lib/sound'

export function BilanScreen() {
  const { workoutId } = useParams()
  const id = workoutId ? Number(workoutId) : undefined
  const detail = useWorkoutDetail(id)
  const comparison = useWorkoutComparison(id)
  const preferences = usePreferences()
  const navigate = useNavigate()

  const hasPR = !!comparison && comparison.prExerciseNames.length > 0
  const chimePlayed = useRef(false)

  useEffect(() => {
    if (chimePlayed.current) return
    if (!hasPR || !preferences) return
    if (preferences.soundEnabled) playRecordChime()
    chimePlayed.current = true
  }, [hasPR, preferences])

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
      {hasPR && <Confetti />}

      <div className="relative mb-5 text-center">
        <button
          type="button"
          onClick={() => setSoundEnabled(!preferences?.soundEnabled)}
          className="absolute right-0 top-0 flex h-9 w-9 items-center justify-center rounded-full bg-slate-100 text-slate-500 active:bg-slate-200"
          aria-label={preferences?.soundEnabled ? 'Désactiver le son' : 'Activer le son'}
          title={preferences?.soundEnabled ? 'Son activé' : 'Son désactivé'}
        >
          {preferences?.soundEnabled ? (
            <SpeakerOnIcon className="h-4 w-4" />
          ) : (
            <SpeakerOffIcon className="h-4 w-4" />
          )}
        </button>
        <ClipboardIcon className="mx-auto mb-2 h-9 w-9 text-brand-500" />
        <h1 className="text-lg font-bold text-slate-900">Bilan de la séance</h1>
        <p className="text-sm text-slate-400">{formatDateFr(workout.date)}</p>
      </div>

      {hasPR && (
        <div className="animate-pop-in mb-4 flex items-start gap-2.5 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3.5">
          <StarIcon className="pr-star-glow mt-0.5 h-5 w-5 shrink-0 text-amber-500" />
          <p className="text-sm font-semibold text-amber-700">
            {comparison.prExerciseNames.length === 1
              ? `Nouveau record sur ${comparison.prExerciseNames[0]} !`
              : `Nouveaux records sur ${comparison.prExerciseNames.join(', ')} !`}
          </p>
        </div>
      )}

      <div className="mb-5 grid grid-cols-2 gap-2.5">
        <SummaryTile label="Exercices" target={exercises.length} formatValue={(n) => String(Math.round(n))} />
        <SummaryTile label="Séries" target={setCount} formatValue={(n) => String(Math.round(n))} />
        <SummaryTile
          label="Volume"
          target={volume}
          formatValue={(n) => (volume > 0 ? `${formatVolume(n)} kg` : '—')}
        />
        <SummaryTile
          label="Durée"
          target={durationMs ?? 0}
          formatValue={(n) => (durationMs != null ? formatDuration(n) : '—')}
        />
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

function SummaryTile({
  label,
  target,
  formatValue,
}: {
  label: string
  target: number
  formatValue: (n: number) => string
}) {
  const animated = useCountUp(target)
  return (
    <div className="rounded-2xl border border-slate-200 bg-surface px-3.5 py-3 text-center shadow-sm">
      <p className="text-lg font-bold tabular-nums text-slate-900">{formatValue(animated)}</p>
      <p className="text-xs font-medium text-slate-400">{label}</p>
    </div>
  )
}
