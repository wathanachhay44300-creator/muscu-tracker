import { useState } from 'react'
import { useSnackbar } from '../contexts/SnackbarContext'
import { upsertBodyMeasurement } from '../lib/bodyActions'
import { formatDateShort, relativeDateLabel, todayISO } from '../lib/date'
import { formatKg, parseNumber, validValue } from '../lib/tracking'
import { formatDecimal, t } from '../i18n'

interface WeightEditSheetProps {
  /** Existing weigh-in to edit/delete, or null to add a new one. */
  entry: { date: string; weight: number } | null
  /** Date a new weigh-in starts on, and the weights already recorded (to warn about replacing). */
  existing: Map<string, number>
  onClose: () => void
}

/** Small sheet to add, correct or delete one weigh-in without leaving the screen. */
export function WeightEditSheet({ entry, existing, onClose }: WeightEditSheetProps) {
  const { showSnackbar } = useSnackbar()
  const today = todayISO()
  const [date, setDate] = useState(entry?.date ?? today)
  const [text, setText] = useState(entry ? formatDecimal(entry.weight) : '')
  const [error, setError] = useState<string | null>(null)

  const replacing = !entry && existing.has(date)

  async function save() {
    const value = validValue('weight', parseNumber(text))
    if (value == null) {
      setError(t('weighIn.invalid'))
      return
    }
    await upsertBodyMeasurement(date, { weight: value })
    onClose()
  }

  async function remove() {
    if (!entry) return
    const previous = entry.weight
    await upsertBodyMeasurement(entry.date, { weight: undefined })
    onClose()
    showSnackbar(t('weighIn.deleted'), () => upsertBodyMeasurement(entry.date, { weight: previous }))
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-scrim/40 animate-fade-in-backdrop sm:items-center sm:p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-sm animate-slide-up rounded-t-2xl bg-surface p-5 pb-safe shadow-lg sm:rounded-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="mb-3 text-base font-semibold text-ink">{entry ? t('weighIn.edit') : t('weighIn.add')}</h2>

        {entry ? (
          <p className="mb-3 text-sm font-medium text-muted">
            {relativeDateLabel(entry.date)} · {formatDateShort(entry.date)}
          </p>
        ) : (
          <label className="mb-3 block">
            <span className="mb-1 block text-xs font-medium text-muted">{t('weighIn.date')}</span>
            <input
              type="date"
              value={date}
              max={today}
              onChange={(e) => e.target.value && setDate(e.target.value > today ? today : e.target.value)}
              className="h-12 w-full rounded-xl border border-line bg-surface-2 px-4 text-base outline-none focus:border-accent-line"
            />
          </label>
        )}

        <label className="block">
          <span className="mb-1 block text-xs font-medium text-muted">{t('weighIn.weightKg')}</span>
          <input
            autoFocus
            value={text}
            inputMode="decimal"
            enterKeyHint="done"
            placeholder={formatDecimal(78.4)}
            onChange={(e) => {
              setText(e.target.value)
              setError(null)
            }}
            onFocus={(e) => e.target.select()}
            onKeyDown={(e) => e.key === 'Enter' && save()}
            aria-invalid={error ? true : undefined}
            className={`h-14 w-full rounded-xl border bg-surface-2 px-4 text-center text-2xl font-bold font-numbers tabular-nums outline-none focus:border-accent-line ${
              error ? 'border-danger' : 'border-line'
            }`}
          />
        </label>
        {error && <p className="mt-1.5 text-xs font-medium text-danger-ink">{error}</p>}
        {replacing && !error && (
          <p className="mt-1.5 text-xs text-muted">
            {t('weighIn.replacing', { v: formatKg(existing.get(date)!) })}
          </p>
        )}

        <div className="mt-5 flex gap-2">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 rounded-xl bg-surface-3 py-3.5 font-medium text-ink-2 active:bg-surface-4"
          >
            {t('common.cancel')}
          </button>
          <button
            type="button"
            onClick={save}
            className="flex-1 rounded-xl bg-accent py-3.5 font-medium text-on-accent active:bg-accent-hover"
          >
            {t('common.save')}
          </button>
        </div>
        {entry && (
          <button
            type="button"
            onClick={remove}
            className="mt-2 w-full py-3 text-sm font-medium text-danger-ink active:text-danger-ink"
          >
            {t('weighIn.delete')}
          </button>
        )}
      </div>
    </div>
  )
}
