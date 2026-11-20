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
import { t } from '../i18n'

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
        <p className="text-muted">{t('screens.sessionNotFound')}</p>
      </div>
    )
  }

  async function handleDelete() {
    const snapshot = await deleteWorkoutWithUndo(id!)
    navigate('/historique')
    showSnackbar(t('historyDetail.deleted'), () => restoreWorkoutSnapshot(snapshot))
  }

  return (
    <div className="mx-auto max-w-md px-4 pt-safe pb-28 pt-4 animate-fade-in">
      <div className="mb-5 flex items-center gap-2">
        <button
          type="button"
          // Back to wherever the session was opened from (history list or calendar).
          onClick={() => (location.key !== 'default' ? navigate(-1) : navigate('/historique'))}
          className="rounded-full p-2 -ml-2 text-muted active:bg-surface-3"
          aria-label={t('historyDetail.back')}
        >
          <ChevronLeftIcon className="h-5 w-5" />
        </button>
        <div>
          <h1 className="text-lg font-bold text-ink">
            {detail.workout.title ?? template?.name ?? t('common.freeSession')}
          </h1>
          <p className="text-sm font-medium text-ink-2">{formatDateLong(detail.workout.date)}</p>
        </div>
      </div>

      <WorkoutEditor workoutId={id!} />

      <div className="mt-6">
        {confirming ? (
          <div className="rounded-2xl border border-danger-line bg-danger-soft p-4">
            <p className="mb-3 text-sm font-medium text-danger-ink">
              {t('historyDetail.confirmDelete')}
            </p>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setConfirming(false)}
                className="flex-1 rounded-xl bg-surface py-2.5 font-medium text-ink-2 active:bg-surface-3"
              >
                {t('common.cancel')}
              </button>
              <button
                type="button"
                onClick={handleDelete}
                className="flex-1 rounded-xl bg-danger py-2.5 font-medium text-on-danger active:bg-danger"
              >
                {t('common.delete')}
              </button>
            </div>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setConfirming(true)}
            className="flex w-full items-center justify-center gap-1.5 py-3 text-sm font-medium text-danger-ink active:text-danger-ink"
          >
            <TrashIcon className="h-4 w-4" />
            {t('historyDetail.delete')}
          </button>
        )}
      </div>
    </div>
  )
}
