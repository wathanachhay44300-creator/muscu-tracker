import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useWeeklyMuscleBreakdown } from '../hooks/useWeeklyBreakdown'
import { MuscleGroupBreakdown } from '../components/MuscleGroupBreakdown'
import { ChevronLeftIcon, ChevronRightIcon } from '../components/Icons'
import { addDays, addWeeks, formatDateFr, mondayOf, todayISO } from '../lib/date'

export function WeeklyBreakdownScreen() {
  const [weekStart, setWeekStart] = useState(() => mondayOf(todayISO()))
  const items = useWeeklyMuscleBreakdown(weekStart)
  const navigate = useNavigate()

  const weekEnd = addDays(weekStart, 6)
  const isCurrentWeek = weekStart === mondayOf(todayISO())
  const totalSets = items?.reduce((sum, i) => sum + i.setCount, 0) ?? 0

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
        <h1 className="text-lg font-bold text-slate-900">Répartition hebdomadaire</h1>
      </div>

      <div className="mb-5 flex items-center justify-between">
        <button
          type="button"
          onClick={() => setWeekStart((w) => addWeeks(w, -1))}
          className="rounded-full p-2 text-slate-400 active:bg-slate-100"
          aria-label="Semaine précédente"
        >
          <ChevronLeftIcon className="h-5 w-5" />
        </button>
        <div className="text-center">
          <p className="text-sm font-semibold text-slate-700">
            {isCurrentWeek ? 'Cette semaine' : formatDateFr(weekStart, { withYear: false })}
          </p>
          <p className="text-xs text-slate-400">
            {formatDateFr(weekStart, { withYear: false })} – {formatDateFr(weekEnd, { withYear: false })}
          </p>
        </div>
        <button
          type="button"
          onClick={() => setWeekStart((w) => addWeeks(w, 1))}
          className="rounded-full p-2 text-slate-400 active:bg-slate-100"
          aria-label="Semaine suivante"
        >
          <ChevronRightIcon className="h-5 w-5" />
        </button>
      </div>

      {items && totalSets === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-300 px-4 py-14 text-center">
          <p className="text-slate-500">Aucune série enregistrée cette semaine-là.</p>
        </div>
      ) : (
        <>
          <p className="mb-3 text-center text-xs font-medium text-slate-400">
            {totalSets} série{totalSets > 1 ? 's' : ''} au total
          </p>
          <MuscleGroupBreakdown items={items ?? []} title="Séries par muscle" />
        </>
      )}
    </div>
  )
}
