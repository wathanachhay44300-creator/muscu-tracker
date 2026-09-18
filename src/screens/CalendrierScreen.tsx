import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useWorkoutCalendarDates } from '../hooks/useWorkoutCalendar'
import { computeWeeklyStreak } from '../lib/calendarActions'
import { useSwipeNav, getSlideClass, type SwipeDirection } from '../hooks/useSwipeNav'
import { ChevronLeftIcon, ChevronRightIcon } from '../components/Icons'
import { addMonths, daysInMonth, formatMonthFr, isToday, monthStartOf, todayISO } from '../lib/date'

const WEEKDAY_LABELS = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim']

export function CalendrierScreen() {
  const navigate = useNavigate()
  const [monthStart, setMonthStart] = useState(() => monthStartOf(todayISO()))
  const [enterDir, setEnterDir] = useState<SwipeDirection>(null)
  const workouts = useWorkoutCalendarDates()

  function changeMonth(delta: 1 | -1) {
    setEnterDir(delta > 0 ? 'left' : 'right')
    setMonthStart((v) => addMonths(v, delta))
  }

  const swipe = useSwipeNav({
    onSwipeLeft: () => changeMonth(1),
    onSwipeRight: () => changeMonth(-1),
  })

  const workoutByDate = useMemo(() => {
    const map = new Map<string, number>()
    for (const w of workouts ?? []) map.set(w.date, w.id)
    return map
  }, [workouts])

  const monthPrefix = monthStart.slice(0, 7)
  const monthCount = useMemo(
    () => (workouts ?? []).filter((w) => w.date.startsWith(monthPrefix)).length,
    [workouts, monthPrefix],
  )
  const streak = useMemo(() => computeWeeklyStreak((workouts ?? []).map((w) => w.date)), [workouts])

  const total = daysInMonth(monthStart)
  const [y, m] = monthStart.split('-').map(Number)
  const firstWeekday = (new Date(y, m - 1, 1).getDay() + 6) % 7 // Monday-first: 0=Mon ... 6=Sun
  const cells: (string | null)[] = [
    ...Array.from({ length: firstWeekday }, () => null),
    ...Array.from({ length: total }, (_, i) => `${monthPrefix}-${String(i + 1).padStart(2, '0')}`),
  ]

  return (
    <div className="mx-auto max-w-md px-4 pt-safe pb-28 pt-4 animate-fade-in">
      <div className="mb-5 flex items-center gap-2">
        <button
          type="button"
          onClick={() => navigate('/historique')}
          className="-ml-2 rounded-full p-2 text-slate-400 active:bg-slate-100"
          aria-label="Retour à l'historique"
        >
          <ChevronLeftIcon className="h-5 w-5" />
        </button>
        <h1 className="text-lg font-bold text-slate-900">Calendrier</h1>
      </div>

      <div className="mb-4 flex items-center justify-between">
        <button
          type="button"
          onClick={() => changeMonth(-1)}
          className="rounded-full p-2 text-slate-400 active:bg-slate-100"
          aria-label="Mois précédent"
        >
          <ChevronLeftIcon className="h-5 w-5" />
        </button>
        <p className="text-sm font-semibold capitalize text-slate-800">{formatMonthFr(monthStart)}</p>
        <button
          type="button"
          onClick={() => changeMonth(1)}
          className="rounded-full p-2 text-slate-400 active:bg-slate-100"
          aria-label="Mois suivant"
        >
          <ChevronRightIcon className="h-5 w-5" />
        </button>
      </div>

      <div className="mb-4 flex flex-wrap items-center justify-center gap-x-2.5 gap-y-1 rounded-2xl border border-slate-200 bg-surface px-4 py-3 text-center shadow-sm">
        <p className="text-sm font-medium text-slate-600">
          {monthCount} séance{monthCount > 1 ? 's' : ''} ce mois-ci
        </p>
        {streak >= 1 && (
          <>
            <span className="hidden text-slate-300 sm:inline">·</span>
            <p className="text-sm font-semibold text-amber-600">
              🔥 {streak} semaine{streak > 1 ? 's' : ''} de suite
            </p>
          </>
        )}
      </div>

      <div ref={swipe.ref} {...swipe.handlers} className="touch-pan-y">
        <div key={monthStart} className={getSlideClass(enterDir, swipe.reducedMotion)}>
          <div className="mb-1.5 grid grid-cols-7 text-center text-xs font-medium text-slate-400">
            {WEEKDAY_LABELS.map((d) => (
              <div key={d}>{d}</div>
            ))}
          </div>
          <div className="grid grid-cols-7 gap-y-1">
            {cells.map((date, i) => {
              if (!date) return <div key={i} className="aspect-square" />
              const workoutId = workoutByDate.get(date)
              const today = isToday(date)
              const day = Number(date.slice(-2))
              return (
                <button
                  key={date}
                  type="button"
                  disabled={!workoutId}
                  onClick={() => workoutId && navigate(`/historique/${workoutId}`)}
                  className="flex aspect-square items-center justify-center"
                  aria-label={workoutId ? `${day} — séance enregistrée, voir le détail` : String(day)}
                >
                  <span
                    className={`flex h-9 w-9 items-center justify-center rounded-full text-sm transition-colors ${
                      workoutId
                        ? 'bg-brand-600 font-semibold text-white active:bg-brand-700'
                        : 'font-medium text-slate-600'
                    } ${today ? 'ring-2 ring-brand-400 ring-offset-2 ring-offset-surface' : ''}`}
                  >
                    {day}
                  </span>
                </button>
              )
            })}
          </div>
        </div>
      </div>

      {monthCount === 0 && (
        <p className="mt-6 text-center text-sm text-slate-400">Aucune séance enregistrée ce mois-ci.</p>
      )}
    </div>
  )
}
