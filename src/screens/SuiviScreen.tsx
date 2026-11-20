import { useEffect, useMemo, useRef, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useBodyMeasurementForDate, useBodyMeasurements } from '../hooks/useBodyMeasurements'
import { usePreferences } from '../hooks/usePreferences'
import { upsertBodyMeasurement } from '../lib/bodyActions'
import { ClipboardImport } from '../components/ClipboardImport'
import { TrackingChart } from '../components/TrackingChart'
import { ActivityIcon, ChevronLeftIcon, ChevronRightIcon } from '../components/Icons'
import { formatNumber, t, tDynamic } from '../i18n'
import { addDays, formatDateShort, relativeDateLabel, todayISO } from '../lib/date'
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
const PERIODS: { key: Period }[] = [{ key: '14' }, { key: '30' }, { key: '90' }, { key: 'all' }]

const goalLabel = (goal: WeightGoal) => tDynamic(`goal.${goal}`)

export function SuiviScreen() {
  const navigate = useNavigate()
  const location = useLocation()
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
          onClick={() => (location.key !== 'default' ? navigate(-1) : navigate('/progres'))}
          className="-ml-2 rounded-full p-2 text-muted active:bg-surface-3"
          aria-label={t('common.back')}
        >
          <ChevronLeftIcon className="h-5 w-5" />
        </button>
        <ActivityIcon className="h-5 w-5 text-accent-ink" />
        <h1 className="text-lg font-bold text-ink">{t('screens.tracking')}</h1>
      </div>

      {/* Daily entry */}
      <div className="mb-3 flex items-center justify-between">
        <button
          type="button"
          onClick={() => setDate((d) => addDays(d, -1))}
          className="rounded-full p-2.5 text-muted active:bg-surface-3"
          aria-label={t('common.previousDay')}
        >
          <ChevronLeftIcon className="h-5 w-5" />
        </button>
        <label className="relative cursor-pointer rounded-xl px-3 py-1 text-center active:bg-surface-3">
          <span className="block font-semibold text-ink">{relativeDateLabel(date)}</span>
          <span className="block text-xs text-muted">
            {relativeDateLabel(date) !== formatDateShort(date) ? formatDateShort(date) : t('tracking.changeDay')}
          </span>
          <input
            type="date"
            value={date}
            max={today}
            onChange={(e) => e.target.value && setDate(e.target.value > today ? today : e.target.value)}
            aria-label={t('common.chooseDate')}
            className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
          />
        </label>
        <button
          type="button"
          onClick={() => setDate((d) => (d < today ? addDays(d, 1) : d))}
          disabled={date >= today}
          className="rounded-full p-2.5 text-muted active:bg-surface-3 disabled:opacity-30"
          aria-label={t('common.nextDay')}
        >
          <ChevronRightIcon className="h-5 w-5" />
        </button>
      </div>

      <DailyForm key={date} date={date} entry={entry} />

      <div className="mt-3">
        <ClipboardImport />
      </div>

      {/* Period + chart */}
      <div className="mt-6 rounded-2xl border border-line bg-surface p-4 shadow-sm">
        <div className="mb-3 flex items-center justify-between gap-2">
          <p className="text-sm font-semibold text-ink-2">{t('tracking.evolution')}</p>
          <div className="flex rounded-lg bg-surface-3 p-0.5 text-xs font-medium">
            {PERIODS.map((p) => (
              <button
                key={p.key}
                type="button"
                onClick={() => setPeriod(p.key)}
                aria-pressed={period === p.key}
                className={`rounded-md px-2.5 py-1.5 ${period === p.key ? 'bg-surface text-accent-ink shadow-sm' : 'text-muted'}`}
              >
                {tDynamic(`period.${p.key}`)}
              </button>
            ))}
          </div>
        </div>
        {periodHasData ? (
          <TrackingChart key={`${period}-${columns.length}`} columns={columns} />
        ) : (
          <p className="py-8 text-center text-sm text-muted">
            {hasData
              ? t('tracking.noDataPeriod')
              : t('tracking.enterData')}
          </p>
        )}
        <p className="mt-2 text-center text-[11px] text-muted">
          {t('tracking.legend')}
        </p>
      </div>

      {/* Advice */}
      <div className="mt-4 rounded-2xl border border-line bg-surface p-4 shadow-sm">
        <div className="mb-2 flex items-center justify-between gap-2">
          <p className="text-sm font-semibold text-ink-2">{t('tracking.whereIAm')}</p>
          <Link to="/reglages" className="text-xs font-semibold text-accent-ink">
            {preferences ? goalLabel(preferences.goal) : '…'} · {t('tracking.edit')}
          </Link>
        </div>
        {trend.status === 'insufficient' ? (
          <div className="rounded-xl bg-surface-2 px-3.5 py-3">
            <p className="text-sm font-semibold text-ink-2">{t('tracking.notEnough')}</p>
            <p className="mt-0.5 text-xs text-muted">
              {t('tracking.needDays', { needed: trend.needed, days: trend.days, cal: estimate.calorieDays })}
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
        <p className="mt-2.5 text-[11px] text-muted">
          {t('tracking.disclaimer')}
        </p>
      </div>

      {/* Weekly table */}
      {weeks.length > 0 && (
        <div className="mt-4 rounded-2xl border border-line bg-surface p-4 shadow-sm">
          <p className="mb-2 text-sm font-semibold text-ink-2">{t('tracking.byWeek')}</p>
          <table className="w-full text-right text-xs tabular-nums">
            <thead>
              <tr className="text-[11px] font-medium text-muted">
                <th className="pb-1.5 text-left font-medium">{t('tracking.week')}</th>
                <th className="pb-1.5 font-medium">{t('tracking.avgWeight')}</th>
                <th className="pb-1.5 font-medium">{t('tracking.stepsDay')}</th>
                <th className="pb-1.5 font-medium">{t('tracking.kcalDay')}</th>
                <th className="pb-1.5 font-medium">{t('tracking.deltaWeight')}</th>
              </tr>
            </thead>
            <tbody>
              {weeks.map((w) => (
                <tr key={w.monday} className="border-t border-line text-ink">
                  <td className="py-2 text-left text-muted">{formatDateShort(w.monday, { withYear: false })}</td>
                  <td className="py-2 font-semibold">{w.weight != null ? formatKg(w.weight) : '—'}</td>
                  <td className="py-2">{w.steps != null ? formatInt(w.steps) : '—'}</td>
                  <td className="py-2">{w.calories != null ? formatInt(w.calories) : '—'}</td>
                  <td className="py-2 font-semibold">{w.weightDelta != null ? formatSigned(w.weightDelta) : '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <p className="mt-2 text-[11px] text-muted">
            {t('tracking.tableNote')}
          </p>
        </div>
      )}

      <div className="mt-4 space-y-2">
        <Link
          to="/reglages"
          className="flex items-center justify-between rounded-2xl border border-line bg-surface px-4 py-3 text-sm font-medium text-ink-2 shadow-sm active:bg-surface-2"
        >
          {t('tracking.shortcutLink')}
          <ChevronRightIcon className="h-4 w-4 text-faint" />
        </Link>
        <Link
          to="/donnees"
          className="flex items-center justify-between rounded-2xl border border-line bg-surface px-4 py-3 text-sm font-medium text-ink-2 shadow-sm active:bg-surface-2"
        >
          {t('tracking.fileLink')}
          <ChevronRightIcon className="h-4 w-4 text-faint" />
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
    <p className="mt-2 text-xs text-muted">
      {t('tracking.trend', {
        trend: t('tracking.kgPerWeekShort', { v: formatSigned(kgPerWeek, 2) }),
        goal: t('tracking.kgPerWeekShort', { v: formatSigned(targetRate(goal, rate), 2) }),
      })}
    </p>
  )

  // Weight alone isn't enough to coach on calories: say so rather than guess.
  if (estimate.status === 'insufficient') {
    return (
      <div className="rounded-xl bg-surface-2 px-3.5 py-3">
        <p className="text-sm font-semibold text-ink-2">{t('tracking.notEnough')}</p>
        <p className="mt-0.5 text-xs text-muted">
          {t('tracking.tooFewCalories', { days: estimate.calorieDays, needed: estimate.needed })}
        </p>
        {facts}
      </div>
    )
  }

  const advice = adviceFor(goal, rate, kgPerWeek)
  const ok = advice.tone === 'ok'
  const color = ok ? 'text-good-ink' : 'text-highlight-ink'
  const goalVerb =
    goal === 'loss'
      ? t('tracking.toLose', { v: formatKg(Math.abs(rate)) })
      : goal === 'gain'
        ? t('tracking.toGain', { v: formatKg(Math.abs(rate)) })
        : t('tracking.toMaintain')

  return (
    <div className={`rounded-xl px-3.5 py-3 ${ok ? 'bg-good-soft' : 'bg-highlight-soft'}`}>
      <p className={`text-sm font-semibold ${color}`}>{advice.title}</p>
      {shift && !ok && (
        <p className="mt-1 text-sm text-highlight-ink">
          {t('tracking.stepsShift', {
            dir: shift.change < 0 ? t('tracking.down') : t('tracking.up'),
            pct: Math.round(Math.abs(shift.change) * 100),
            recent: formatInt(shift.recent),
            previous: formatInt(shift.previous),
          })}
        </p>
      )}
      <p className={`mt-1 text-sm ${color}`}>{advice.text}</p>
      {facts}
      {estimate.status === 'ok' ? (
        <>
          <p className="mt-1 text-xs text-muted">
            {t('tracking.maintenance', {
              kcal: formatInt(roundTo(estimate.maintenance, 10)),
              window: estimate.windowDays,
              cal: estimate.calorieDays,
            })}
          </p>
          <p className="mt-1 text-xs font-medium text-ink-2">
            {t('tracking.aim', { goal: goalVerb, kcal: formatInt(roundTo(calorieTarget(estimate.maintenance, goal, rate), 10)) })}
          </p>
        </>
      ) : (
        <p className="mt-1 text-xs text-muted">
          {t('tracking.noMaintenance')}
        </p>
      )}
    </div>
  )
}

const FIELDS: { key: TrackedField; mode: 'decimal' | 'numeric'; example: number }[] = [
  { key: 'weight', mode: 'decimal', example: 78.4 },
  { key: 'steps', mode: 'numeric', example: 8500 },
  { key: 'calories', mode: 'numeric', example: 2400 },
]
const fieldUnit = (key: TrackedField) => (key === 'weight' ? 'kg' : key === 'steps' ? t('trackField.stepsUnit') : 'kcal')

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
    <div className="rounded-2xl border border-line bg-surface p-4 shadow-sm">
      <div className="grid grid-cols-3 gap-3">
        {FIELDS.map((f) => (
          <div key={f.key}>
            <label htmlFor={`suivi-${f.key}`} className="mb-1 block text-xs font-medium text-muted">
              {tDynamic(`trackField.${f.key}`)} <span className="text-muted">({fieldUnit(f.key)})</span>
            </label>
            <input
              id={`suivi-${f.key}`}
              value={texts[f.key]}
              onChange={(e) => handleChange(f.key, e.target.value)}
              onFocus={(e) => e.target.select()}
              inputMode={f.mode}
              enterKeyHint="done"
              autoComplete="off"
              placeholder={formatNumber(f.example, 1)}
              aria-invalid={invalid[f.key] || undefined}
              className={`w-full min-w-0 rounded-xl border bg-surface-2 px-2 py-3.5 text-center text-lg font-bold font-numbers tabular-nums outline-none placeholder:font-normal placeholder:text-faint focus:border-accent-line ${
                invalid[f.key] ? 'border-danger' : 'border-line'
              }`}
            />
          </div>
        ))}
      </div>
      <p className="mt-2.5 text-center text-[11px] text-muted">
        {Object.values(invalid).some(Boolean)
          ? t('tracking.outOfRange')
          : t('tracking.autoSaved')}
      </p>
    </div>
  )
}

