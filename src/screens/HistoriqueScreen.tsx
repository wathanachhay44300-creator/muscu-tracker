import { Link } from 'react-router-dom'
import { useWorkoutHistory } from '../hooks/useHistory'
import { formatDateFr, relativeDateLabel } from '../lib/date'
import { formatVolume } from '../lib/stats'
import { CalendarIcon, ChevronRightIcon } from '../components/Icons'

export function HistoriqueScreen() {
  const history = useWorkoutHistory()

  return (
    <div className="mx-auto max-w-md px-4 pt-safe pb-28 pt-4">
      <h1 className="mb-5 text-lg font-bold text-slate-900">Historique</h1>

      {history && history.length === 0 && (
        <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-slate-300 px-4 py-14 text-center">
          <CalendarIcon className="h-10 w-10 text-slate-300" />
          <p className="font-medium text-slate-600">Pas encore de séance enregistrée</p>
          <p className="text-sm text-slate-400">
            Vos séances passées apparaîtront ici une fois enregistrées.
          </p>
        </div>
      )}

      <div className="space-y-2.5">
        {history?.map(({ workout, exerciseCount, setCount, volume }) => (
          <Link
            key={workout.id}
            to={`/historique/${workout.id}`}
            className="flex items-center justify-between rounded-2xl border border-slate-200 bg-white px-4 py-3.5 shadow-sm active:bg-slate-50"
          >
            <div>
              <p className="font-semibold text-slate-900">{relativeDateLabel(workout.date)}</p>
              <p className="text-xs text-slate-400">{formatDateFr(workout.date)}</p>
              <p className="mt-1 text-sm text-slate-500">
                {exerciseCount} exercice{exerciseCount > 1 ? 's' : ''} · {setCount} série
                {setCount > 1 ? 's' : ''}
                {volume > 0 && <> · {formatVolume(volume)} kg</>}
              </p>
            </div>
            <ChevronRightIcon className="h-5 w-5 shrink-0 text-slate-300" />
          </Link>
        ))}
      </div>
    </div>
  )
}
