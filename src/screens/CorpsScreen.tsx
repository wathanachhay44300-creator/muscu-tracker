import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useBodyMeasurementForDate, useBodyMeasurements } from '../hooks/useBodyMeasurements'
import { deleteBodyMeasurement, upsertBodyMeasurement } from '../lib/bodyActions'
import { ProgressChart } from '../components/ProgressChart'
import { ConfirmDialog } from '../components/ConfirmDialog'
import { ChevronLeftIcon, ChevronRightIcon, ScaleIcon, TrashIcon } from '../components/Icons'
import { addDays, formatDateFr, relativeDateLabel, todayISO } from '../lib/date'
import type { BodyMeasurement } from '../types'

const METRICS = [
  { key: 'weight', label: 'Poids', unit: 'kg' },
  { key: 'chest', label: 'Poitrine', unit: 'cm' },
  { key: 'waist', label: 'Taille', unit: 'cm' },
  { key: 'hips', label: 'Hanches', unit: 'cm' },
  { key: 'arms', label: 'Bras', unit: 'cm' },
  { key: 'thighs', label: 'Cuisses', unit: 'cm' },
] as const

type MetricKey = (typeof METRICS)[number]['key']

export function CorpsScreen() {
  const navigate = useNavigate()
  const [date, setDate] = useState(todayISO())
  const entry = useBodyMeasurementForDate(date)
  const history = useBodyMeasurements()
  const [selectedMetric, setSelectedMetric] = useState<MetricKey>('weight')
  const [deletingId, setDeletingId] = useState<number | null>(null)

  const points =
    history
      ?.filter((m) => m[selectedMetric] != null)
      .map((m) => ({ date: m.date, value: m[selectedMetric] as number })) ?? []
  const selectedUnit = METRICS.find((m) => m.key === selectedMetric)!.unit

  return (
    <div className="mx-auto max-w-md px-4 pt-safe pb-28 pt-4 animate-fade-in">
      <div className="mb-5 flex items-center gap-2">
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="rounded-full p-2 -ml-2 text-slate-400 active:bg-slate-100"
          aria-label="Retour"
        >
          <ChevronLeftIcon className="h-5 w-5" />
        </button>
        <ScaleIcon className="h-5 w-5 text-accent" />
        <h1 className="text-lg font-bold text-slate-900">Poids &amp; mensurations</h1>
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
          <p className="font-semibold text-slate-900">{relativeDateLabel(date)}</p>
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

      <MeasurementForm key={date} date={date} entry={entry} />

      <div className="mt-6 rounded-2xl border border-slate-200 bg-surface p-4 shadow-sm">
        <div className="mb-3 flex flex-wrap gap-1.5">
          {METRICS.map((m) => (
            <button
              key={m.key}
              type="button"
              onClick={() => setSelectedMetric(m.key)}
              className={`rounded-full px-3 py-1.5 text-xs font-semibold ${
                selectedMetric === m.key
                  ? 'bg-brand-600 text-white'
                  : 'bg-slate-100 text-slate-500 active:bg-slate-200'
              }`}
            >
              {m.label}
            </button>
          ))}
        </div>
        {points.length >= 2 ? (
          <ProgressChart points={points} unit={selectedUnit} />
        ) : (
          <p className="py-6 text-center text-sm text-slate-400">
            Ajoutez au moins 2 mesures de {METRICS.find((m) => m.key === selectedMetric)!.label.toLowerCase()} pour
            voir un graphique.
          </p>
        )}
      </div>

      {history && history.length > 0 && (
        <div className="mt-6 space-y-2">
          <p className="text-sm font-semibold text-slate-700">Historique</p>
          {[...history].reverse().map((m) => (
            <div
              key={m.id}
              className="flex items-center justify-between rounded-2xl border border-slate-200 bg-surface px-4 py-3 shadow-sm"
            >
              <div>
                <p className="text-sm font-semibold text-slate-900">{relativeDateLabel(m.date)}</p>
                <p className="text-xs text-slate-400">
                  {METRICS.filter((metric) => m[metric.key] != null)
                    .map((metric) => `${metric.label} ${m[metric.key]}${metric.unit}`)
                    .join(' · ')}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setDeletingId(m.id!)}
                className="rounded-full p-2 text-slate-300 active:bg-slate-100 active:text-red-500"
                aria-label="Supprimer cette entrée"
              >
                <TrashIcon className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>
      )}

      {deletingId != null && (
        <ConfirmDialog
          title="Supprimer cette entrée ?"
          message="Cette mesure sera définitivement supprimée."
          confirmLabel="Supprimer"
          danger
          onConfirm={() => {
            deleteBodyMeasurement(deletingId)
            setDeletingId(null)
          }}
          onCancel={() => setDeletingId(null)}
        />
      )}
    </div>
  )
}

function MeasurementForm({ date, entry }: { date: string; entry: BodyMeasurement | undefined }) {
  const [values, setValues] = useState<Record<MetricKey, string>>(() => toValues(entry))
  // What we believe is currently saved in the DB — used to tell an external
  // change (a deletion, an import) apart from the live query simply echoing
  // back the value we just saved ourselves, which we must NOT re-apply or
  // it can clobber a decimal still being typed (e.g. "82." -> "82").
  const lastKnownRef = useRef<Record<MetricKey, string>>(toValues(entry))
  const timeouts = useRef<Partial<Record<MetricKey, ReturnType<typeof setTimeout>>>>({})

  useEffect(() => {
    const incoming = toValues(entry)
    if (METRICS.some((m) => incoming[m.key] !== lastKnownRef.current[m.key])) {
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

  function handleChange(key: MetricKey, text: string) {
    setValues((v) => ({ ...v, [key]: text }))
    clearTimeout(timeouts.current[key])
    timeouts.current[key] = setTimeout(() => {
      const num = parseFloat(text.replace(',', '.'))
      upsertBodyMeasurement(date, { [key]: Number.isFinite(num) ? num : undefined })
      lastKnownRef.current = { ...lastKnownRef.current, [key]: text }
    }, 400)
  }

  return (
    <div className="rounded-2xl border border-slate-200 bg-surface p-4 shadow-sm">
      <div className="grid grid-cols-2 gap-3">
        {METRICS.map((m) => (
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
              className="w-full min-w-0 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-center text-sm font-semibold outline-none focus:border-brand-400"
            />
          </div>
        ))}
      </div>
    </div>
  )
}

function toValues(entry: BodyMeasurement | undefined): Record<MetricKey, string> {
  return {
    weight: entry?.weight != null ? String(entry.weight) : '',
    chest: entry?.chest != null ? String(entry.chest) : '',
    waist: entry?.waist != null ? String(entry.waist) : '',
    hips: entry?.hips != null ? String(entry.hips) : '',
    arms: entry?.arms != null ? String(entry.arms) : '',
    thighs: entry?.thighs != null ? String(entry.thighs) : '',
  }
}
