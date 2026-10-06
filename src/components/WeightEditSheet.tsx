import { useState } from 'react'
import { useSnackbar } from '../contexts/SnackbarContext'
import { upsertBodyMeasurement } from '../lib/bodyActions'
import { formatDateFr, relativeDateLabel, todayISO } from '../lib/date'
import { formatKg, parseNumber, validValue } from '../lib/tracking'

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
  const [text, setText] = useState(entry ? String(entry.weight).replace('.', ',') : '')
  const [error, setError] = useState<string | null>(null)

  const replacing = !entry && existing.has(date)

  async function save() {
    const value = validValue('weight', parseNumber(text))
    if (value == null) {
      setError('Entrez un poids valide en kg (entre 20 et 400).')
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
    showSnackbar('Pesée supprimée', () => upsertBodyMeasurement(entry.date, { weight: previous }))
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 animate-fade-in-backdrop sm:items-center sm:p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-sm animate-slide-up rounded-t-2xl bg-surface p-5 pb-safe shadow-lg sm:rounded-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="mb-3 text-base font-semibold text-slate-900">{entry ? 'Modifier la pesée' : 'Ajouter une pesée'}</h2>

        {entry ? (
          <p className="mb-3 text-sm font-medium text-slate-500">
            {relativeDateLabel(entry.date)} · {formatDateFr(entry.date)}
          </p>
        ) : (
          <label className="mb-3 block">
            <span className="mb-1 block text-xs font-medium text-slate-500">Date</span>
            <input
              type="date"
              value={date}
              max={today}
              onChange={(e) => e.target.value && setDate(e.target.value > today ? today : e.target.value)}
              className="h-12 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 text-base outline-none focus:border-brand-400"
            />
          </label>
        )}

        <label className="block">
          <span className="mb-1 block text-xs font-medium text-slate-500">Poids (kg)</span>
          <input
            autoFocus
            value={text}
            inputMode="decimal"
            enterKeyHint="done"
            placeholder="78,4"
            onChange={(e) => {
              setText(e.target.value)
              setError(null)
            }}
            onFocus={(e) => e.target.select()}
            onKeyDown={(e) => e.key === 'Enter' && save()}
            aria-invalid={error ? true : undefined}
            className={`h-14 w-full rounded-xl border bg-slate-50 px-4 text-center text-2xl font-bold tabular-nums outline-none focus:border-brand-400 ${
              error ? 'border-red-400' : 'border-slate-200'
            }`}
          />
        </label>
        {error && <p className="mt-1.5 text-xs font-medium text-red-600">{error}</p>}
        {replacing && !error && (
          <p className="mt-1.5 text-xs text-slate-500">
            Une pesée existe déjà ce jour-là ({formatKg(existing.get(date)!)} kg) : elle sera remplacée.
          </p>
        )}

        <div className="mt-5 flex gap-2">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 rounded-xl bg-slate-100 py-3.5 font-medium text-slate-600 active:bg-slate-200"
          >
            Annuler
          </button>
          <button
            type="button"
            onClick={save}
            className="flex-1 rounded-xl bg-brand-600 py-3.5 font-medium text-white active:bg-brand-700"
          >
            Enregistrer
          </button>
        </div>
        {entry && (
          <button
            type="button"
            onClick={remove}
            className="mt-2 w-full py-3 text-sm font-medium text-red-500 active:text-red-700"
          >
            Supprimer cette pesée
          </button>
        )}
      </div>
    </div>
  )
}
