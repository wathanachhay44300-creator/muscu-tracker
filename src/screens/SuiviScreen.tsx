import { useEffect, useMemo, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useBodyMeasurementForDate, useBodyMeasurements } from '../hooks/useBodyMeasurements'
import { usePreferences } from '../hooks/usePreferences'
import { upsertBodyMeasurement } from '../lib/bodyActions'
import { ClipboardImport } from '../components/ClipboardImport'
import { TrackingChart } from '../components/TrackingChart'
import { ActivityIcon, ChevronLeftIcon, ChevronRightIcon } from '../components/Icons'
import { addDays, formatDateFr, relativeDateLabel, todayISO } from '../lib/date'
import {
  adviceFor,
  buildColumns,
  calorieTarget,
  computeTrend,
  estimateMaintenance,
  formatInt,
  formatKg,
  formatSigned,
  mapByDate,
  parseNumber,
  roundTo,
  stepsShift,
  targetRate,
  validValue,
  weeklySummaries,
  type MaintenanceEstimate,
  type StepsShift,
  type TrackedField,
} from '../lib/tracking'
import type { BodyMeasurement, WeightGoal } from '../types'

type Period = '14' | '30' | '90' | 'all'
const PERIODS: { key: Period; label: string }[] = [
  { key: '14', label: '2 sem.' },
  { key: '30', label: '1 mois' },
  { key: '90', label: '3 mois' },
  { key: 'all', label: 'Tout' },
]

const GOAL_LABEL: Record<WeightGoal, string> = { loss: 'Perte de poids', maintain: 'Maintien', gain: 'Prise de masse' }

