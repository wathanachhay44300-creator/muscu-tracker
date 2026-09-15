import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useWorkoutDetail } from '../hooks/useWorkout'
import { deleteWorkout } from '../lib/workoutActions'
import { WorkoutEditor } from '../components/WorkoutEditor'
import { ChevronLeftIcon, TrashIcon } from '../components/Icons'
import { formatDateFr, relativeDateLabel } from '../lib/date'

export function HistoriqueDetailScreen() {
  const { workoutId } = useParams()
  const id = workoutId ? Number(workoutId) : undefined
  const detail = useWorkoutDetail(id)
  const navigate = useNavigate()
  const [confirming, setConfirming] = useState(false)

  if (!detail) {
    return (
      <div className="mx-auto max-w-md px-4 pt-safe pb-28 pt-4 animate-fade-in">
        <p className="text-slate-400">Séance introuvable.</p>
      </div>
    )
  }

  async function handleDelete() {
    await deleteWorkout(id!)
    navigate('/historique')
  }

  return (
    <div className="mx-auto max-w-md px-4 pt-safe pb-28 pt-4 animate-fade-in">
      <div className="mb-5 flex items-center gap-2">
        <button
          type="button"
          onClick={() => navigate('/historique')}
          className="rounded-full p-2 -ml-2 text-slate-400 active:bg-slate-100"
          aria-label="Retour à l'historique"
        >
          <ChevronLeftIcon className="h-5 w-5" />
        </button>
        <div>
          <h1 className="text-lg font-bold text-slate-900">
            {relativeDateLabel(detail.workout.date)}
          </h1>
          <p className="text-xs text-slate-400">{formatDateFr(detail.workout.date)}</p>
        </div>
      </div>

      <WorkoutEditor workoutId={id!} />

      <div className="mt-6">
        {confirming ? (
          <div className="rounded-2xl border border-red-200 bg-red-50 p-4">
            <p className="mb-3 text-sm font-medium text-red-700">
              Supprimer définitivement cette séance et toutes ses séries ?
            </p>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setConfirming(false)}
                className="flex-1 rounded-xl bg-white py-2.5 font-medium text-slate-600 active:bg-slate-100"
              >
                Annuler
              </button>
              <button
                type="button"
                onClick={handleDelete}
                className="flex-1 rounded-xl bg-red-600 py-2.5 font-medium text-white active:bg-red-700"
              >
                Supprimer
              </button>
            </div>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setConfirming(true)}
            className="flex w-full items-center justify-center gap-1.5 py-3 text-sm font-medium text-red-500 active:text-red-700"
          >
            <TrashIcon className="h-4 w-4" />
            Supprimer la séance
          </button>
        )}
      </div>
    </div>
  )
}
