import { useState } from 'react'
import { dateToISO, todayISO } from '../lib/date'
import { ChevronLeftIcon, ChevronRightIcon } from './Icons'

const WEEKDAY_LABELS = ['L', 'M', 'M', 'J', 'V', 'S', 'D']
const MONTH_LABELS = [
  'Janvier',
  'Février',
  'Mars',
  'Avril',
  'Mai',
  'Juin',
  'Juillet',
  'Août',
  'Septembre',
  'Octobre',
  'Novembre',
  'Décembre',
]

interface PlanningCalendarProps {
  /** date -> template name, used to mark which days have a planned session. */
  plannedDates: Map<string, string>
  onSelectDate: (date: string) => void
}

/** Compact month grid — no library, just enough to show planned days and jump to one. */
export function PlanningCalendar({ plannedDates, onSelectDate }: PlanningCalendarProps) {
  const [cursor, setCursor] = useState(() => {
    const d = new Date()
    d.setDate(1)
    return d
  })
  const today = todayISO()

  const year = cursor.getFullYear()
  const month = cursor.getMonth()
  const firstWeekday = (new Date(year, month, 1).getDay() + 6) % 7 // Monday-first
  const daysInMonth = new Date(year, month + 1, 0).getDate()

  const cells: (string | null)[] = [
    ...Array(firstWeekday).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => dateToISO(new Date(year, month, i + 1))),
  ]

  return (
    <div className="rounded-2xl border border-slate-200 bg-surface p-4 shadow-sm">
      <div className="mb-3 flex items-center justify-between">
        <button
          type="button"
          onClick={() => setCursor(new Date(year, month - 1, 1))}
          className="rounded-full p-1.5 text-slate-400 active:bg-slate-100"
          aria-label="Mois précédent"
        >
          <ChevronLeftIcon className="h-4 w-4" />
        </button>
        <p className="text-sm font-semibold text-slate-700">
          {MONTH_LABELS[month]} {year}
        </p>
        <button
          type="button"
          onClick={() => setCursor(new Date(year, month + 1, 1))}
          className="rounded-full p-1.5 text-slate-400 active:bg-slate-100"
          aria-label="Mois suivant"
        >
          <ChevronRightIcon className="h-4 w-4" />
        </button>
      </div>

      <div className="grid grid-cols-7 gap-y-1 text-center">
        {WEEKDAY_LABELS.map((w, i) => (
          <div key={i} className="text-[10px] font-semibold text-slate-400">
            {w}
          </div>
        ))}
        {cells.map((iso, i) => {
          if (!iso) return <div key={`blank-${i}`} />
          const hasPlan = plannedDates.has(iso)
          return (
            <button
              key={iso}
              type="button"
              onClick={() => onSelectDate(iso)}
              className="flex flex-col items-center gap-0.5 py-0.5"
              title={plannedDates.get(iso) || undefined}
            >
              <span
                className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-medium ${
                  iso === today ? 'bg-brand-600 text-white' : 'text-slate-700 active:bg-slate-100'
                }`}
              >
                {Number(iso.slice(-2))}
              </span>
              <span className={`h-1 w-1 rounded-full ${hasPlan ? 'bg-brand-500' : 'bg-transparent'}`} />
            </button>
          )
        })}
      </div>
    </div>
  )
}
