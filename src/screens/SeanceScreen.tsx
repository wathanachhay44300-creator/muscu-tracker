import { useState } from 'react'
import { useParams } from 'react-router-dom'
import { WorkoutEditor } from '../components/WorkoutEditor'
import { ThemeToggle } from '../components/ThemeToggle'
import { ChevronLeftIcon, ChevronRightIcon } from '../components/Icons'
import { useWorkoutIdForDate } from '../hooks/useWorkout'
import { usePlannedSessionForDate } from '../hooks/usePlannedSessions'
import { useTemplates } from '../hooks/useTemplates'
import { getOrCreateWorkout } from '../lib/workoutActions'
import { startWorkoutFromTemplate } from '../lib/planningActions'
import { addDays, formatDateFr, relativeDateLabel, todayISO } from '../lib/date'
import { StartSessionPicker } from '../components/StartSessionPicker'

export function SeanceScreen() {
  const { date: dateParam } = useParams()
  const [date, setDate] = useState(dateParam || todayISO())
  const workoutId = useWorkoutIdForDate(date)
  const planned = usePlannedSessionForDate(date)
  const templates = useTemplates()
  const [starting, setStarting] = useState(false)

  async function handleStart() {
    setStarting(true)
    await getOrCreateWorkout(date)
    setStarting(false)
  }

  async function handleStartFromTemplate(templateId: number) {
    setStarting(true)
    await startWorkoutFromTemplate(date, templateId)
    setStarting(false)
  }

  return (
    <div className="mx-auto max-w-md px-4 pt-safe pb-28 pt-4 animate-fade-in">
      <div className="mb-2 flex justify-end">
        <ThemeToggle />
      </div>
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
        <StartSessionPicker
          templates={templates}
          plannedTemplateId={planned?.session.templateId}
          starting={starting}
          onStartFromTemplate={handleStartFromTemplate}
          onStartFree={handleStart}
        />
      )}
    </div>
  )
}
