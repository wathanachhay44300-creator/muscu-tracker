import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useBodyMeasurementForDate, useBodyMeasurements } from '../hooks/useBodyMeasurements'
import { usePreferences } from '../hooks/usePreferences'
import { clearMeasurementFields, upsertBodyMeasurement } from '../lib/bodyActions'
import { ProgressChart } from '../components/ProgressChart'
import { ConfirmDialog } from '../components/ConfirmDialog'
import { WeightChart } from '../components/WeightChart'
import { WeightEditSheet } from '../components/WeightEditSheet'
import { ChevronLeftIcon, ChevronRightIcon, PlusIcon, ScaleIcon, TrashIcon } from '../components/Icons'
import { addDays, formatDateFr, relativeDateLabel, todayISO } from '../lib/date'
import { formatKg, formatSigned, mapByDate, weeklySummaries, type DayEntry, type WeekSummary } from '../lib/tracking'
import type { BodyMeasurement, WeightGoal } from '../types'

const MEASURES = [
  { key: 'chest', label: 'Poitrine', unit: 'cm' },
  { key: 'waist', label: 'Taille', unit: 'cm' },
  { key: 'hips', label: 'Hanches', unit: 'cm' },
  { key: 'arms', label: 'Bras', unit: 'cm' },
  { key: 'thighs', label: 'Cuisses', unit: 'cm' },
] as const

type MeasureKey = (typeof MEASURES)[number]['key']

type Period = '14' | '30' | '90' | 'all'
const PERIODS: { key: Period; label: string }[] = [
  { key: '14', label: '2 sem.' },
  { key: '30', label: '1 mois' },
  { key: '90', label: '3 mois' },
  { key: 'all', label: 'Tout' },
]

const RECENT_WEIGHINGS = 7
const WEEKS_SHOWN = 6

type Weighing = { date: string; weight: number }

