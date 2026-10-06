import { useState } from 'react'
import { useLocation, useNavigate, useParams } from 'react-router-dom'
import { useWorkoutDetail } from '../hooks/useWorkout'
import { deleteWorkoutWithUndo, restoreWorkoutSnapshot } from '../lib/workoutActions'
import { useSnackbar } from '../contexts/SnackbarContext'
import { WorkoutEditor } from '../components/WorkoutEditor'
import { ChevronLeftIcon, TrashIcon } from '../components/Icons'
import { formatDateLong } from '../lib/date'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '../db'

export function HistoriqueDetailScreen() {
  const { workoutId } = useParams()
  const id = workoutId ? Number(workoutId) : undefined
  const detail = useWorkoutDetail(id)
  const navigate = useNavigate()
  const location = useLocation()
  const { showSnackbar } = useSnackbar()
  const [confirming, setConfirming] = useState(false)
  const template = useLiveQuery(
    () => (detail?.workout.templateId ? db.workoutTemplates.get(detail.workout.templateId) : undefined),
    [detail?.workout.templateId],
  )

  if (!detail) {
    return (
      <div className="mx-auto max-w-md px-4 pt-safe pb-28 pt-4 animate-fade-in">
        <p className="text-slate-400">Séance introuvable.</p>
      </div>
    )
  }

  async function handleDelete() {
    const snapshot = await deleteWorkoutWithUndo(id!)
    navigate('/historique')
    showSnackbar('Séance supprimée', () => restoreWorkoutSnapshot(snapshot))
  }

  return (
    <div className="mx-auto max-w-md px-4 pt-safe pb-28 pt-4 animate-fade-in">
      <div className="mb-5 flex items-center gap-2">
        <button
          type="button"
          // Back to wherever the session was opened from (history list or calendar).
          onClick={() => (location.key !== 'default' ? navigate(-1) : navigate('/historique'))}
          className="rounded-full p-2 -ml-2 text-slate-400 active:bg-slate-100"
          aria-label="Retour à l'historique"
        >
          <ChevronLeftIcon className="h-5 w-5" />
        </button>
        <div>
          <h1 className="text-lg font-bold text-slate-900">
            {detail.workout.title ?? template?.name ?? 'Séance libre'}
          </h1>
          <p className="text-sm font-medium text-slate-600">{formatDateLong(detail.workout.date)}</p>
        </div>
      </div>

      <WorkoutEditor workoutId={id!} />

      <div className="mt-6">
        {confirming ? (
          <div className="rounded-2xl border border-red-200 bg-red-50 p-4">
            <p className="mb-3 text-sm font-medium text-red-700">
              Supprimer cette séance et toutes ses séries ?
            </p>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setConfirming(false)}
                className="flex-1 rounded-xl bg-surface py-2.5 font-medium text-slate-600 active:bg-slate-100"
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
