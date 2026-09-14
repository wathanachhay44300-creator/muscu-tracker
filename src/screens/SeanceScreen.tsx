import { useState } from 'react'
import { useParams } from 'react-router-dom'
import { WorkoutEditor } from '../components/WorkoutEditor'
import { ChevronLeftIcon, ChevronRightIcon, ClipboardIcon, DumbbellIcon } from '../components/Icons'
import { useWorkoutIdForDate } from '../hooks/useWorkout'
import { usePlannedSessionForDate } from '../hooks/usePlannedSessions'
import { getOrCreateWorkout } from '../lib/workoutActions'
import { startWorkoutFromTemplate } from '../lib/planningActions'
import { addDays, formatDateFr, relativeDateLabel, todayISO } from '../lib/date'

export function SeanceScreen() {
  const { date: dateParam } = useParams()
  const [date, setDate] = useState(dateParam || todayISO())
  const workoutId = useWorkoutIdForDate(date)
  const planned = usePlannedSessionForDate(date)
  const [starting, setStarting] = useState(false)

  async function handleStart() {
    setStarting(true)
    await getOrCreateWorkout(date)
    setStarting(false)
  }

  async function handleStartFromTemplate() {
    if (!planned) return
    setStarting(true)
    await startWorkoutFromTemplate(date, planned.session.templateId)
    setStarting(false)
  }

  return (
    <div className="mx-auto max-w-md px-4 pt-safe pb-28 pt-4">
      <div className="mb-5 flex items-center justify-between">
        <button
          type="button"
          onClick={() => setDate((d) => addDays(d, -1))}
          className="rounded-full p-2 text-slate-400 active:bg-slate-100"
          aria-label="Jour précédent"
        >
          <ChevronLeftIcon className="h-5 w-5" />
        </button>

        <div className="text-center">
          <h1 className="text-lg font-bold text-slate-900">{relativeDateLabel(date)}</h1>
          {relativeDateLabel(date) !== formatDateFr(date) && (
            <p className="text-xs text-slate-400">{formatDateFr(date)}</p>
          )}
        </div>

        <button
          type="button"
          onClick={() => setDate((d) => addDays(d, 1))}
          className="rounded-full p-2 text-slate-400 active:bg-slate-100"
          aria-label="Jour suivant"
        >
          <ChevronRightIcon className="h-5 w-5" />
        </button>
      </div>

      {workoutId ? (
        <WorkoutEditor workoutId={workoutId} />
      ) : (
        <div className="flex flex-col items-center gap-4 rounded-2xl border border-dashed border-slate-300 px-4 py-14 text-center">
          {planned ? (
            <>
              <ClipboardIcon className="h-10 w-10 text-brand-300" />
              <div>
                <p className="font-medium text-slate-600">Séance planifiée</p>
                <p className="mt-1 text-sm text-slate-400">{planned.templateName}</p>
              </div>
              <div className="mt-2 flex w-full flex-col gap-2">
                <button
                  type="button"
                  onClick={handleStartFromTemplate}
                  disabled={starting}
                  className="rounded-2xl bg-brand-600 px-6 py-3.5 font-semibold text-white shadow-sm active:bg-brand-700 disabled:opacity-50"
                >
                  Démarrer « {planned.templateName} »
                </button>
                <button
                  type="button"
                  onClick={handleStart}
                  disabled={starting}
                  className="rounded-2xl bg-slate-100 px-6 py-3 font-medium text-slate-600 active:bg-slate-200 disabled:opacity-50"
                >
                  Démarrer une séance vide
                </button>
              </div>
            </>
          ) : (
            <>
              <DumbbellIcon className="h-10 w-10 text-slate-300" />
              <div>
                <p className="font-medium text-slate-600">Aucune séance ce jour-là</p>
                <p className="mt-1 text-sm text-slate-400">
                  Démarrez une séance pour commencer à noter vos exercices.
                </p>
              </div>
              <button
                type="button"
                onClick={handleStart}
                disabled={starting}
                className="mt-2 rounded-2xl bg-brand-600 px-6 py-3.5 font-semibold text-white shadow-sm active:bg-brand-700 disabled:opacity-50"
              >
                Commencer la séance
              </button>
            </>
          )}
        </div>
      )}
    </div>
  )
}