export function SuiviScreen() {
  const navigate = useNavigate()
  const today = todayISO()
  const [date, setDate] = useState(today)
  const [period, setPeriod] = useState<Period>('30')
  const entry = useBodyMeasurementForDate(date)
  const measurements = useBodyMeasurements()
  const preferences = usePreferences()

  const byDate = useMemo(() => mapByDate(measurements ?? []), [measurements])
  const hasData = byDate.size > 0

  const start = useMemo(() => {
    if (period !== 'all') return addDays(today, -(Number(period) - 1))
    const first = [...byDate.values()].map((e) => e.date).sort()[0]
    const minStart = addDays(today, -13)
    return first && first < minStart ? first : minStart
  }, [period, byDate, today])

  const columns = useMemo(() => buildColumns(byDate, start, today), [byDate, start, today])
  const periodHasData = columns.some((c) => c.weight != null || c.steps != null || c.calories != null)
  const weeks = useMemo(() => weeklySummaries(byDate, start, today), [byDate, start, today])
  const trend = useMemo(() => computeTrend(byDate, today), [byDate, today])
  const estimate = useMemo(
    () => estimateMaintenance(byDate, today, trend.status === 'ok' ? trend.kgPerWeek : 0),
    [byDate, today, trend],
  )
  const shift = useMemo(() => stepsShift(byDate, today), [byDate, today])

  return (
    <div className="mx-auto max-w-md px-4 pt-safe pb-28 pt-4 animate-fade-in">
      <div className="mb-5 flex items-center gap-2">
        <button
          type="button"
          onClick={() => navigate('/historique')}
          className="-ml-2 rounded-full p-2 text-slate-400 active:bg-slate-100"
          aria-label="Retour"
        >
          <ChevronLeftIcon className="h-5 w-5" />
        </button>
        <ActivityIcon className="h-5 w-5 text-accent" />
        <h1 className="text-lg font-bold text-slate-900">Pas, poids &amp; calories</h1>
      </div>

      {/* Daily entry */}
      <div className="mb-3 flex items-center justify-between">
        <button
          type="button"
          onClick={() => setDate((d) => addDays(d, -1))}
          className="rounded-full p-2.5 text-slate-400 active:bg-slate-100"
          aria-label="Jour précédent"
        >
          <ChevronLeftIcon className="h-5 w-5" />
        </button>
        <label className="relative cursor-pointer rounded-xl px-3 py-1 text-center active:bg-slate-100">
          <span className="block font-semibold text-slate-900">{relativeDateLabel(date)}</span>
          <span className="block text-xs text-slate-400">
            {relativeDateLabel(date) !== formatDateFr(date) ? formatDateFr(date) : 'Changer de jour'}
          </span>
          <input
            type="date"
            value={date}
            max={today}
            onChange={(e) => e.target.value && setDate(e.target.value > today ? today : e.target.value)}
            aria-label="Choisir la date"
            className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
          />
        </label>
        <button
          type="button"
          onClick={() => setDate((d) => (d < today ? addDays(d, 1) : d))}
          disabled={date >= today}
          className="rounded-full p-2.5 text-slate-400 active:bg-slate-100 disabled:opacity-30"
          aria-label="Jour suivant"
        >
          <ChevronRightIcon className="h-5 w-5" />
        </button>
      </div>

      <DailyForm key={date} date={date} entry={entry} />

      <div className="mt-3">
        <ClipboardImport />
      </div>

      {/* Period + chart */}
      <div className="mt-6 rounded-2xl border border-slate-200 bg-surface p-4 shadow-sm">
        <div className="mb-3 flex items-center justify-between gap-2">
          <p className="text-sm font-semibold text-slate-700">Évolution</p>
          <div className="flex rounded-lg bg-slate-100 p-0.5 text-xs font-medium">
            {PERIODS.map((p) => (
              <button
                key={p.key}
                type="button"
                onClick={() => setPeriod(p.key)}
                aria-pressed={period === p.key}
                className={`rounded-md px-2.5 py-1.5 ${period === p.key ? 'bg-surface text-accent shadow-sm' : 'text-slate-500'}`}
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>
        {periodHasData ? (
          <TrackingChart key={`${period}-${columns.length}`} columns={columns} />
        ) : (
          <p className="py-8 text-center text-sm text-slate-400">
            {hasData
              ? 'Aucune donnée sur cette période.'
              : 'Saisissez votre poids, vos pas ou vos calories ci-dessus pour voir le graphique.'}
          </p>
        )}
        <p className="mt-2 text-center text-[11px] text-slate-400">
          Courbe rouge : poids lissé sur 7 jours · points gris : pesées du jour
        </p>
      </div>

      {/* Advice */}
      <div className="mt-4 rounded-2xl border border-slate-200 bg-surface p-4 shadow-sm">
        <div className="mb-2 flex items-center justify-between gap-2">
          <p className="text-sm font-semibold text-slate-700">Où j'en suis</p>
          <Link to="/reglages" className="text-xs font-semibold text-accent">
            {preferences ? GOAL_LABEL[preferences.goal] : '…'} · modifier
          </Link>
        </div>
        {trend.status === 'insufficient' ? (
          <div className="rounded-xl bg-slate-50 px-3.5 py-3">
            <p className="text-sm font-semibold text-slate-700">Pas encore assez de données</p>
            <p className="mt-0.5 text-xs text-slate-500">
              Il faut au moins {trend.needed} jours avec un poids saisi sur les 4 dernières semaines (
              {trend.days}/{trend.needed} pour l'instant), et autant avec des calories (
              {estimate.calorieDays}/{trend.needed}).
            </p>
          </div>
        ) : (
          preferences && (
            <AdviceBlock
              goal={preferences.goal}
              rate={preferences.goalRateKg}
              kgPerWeek={trend.kgPerWeek}
              estimate={estimate}
              shift={shift}
            />
          )
        )}
        <p className="mt-2.5 text-[11px] text-slate-400">
          Repères indicatifs basés sur vos saisies, pas un avis médical.
        </p>
      </div>

      {/* Weekly table */}
      {weeks.length > 0 && (
        <div className="mt-4 rounded-2xl border border-slate-200 bg-surface p-4 shadow-sm">
          <p className="mb-2 text-sm font-semibold text-slate-700">Par semaine</p>
          <table className="w-full text-right text-xs tabular-nums">
            <thead>
              <tr className="text-[11px] font-medium text-slate-400">
                <th className="pb-1.5 text-left font-medium">Semaine</th>
                <th className="pb-1.5 font-medium">Poids moy.</th>
                <th className="pb-1.5 font-medium">Pas/j</th>
                <th className="pb-1.5 font-medium">kcal/j</th>
                <th className="pb-1.5 font-medium">Δ poids</th>
              </tr>
            </thead>
            <tbody>
              {weeks.map((w) => (
                <tr key={w.monday} className="border-t border-slate-100 text-slate-800">
                  <td className="py-2 text-left text-slate-500">{formatDateFr(w.monday, { withYear: false })}</td>
                  <td className="py-2 font-semibold">{w.weight != null ? formatKg(w.weight) : '—'}</td>
                  <td className="py-2">{w.steps != null ? formatInt(w.steps) : '—'}</td>
                  <td className="py-2">{w.calories != null ? formatInt(w.calories) : '—'}</td>
                  <td className="py-2 font-semibold">{w.weightDelta != null ? formatSigned(w.weightDelta) : '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <p className="mt-2 text-[11px] text-slate-400">
            Moyennes sur les jours renseignés uniquement. Δ = poids moyen vs semaine précédente (kg).
          </p>
        </div>
      )}

      <div className="mt-4 space-y-2">
        <Link
          to="/reglages"
          className="flex items-center justify-between rounded-2xl border border-slate-200 bg-surface px-4 py-3 text-sm font-medium text-slate-700 shadow-sm active:bg-slate-50"
        >
          Importer mes pas automatiquement (Raccourci iOS)
          <ChevronRightIcon className="h-4 w-4 text-slate-300" />
        </Link>
        <Link
          to="/donnees"
          className="flex items-center justify-between rounded-2xl border border-slate-200 bg-surface px-4 py-3 text-sm font-medium text-slate-700 shadow-sm active:bg-slate-50"
        >
          Importer un fichier (CSV, Apple Santé)
          <ChevronRightIcon className="h-4 w-4 text-slate-300" />
        </Link>
      </div>
    </div>
  )
}

function AdviceBlock({
  goal,
  rate,
  kgPerWeek,
  estimate,
  shift,
}: {
  goal: WeightGoal
  rate: number
  kgPerWeek: number
  estimate: MaintenanceEstimate
  shift: StepsShift | null
}) {
  const facts = (
    <p className="mt-2 text-xs text-slate-500">
      Tendance : <span className="font-semibold">{formatSigned(kgPerWeek, 2)} kg/sem</span> · Objectif :{' '}
      <span className="font-semibold">{formatSigned(targetRate(goal, rate), 2)} kg/sem</span>
    </p>
  )

  // Weight alone isn't enough to coach on calories: say so rather than guess.
  if (estimate.status === 'insufficient') {
    return (
      <div className="rounded-xl bg-slate-50 px-3.5 py-3">
        <p className="text-sm font-semibold text-slate-700">Pas encore assez de données</p>
        <p className="mt-0.5 text-xs text-slate-500">
          Trop de jours sans calories : {estimate.calorieDays}/{estimate.needed} jours renseignés sur les 4 dernières
          semaines. Saisissez-les pour obtenir un conseil et une estimation.
        </p>
        {facts}
      </div>
    )
  }

  const advice = adviceFor(goal, rate, kgPerWeek)
  const ok = advice.tone === 'ok'
  const color = ok ? 'text-emerald-700' : 'text-amber-700'
  const goalVerb =
    goal === 'loss'
      ? `Pour perdre ${formatKg(Math.abs(rate))} kg/semaine`
      : goal === 'gain'
        ? `Pour prendre ${formatKg(Math.abs(rate))} kg/semaine`
        : 'Pour maintenir ton poids'

  return (
    <div className={`rounded-xl px-3.5 py-3 ${ok ? 'bg-emerald-50' : 'bg-amber-50'}`}>
      <p className={`text-sm font-semibold ${color}`}>{advice.title}</p>
      {shift && !ok && (
        <p className="mt-1 text-sm text-amber-700">
          Tes pas ont {shift.change < 0 ? 'baissé' : 'augmenté'} de {Math.round(Math.abs(shift.change) * 100)} % cette
          semaine ({formatInt(shift.recent)} contre {formatInt(shift.previous)} par jour) : cela peut expliquer
          l'évolution, avant de toucher aux calories.
        </p>
      )}
      <p className={`mt-1 text-sm ${color}`}>{advice.text}</p>
      {facts}
      {estimate.status === 'ok' ? (
        <>
          <p className="mt-1 text-xs text-slate-500">
            Entretien estimé : environ{' '}
            <span className="font-semibold">{formatInt(roundTo(estimate.maintenance, 10))} kcal/jour</span>{' '}
            (estimation approximative, sur {estimate.windowDays} jours dont {estimate.calorieDays} avec calories).
          </p>
          <p className="mt-1 text-xs font-medium text-slate-700">
            {goalVerb}, vise environ{' '}
            <span className="font-bold">
              {formatInt(roundTo(calorieTarget(estimate.maintenance, goal, rate), 10))} kcal/jour
            </span>
            .
          </p>
        </>
      ) : (
        <p className="mt-1 text-xs text-slate-500">
          Estimation de l'entretien non affichée : les calories saisies semblent incomplètes.
        </p>
      )}
    </div>
  )
}

const FIELDS: { key: TrackedField; label: string; unit: string; mode: 'decimal' | 'numeric'; placeholder: string }[] = [
  { key: 'weight', label: 'Poids', unit: 'kg', mode: 'decimal', placeholder: '78,4' },
  { key: 'steps', label: 'Pas', unit: 'pas', mode: 'numeric', placeholder: '8 500' },
  { key: 'calories', label: 'Calories', unit: 'kcal', mode: 'numeric', placeholder: '2 400' },
]

type Texts = Record<TrackedField, string>

function toTexts(entry: BodyMeasurement | undefined): Texts {
  return {
    weight: entry?.weight != null ? String(entry.weight) : '',
    steps: entry?.steps != null ? String(entry.steps) : '',
    calories: entry?.calories != null ? String(entry.calories) : '',
  }
}

/** The three daily fields: numeric keypad, saved automatically, none required. */
function DailyForm({ date, entry }: { date: string; entry: BodyMeasurement | undefined }) {
  const [texts, setTexts] = useState<Texts>(() => toTexts(entry))
  const [invalid, setInvalid] = useState<Partial<Record<TrackedField, boolean>>>({})
  // Canonical value last written by this form: an echo of our own save must
  // not overwrite what's still being typed ("78," -> "78"), but an outside
  // change (an import, a deletion) must show up.
  const lastKnown = useRef<Texts>(toTexts(entry))
  const timeouts = useRef<Partial<Record<TrackedField, ReturnType<typeof setTimeout>>>>({})

  useEffect(() => {
    const incoming = toTexts(entry)
    if (FIELDS.some((f) => incoming[f.key] !== lastKnown.current[f.key])) {
      lastKnown.current = incoming
      setTexts(incoming)
      setInvalid({})
    }
  }, [entry])

  useEffect(() => {
    const pending = timeouts.current
    return () => {
      for (const t of Object.values(pending)) clearTimeout(t)
    }
  }, [])

  function handleChange(key: TrackedField, text: string) {
    setTexts((t) => ({ ...t, [key]: text }))
    clearTimeout(timeouts.current[key])
    timeouts.current[key] = setTimeout(() => {
      if (text.trim() === '') {
        setInvalid((v) => ({ ...v, [key]: false }))
        lastKnown.current = { ...lastKnown.current, [key]: '' }
        upsertBodyMeasurement(date, { [key]: undefined })
        return
      }
      const value = validValue(key, parseNumber(text))
      setInvalid((v) => ({ ...v, [key]: value == null }))
      if (value == null) return
      lastKnown.current = { ...lastKnown.current, [key]: String(value) }
      upsertBodyMeasurement(date, { [key]: value })
    }, 400)
  }

  return (
    <div className="rounded-2xl border border-slate-200 bg-surface p-4 shadow-sm">
      <div className="grid grid-cols-3 gap-3">
        {FIELDS.map((f) => (
          <div key={f.key}>
            <label htmlFor={`suivi-${f.key}`} className="mb-1 block text-xs font-medium text-slate-500">
              {f.label} <span className="text-slate-400">({f.unit})</span>
            </label>
            <input
              id={`suivi-${f.key}`}
              value={texts[f.key]}
              onChange={(e) => handleChange(f.key, e.target.value)}
              onFocus={(e) => e.target.select()}
              inputMode={f.mode}
              enterKeyHint="done"
              autoComplete="off"
              placeholder={f.placeholder}
              aria-invalid={invalid[f.key] || undefined}
              className={`w-full min-w-0 rounded-xl border bg-slate-50 px-2 py-3.5 text-center text-lg font-bold tabular-nums outline-none placeholder:font-normal placeholder:text-slate-300 focus:border-brand-400 ${
                invalid[f.key] ? 'border-red-400' : 'border-slate-200'
              }`}
            />
          </div>
        ))}
      </div>
      <p className="mt-2.5 text-center text-[11px] text-slate-400">
        {Object.values(invalid).some(Boolean)
          ? 'Valeur hors limites : elle n’est pas enregistrée.'
          : 'Enregistré automatiquement · aucun champ obligatoire'}
      </p>
    </div>
  )
}

