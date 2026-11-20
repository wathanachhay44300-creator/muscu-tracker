import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useWorkoutCalendarDates } from '../hooks/useWorkoutCalendar'
import { computeWeeklyStreak } from '../lib/calendarActions'
import { useSwipeNav, getSlideClass, type SwipeDirection } from '../hooks/useSwipeNav'
import { ChevronLeftIcon, ChevronRightIcon } from '../components/Icons'
import { HistoryTabs } from '../components/HistoryTabs'
import { ConfirmDialog } from '../components/ConfirmDialog'
import { formatDateLong, weekdayShortNames } from '../lib/date'
import { getOrCreateWorkout } from '../lib/workoutActions'
import { addMonths, daysInMonth, formatMonth, isToday, monthStartOf, todayISO } from '../lib/date'
import { t, tn } from '../i18n'

export function CalendrierScreen() {
  const navigate = useNavigate()
  const todayStr = todayISO()
  const [addingDate, setAddingDate] = useState<string | null>(null)
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
      <h1 className="mb-4 pt-2 !text-[2rem] leading-none text-ink">{t('screens.history')}</h1>
      <HistoryTabs />

      <div className="mb-4 flex items-center justify-between">
        <button
          type="button"
          onClick={() => changeMonth(-1)}
          className="rounded-full p-2 text-muted active:bg-surface-3"
          aria-label={t('calendar.prevMonth')}
        >
          <ChevronLeftIcon className="h-5 w-5" />
        </button>
        <p className="text-sm font-semibold capitalize text-ink">{formatMonth(monthStart)}</p>
        <button
          type="button"
          onClick={() => changeMonth(1)}
          className="rounded-full p-2 text-muted active:bg-surface-3"
          aria-label={t('calendar.nextMonth')}
        >
          <ChevronRightIcon className="h-5 w-5" />
        </button>
      </div>

      <div className="mb-4 flex flex-wrap items-center justify-center gap-x-2.5 gap-y-1 rounded-2xl border border-line bg-surface px-4 py-3 text-center shadow-sm">
        <p className="text-sm font-medium text-ink-2">
          {tn('calendar.monthCount', monthCount)}
        </p>
        {streak >= 1 && (
          <>
            <span className="hidden text-faint sm:inline">·</span>
            <p className="text-sm font-semibold text-highlight-ink">
              {tn('calendar.streak', streak)}
            </p>
          </>
        )}
      </div>

      <div ref={swipe.ref} {...swipe.handlers} className="touch-pan-y">
        <div key={monthStart} className={getSlideClass(enterDir, swipe.reducedMotion)}>
          <div className="mb-1.5 grid grid-cols-7 text-center text-xs font-medium text-muted">
            {weekdayShortNames().map((d) => (
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
                  disabled={!workoutId && date > todayStr}
                  onClick={() => (workoutId ? navigate(`/historique/${workoutId}`) : setAddingDate(date))}
                  className="flex aspect-square items-center justify-center disabled:opacity-40"
                  aria-label={
                    workoutId
                      ? t('calendar.dayLogged', { day })
                      : date > todayStr
                        ? String(day)
                        : t('calendar.dayAdd', { day })
                  }
                >
                  <span
                    className={`flex h-9 w-9 items-center justify-center rounded-full text-sm transition-colors ${
                      workoutId
                        ? 'bg-accent font-semibold text-on-accent active:bg-accent-hover'
                        : 'font-medium text-ink-2'
                    } ${today ? 'ring-2 ring-accent-line ring-offset-2 ring-offset-surface' : ''}`}
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
        <p className="mt-6 text-center text-sm text-muted">{t('calendar.emptyMonth')}</p>
      )}

      {addingDate && (
        <ConfirmDialog
          title={t('calendar.addTitle', { date: formatDateLong(addingDate) })}
          message={t('calendar.addMessage')}
          confirmLabel={t('common.add')}
          onConfirm={async () => {
            const date = addingDate
            setAddingDate(null)
            const id = await getOrCreateWorkout(date)
            navigate(`/seance/${id}`)
          }}
          onCancel={() => setAddingDate(null)}
        />
      )}
    </div>
  )
}