export function CorpsScreen() {
  const navigate = useNavigate()
  const measurements = useBodyMeasurements()
  const preferences = usePreferences()
  const today = todayISO()
  const [period, setPeriod] = useState<Period>('30')
  const [showAllWeighings, setShowAllWeighings] = useState(false)
  const [showAllWeeks, setShowAllWeeks] = useState(false)
  const [expandedWeek, setExpandedWeek] = useState<string | null>(null)
  // null = closed; { entry: null } = adding a new weigh-in.
  const [editing, setEditing] = useState<{ entry: Weighing | null } | null>(null)

  // One weight history, shared with the "Pas, poids & calories" screen.
  const byDate = useMemo(() => mapByDate(measurements ?? []), [measurements])
  const weighings = useMemo(
    () =>
      [...byDate.values()]
        .filter((e): e is DayEntry & { weight: number } => e.weight != null)
        .map((e) => ({ date: e.date, weight: e.weight }))
        .sort((a, b) => (a.date < b.date ? 1 : -1)), // newest first
    [byDate],
  )
  const weightByDate = useMemo(() => new Map(weighings.map((w) => [w.date, w.weight])), [weighings])

  const start = useMemo(() => {
    if (period !== 'all') return addDays(today, -(Number(period) - 1))
    const first = weighings[weighings.length - 1]?.date
    const minStart = addDays(today, -13)
    return first && first < minStart ? first : minStart
  }, [period, weighings, today])

  const inPeriod = weighings.filter((w) => w.date >= start)
  const weeks = useMemo(
    () => weeklySummaries(byDate, weighings[weighings.length - 1]?.date ?? today, today).filter((w) => w.weight != null),
    [byDate, weighings, today],
  )

  const singleValue = (w: Weighing, note: string) => (
    <div className="py-4 text-center">
      <button type="button" onClick={() => setEditing({ entry: w })} className="rounded-2xl px-6 py-2 active:bg-slate-100">
        <span className="block text-3xl font-bold tabular-nums text-slate-900">{formatKg(w.weight)} kg</span>
        <span className="block text-xs text-slate-400">{relativeDateLabel(w.date)}</span>
      </button>
      <p className="mt-2 text-sm text-slate-400">{note}</p>
    </div>
  )

  return (
    <div className="mx-auto max-w-md px-4 pt-safe pb-28 pt-4 animate-fade-in">
      <div className="mb-4 flex items-center gap-2">
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="-ml-2 rounded-full p-2 text-slate-400 active:bg-slate-100"
          aria-label="Retour"
        >
          <ChevronLeftIcon className="h-5 w-5" />
        </button>
        <ScaleIcon className="h-5 w-5 text-accent" />
        <h1 className="text-lg font-bold text-slate-900">Poids &amp; mensurations</h1>
      </div>

      {/* Weight: chart first */}
      <div className="rounded-2xl border border-slate-200 bg-surface p-4 shadow-sm">
        <div className="mb-2 flex items-center justify-between gap-2">
          <p className="text-sm font-semibold text-slate-700">Poids</p>
          <div className="flex rounded-lg bg-slate-100 p-0.5 text-xs font-medium">
            {PERIODS.map((p) => (
              <button
                key={p.key}
                type="button"
                onClick={() => setPeriod(p.key)}
                aria-pressed={period === p.key}
                className={`min-h-9 rounded-md px-2.5 ${period === p.key ? 'bg-surface text-accent shadow-sm' : 'text-slate-500'}`}
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>

        {measurements === undefined ? null : weighings.length === 0 ? (
          <div className="py-6 text-center">
            <ScaleIcon className="mx-auto mb-2 h-8 w-8 text-slate-300" />
            <p className="font-medium text-slate-600">Aucune pesée pour l'instant</p>
            <p className="mt-0.5 text-sm text-slate-400">Ajoutez votre premier poids pour suivre son évolution.</p>
          </div>
        ) : weighings.length === 1 ? (
          singleValue(weighings[0], 'Une seule pesée : ajoutez-en une autre pour voir une courbe.')
        ) : inPeriod.length === 0 ? (
          <p className="py-8 text-center text-sm text-slate-400">Aucune pesée sur cette période.</p>
        ) : inPeriod.length === 1 ? (
          singleValue(inPeriod[0], 'Une seule pesée sur cette période.')
        ) : (
          <>
            <WeightChart
              byDate={byDate}
              start={start}
              end={today}
              onPick={(date) => setEditing({ entry: { date, weight: weightByDate.get(date)! } })}
            />
            <p className="mt-1 text-center text-[11px] text-slate-400">
              Courbe : moyenne sur 7 jours · points : pesées (touchez-en une pour la modifier)
            </p>
          </>
        )}

        <button
          type="button"
          onClick={() => setEditing({ entry: null })}
          className="mt-3 flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-brand-600 text-sm font-semibold text-white active:bg-brand-700"
        >
          <PlusIcon className="h-4 w-4" />
          Ajouter une pesée
        </button>
      </div>

      {weighings.length > 0 && (
        <>
          {/* Latest weigh-ins */}
          <div className="mt-5">
            <p className="mb-2 px-1 text-sm font-semibold text-slate-700">Dernières pesées</p>
            <div className="overflow-hidden rounded-2xl border border-slate-200 bg-surface shadow-sm">
              {(showAllWeighings ? weighings : weighings.slice(0, RECENT_WEIGHINGS)).map((w, i) => (
                <WeighingRow key={w.date} entry={w} bordered={i > 0} onOpen={() => setEditing({ entry: w })} />
              ))}
            </div>
            {weighings.length > RECENT_WEIGHINGS && !showAllWeighings && (
              <button
                type="button"
                onClick={() => setShowAllWeighings(true)}
                className="mt-2 w-full rounded-2xl bg-slate-100 py-3.5 text-sm font-semibold text-slate-700 active:bg-slate-200"
              >
                Voir plus ({weighings.length - RECENT_WEIGHINGS} pesée{weighings.length - RECENT_WEIGHINGS > 1 ? 's' : ''})
              </button>
            )}
          </div>

          {/* Weekly summary */}
          <div className="mt-5">
            <p className="mb-2 px-1 text-sm font-semibold text-slate-700">Par semaine</p>
            <div className="overflow-hidden rounded-2xl border border-slate-200 bg-surface shadow-sm">
              {(showAllWeeks ? weeks : weeks.slice(0, WEEKS_SHOWN)).map((week, i) => (
                <WeekRow
                  key={week.monday}
                  week={week}
                  bordered={i > 0}
                  goal={preferences?.goal ?? 'maintain'}
                  expanded={expandedWeek === week.monday}
                  weighings={weighings.filter((w) => w.date >= week.monday && w.date <= addDays(week.monday, 6))}
                  onToggle={() => setExpandedWeek((cur) => (cur === week.monday ? null : week.monday))}
                  onOpen={(w) => setEditing({ entry: w })}
                />
              ))}
            </div>
            {weeks.length > WEEKS_SHOWN && !showAllWeeks && (
              <button
                type="button"
                onClick={() => setShowAllWeeks(true)}
                className="mt-2 w-full rounded-2xl bg-slate-100 py-3.5 text-sm font-semibold text-slate-700 active:bg-slate-200"
              >
                Voir plus ({weeks.length - WEEKS_SHOWN} semaine{weeks.length - WEEKS_SHOWN > 1 ? 's' : ''})
              </button>
            )}
            <p className="mt-1.5 px-1 text-[11px] text-slate-400">
              Poids moyen de la semaine et écart avec la semaine précédente. Touchez une semaine pour voir ses pesées.
            </p>
          </div>
        </>
      )}

      <MeasurementsSection measurements={measurements} />

      {editing && (
        <WeightEditSheet
          key={editing.entry?.date ?? 'new'}
          entry={editing.entry}
          existing={weightByDate}
          onClose={() => setEditing(null)}
        />
      )}
    </div>
  )
}

function WeighingRow({ entry, bordered, onOpen }: { entry: Weighing; bordered: boolean; onOpen: () => void }) {
  return (
    <button
      type="button"
      onClick={onOpen}
      className={`flex min-h-12 w-full items-center justify-between px-4 text-left active:bg-slate-50 ${
        bordered ? 'border-t border-slate-100' : ''
      }`}
    >
      <span className="text-sm text-slate-600">
        <span className="font-medium text-slate-800">{relativeDateLabel(entry.date)}</span>
        {relativeDateLabel(entry.date) !== formatDateFr(entry.date) && (
          <span className="text-slate-400"> · {formatDateFr(entry.date, { withYear: false })}</span>
        )}
      </span>
      <span className="flex items-center gap-1.5">
        <span className="font-bold tabular-nums text-slate-900">{formatKg(entry.weight)} kg</span>
        <ChevronRightIcon className="h-4 w-4 text-slate-300" />
      </span>
    </button>
  )
}

/** Quiet colour: green when the week moved the way the goal wants, neutral otherwise — never alarming. */
function deltaTone(goal: WeightGoal, delta: number): 'good' | 'neutral' {
  if (goal === 'loss') return delta <= -0.05 ? 'good' : 'neutral'
  if (goal === 'gain') return delta >= 0.05 ? 'good' : 'neutral'
  return Math.abs(delta) <= 0.3 ? 'good' : 'neutral'
}

function WeekRow({
  week,
  bordered,
  goal,
  expanded,
  weighings,
  onToggle,
  onOpen,
}: {
  week: WeekSummary
  bordered: boolean
  goal: WeightGoal
  expanded: boolean
  weighings: Weighing[]
  onToggle: () => void
  onOpen: (w: Weighing) => void
}) {
  const delta = week.weightDelta
  const tone = delta != null ? deltaTone(goal, delta) : 'neutral'
  return (
    <div className={bordered ? 'border-t border-slate-100' : ''}>
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={expanded}
        className="flex min-h-12 w-full items-center justify-between gap-2 px-4 text-left active:bg-slate-50"
      >
        <span className="flex items-center gap-2 text-sm">
          <ChevronRightIcon
            className="h-4 w-4 shrink-0 text-slate-400"
            style={{ transform: expanded ? 'rotate(90deg)' : 'none', transition: 'transform 200ms ease' }}
          />
          <span className="text-slate-600">Sem. du {formatDateFr(week.monday, { withYear: false })}</span>
        </span>
        <span className="flex items-center gap-2">
          <span className="font-bold tabular-nums text-slate-900">{formatKg(week.weight!)} kg</span>
          <span
            className={`min-w-[4.25rem] rounded-full px-2 py-0.5 text-center text-xs font-semibold tabular-nums ${
              tone === 'good' ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-500'
            }`}
          >
            {delta != null ? `${formatSigned(delta)} kg` : '—'}
          </span>
        </span>
      </button>
      <div
        className="grid"
        style={{
          gridTemplateRows: expanded ? '1fr' : '0fr',
          transition: 'grid-template-rows 220ms cubic-bezier(0.22, 1, 0.36, 1)',
        }}
      >
        <div className="overflow-hidden bg-slate-50" inert={!expanded}>
          {weighings.map((w) => (
            <button
              key={w.date}
              type="button"
              onClick={() => onOpen(w)}
              className="flex min-h-11 w-full items-center justify-between pl-10 pr-4 text-left text-sm active:bg-slate-100"
            >
              <span className="text-slate-500">{formatDateFr(w.date, { withYear: false })}</span>
              <span className="font-semibold tabular-nums text-slate-800">{formatKg(w.weight)} kg</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}

/* ------------------------------ tape measurements ------------------------------ */

function MeasurementsSection({ measurements }: { measurements: BodyMeasurement[] | undefined }) {
  const [date, setDate] = useState(todayISO())
  const entry = useBodyMeasurementForDate(date)
  const [selected, setSelected] = useState<MeasureKey>('waist')
  const [deletingDate, setDeletingDate] = useState<string | null>(null)

  const points =
    measurements?.filter((m) => m[selected] != null).map((m) => ({ date: m.date, value: m[selected] as number })) ?? []
  const withMeasures = (measurements ?? []).filter((m) => MEASURES.some((k) => m[k.key] != null))
  const label = MEASURES.find((m) => m.key === selected)!

  return (
    <div className="mt-8">
      <h2 className="mb-3 px-1 text-base font-semibold text-slate-800">Mensurations</h2>

      <div className="mb-3 flex items-center justify-between">
        <button
          type="button"
          onClick={() => setDate((d) => addDays(d, -1))}
          className="rounded-full p-2.5 text-slate-400 active:bg-slate-100"
          aria-label="Jour précédent"
        >
          <ChevronLeftIcon className="h-5 w-5" />
        </button>
        <div className="text-center">
          <p className="font-semibold text-slate-900">{relativeDateLabel(date)}</p>
          {relativeDateLabel(date) !== formatDateFr(date) && <p className="text-xs text-slate-400">{formatDateFr(date)}</p>}
        </div>
        <button
          type="button"
          onClick={() => setDate((d) => addDays(d, 1))}
          className="rounded-full p-2.5 text-slate-400 active:bg-slate-100"
          aria-label="Jour suivant"
        >
          <ChevronRightIcon className="h-5 w-5" />
        </button>
      </div>

      <MeasurementForm key={date} date={date} entry={entry} />

      <div className="mt-4 rounded-2xl border border-slate-200 bg-surface p-4 shadow-sm">
        <div className="mb-3 flex flex-wrap gap-1.5">
          {MEASURES.map((m) => (
            <button
              key={m.key}
              type="button"
              onClick={() => setSelected(m.key)}
              className={`min-h-9 rounded-full px-3 text-xs font-semibold ${
                selected === m.key ? 'bg-brand-600 text-white' : 'bg-slate-100 text-slate-500 active:bg-slate-200'
              }`}
            >
              {m.label}
            </button>
          ))}
        </div>
        {points.length >= 2 ? (
          <ProgressChart points={points} unit={label.unit} />
        ) : (
          <p className="py-6 text-center text-sm text-slate-400">
            Ajoutez au moins 2 mesures de {label.label.toLowerCase()} pour voir un graphique.
          </p>
        )}
      </div>

      {withMeasures.length > 0 && (
        <div className="mt-4 space-y-2">
          <p className="px-1 text-sm font-semibold text-slate-700">Historique des mensurations</p>
          {[...withMeasures].reverse().map((m) => (
            <div
              key={m.id}
              className="flex items-center justify-between rounded-2xl border border-slate-200 bg-surface px-4 py-2 shadow-sm"
            >
              <div>
                <p className="text-sm font-semibold text-slate-900">{relativeDateLabel(m.date)}</p>
                <p className="text-xs text-slate-400">
                  {MEASURES.filter((k) => m[k.key] != null)
                    .map((k) => `${k.label} ${m[k.key]}${k.unit}`)
                    .join(' · ')}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setDeletingDate(m.date)}
                className="rounded-full p-3 text-slate-300 active:bg-slate-100 active:text-red-500"
                aria-label="Supprimer ces mensurations"
              >
                <TrashIcon className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>
      )}

      {deletingDate != null && (
        <ConfirmDialog
          title="Supprimer ces mensurations ?"
          message="Seules les mensurations de ce jour sont supprimées : le poids, les pas et les calories sont conservés."
          confirmLabel="Supprimer"
          danger
          onConfirm={() => {
            clearMeasurementFields(deletingDate)
            setDeletingDate(null)
          }}
          onCancel={() => setDeletingDate(null)}
        />
      )}
    </div>
  )
}

function MeasurementForm({ date, entry }: { date: string; entry: BodyMeasurement | undefined }) {
  const [values, setValues] = useState<Record<MeasureKey, string>>(() => toValues(entry))
  // What we believe is currently saved — used to tell an external change (a
  // deletion, an import) from the live query echoing back our own save,
  // which must not clobber a decimal still being typed ("82." -> "82").
  const lastKnownRef = useRef<Record<MeasureKey, string>>(toValues(entry))
  const timeouts = useRef<Partial<Record<MeasureKey, ReturnType<typeof setTimeout>>>>({})

  useEffect(() => {
    const incoming = toValues(entry)
    if (MEASURES.some((m) => incoming[m.key] !== lastKnownRef.current[m.key])) {
      lastKnownRef.current = incoming
      setValues(incoming)
    }
  }, [entry])

  useEffect(() => {
    const timeoutsAtMount = timeouts.current
    return () => {
      for (const t of Object.values(timeoutsAtMount)) clearTimeout(t)
    }
  }, [])

  function handleChange(key: MeasureKey, text: string) {
    setValues((v) => ({ ...v, [key]: text }))
    clearTimeout(timeouts.current[key])
    timeouts.current[key] = setTimeout(() => {
      const num = parseFloat(text.replace(',', '.'))
      const value = Number.isFinite(num) && num > 0 ? num : undefined
      upsertBodyMeasurement(date, { [key]: value })
      lastKnownRef.current = { ...lastKnownRef.current, [key]: value != null ? String(value) : '' }
    }, 400)
  }

  return (
    <div className="rounded-2xl border border-slate-200 bg-surface p-4 shadow-sm">
      <div className="grid grid-cols-2 gap-3">
        {MEASURES.map((m) => (
          <div key={m.key}>
            <label className="mb-1 block text-xs font-medium text-slate-500">
              {m.label} ({m.unit})
            </label>
            <input
              value={values[m.key]}
              onChange={(e) => handleChange(m.key, e.target.value)}
              onFocus={(e) => e.target.select()}
              inputMode="decimal"
              placeholder="—"
              className="w-full min-w-0 rounded-xl border border-slate-200 bg-slate-50 px-3 py-3 text-center text-sm font-semibold outline-none focus:border-brand-400"
            />
          </div>
        ))}
      </div>
    </div>
  )
}

function toValues(entry: BodyMeasurement | undefined): Record<MeasureKey, string> {
  return {
    chest: entry?.chest != null ? String(entry.chest) : '',
    waist: entry?.waist != null ? String(entry.waist) : '',
    hips: entry?.hips != null ? String(entry.hips) : '',
    arms: entry?.arms != null ? String(entry.arms) : '',
    thighs: entry?.thighs != null ? String(entry.thighs) : '',
  }
}
