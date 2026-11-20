import { useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { useWeeklyMuscleBreakdown } from '../hooks/useWeeklyBreakdown'
import { MuscleGroupBreakdown } from '../components/MuscleGroupBreakdown'
import { ChevronLeftIcon, ChevronRightIcon } from '../components/Icons'
import { addDays, addWeeks, formatDateShort, mondayOf, todayISO } from '../lib/date'
import { t, tn } from '../i18n'

export function WeeklyBreakdownScreen() {
  const [weekStart, setWeekStart] = useState(() => mondayOf(todayISO()))
  const items = useWeeklyMuscleBreakdown(weekStart)
  const navigate = useNavigate()
  const location = useLocation()

  const weekEnd = addDays(weekStart, 6)
  const isCurrentWeek = weekStart === mondayOf(todayISO())
  const totalSets = items?.reduce((sum, i) => sum + i.setCount, 0) ?? 0

  return (
    <div className="mx-auto max-w-md px-4 pt-safe pb-28 pt-4 animate-fade-in">
      <div className="mb-5 flex items-center gap-2">
        <button
          type="button"
          onClick={() => (location.key !== 'default' ? navigate(-1) : navigate('/progres'))}
          className="-ml-2 rounded-full p-2 text-muted active:bg-surface-3"
          aria-label={t('common.back')}
        >
          <ChevronLeftIcon className="h-5 w-5" />
        </button>
        <h1 className="text-lg font-bold text-ink">{t('screens.weekly')}</h1>
      </div>

      <div className="mb-5 flex items-center justify-between">
        <button
          type="button"
          onClick={() => setWeekStart((w) => addWeeks(w, -1))}
          className="rounded-full p-2 text-muted active:bg-surface-3"
          aria-label={t('weekly.prevWeek')}
        >
          <ChevronLeftIcon className="h-5 w-5" />
        </button>
        <div className="text-center">
          <p className="text-sm font-semibold text-ink-2">
            {isCurrentWeek ? t('weekly.thisWeek') : formatDateShort(weekStart, { withYear: false })}
          </p>
          <p className="text-xs text-muted">
            {formatDateShort(weekStart, { withYear: false })} – {formatDateShort(weekEnd, { withYear: false })}
          </p>
        </div>
        <button
          type="button"
          onClick={() => setWeekStart((w) => addWeeks(w, 1))}
          className="rounded-full p-2 text-muted active:bg-surface-3"
          aria-label={t('weekly.nextWeek')}
        >
          <ChevronRightIcon className="h-5 w-5" />
        </button>
      </div>

      {items && totalSets === 0 ? (
        <div className="rounded-2xl border border-dashed border-line-strong px-4 py-14 text-center">
          <p className="text-muted">{t('weekly.empty')}</p>
        </div>
      ) : (
        <>
          <p className="mb-3 text-center text-xs font-medium text-muted">
            {tn('weekly.total', totalSets)}
          </p>
          <MuscleGroupBreakdown items={items ?? []} title={t('weekly.perMuscle')} />
        </>
      )}
    </div>
  )
}
