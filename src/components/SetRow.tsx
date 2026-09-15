import { useEffect, useState } from 'react'
import type { SetEntry } from '../types'
import { StarIcon, TrashIcon } from './Icons'

interface SetRowProps {
  set: SetEntry
  index: number
  /** True when this set ties or holds the all-time PR (weight or volume) for its exercise. */
  isPR?: boolean
  onChangeWeight: (weight: number) => void
  onChangeReps: (reps: number) => void
  onRemove: () => void
}

export function SetRow({ set, index, isPR, onChangeWeight, onChangeReps, onRemove }: SetRowProps) {
  // Local state is the source of truth while this row is being edited. It's
  // only re-synced from props when a *different* set is mounted into this row
  // (new set.id) — not on every set.weight/reps change — otherwise rapid
  // taps on the steppers would race against the async DB write + live-query
  // round trip and silently drop increments.
  const [weight, setWeight] = useState(set.weight)
  const [reps, setReps] = useState(set.reps)
  const [weightText, setWeightText] = useState(trimZero(set.weight))
  const [repsText, setRepsText] = useState(String(set.reps))

  useEffect(() => {
    setWeight(set.weight)
    setReps(set.reps)
    setWeightText(trimZero(set.weight))
    setRepsText(String(set.reps))
    // Only re-sync when a new set is mounted into this row, not on every edit.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [set.id])

  function commitWeight(raw: string) {
    const n = parseFloat(raw.replace(',', '.'))
    const value = Number.isFinite(n) && n >= 0 ? n : 0
    setWeight(value)
    setWeightText(trimZero(value))
    onChangeWeight(value)
  }

  function commitReps(raw: string) {
    const n = parseInt(raw, 10)
    const value = Number.isFinite(n) && n >= 0 ? n : 0
    setReps(value)
    setRepsText(String(value))
    onChangeReps(value)
  }

  function stepWeight(delta: number) {
    const n = Math.max(0, round2(weight + delta))
    setWeight(n)
    setWeightText(trimZero(n))
    onChangeWeight(n)
  }

  function stepReps(delta: number) {
    const n = Math.max(0, reps + delta)
    setReps(n)
    setRepsText(String(n))
    onChangeReps(n)
  }

  return (
    <div className="flex flex-wrap items-center gap-1">
      <span
        className={`flex h-6 w-5 shrink-0 items-center justify-center rounded-full text-xs font-semibold ${
          isPR ? 'bg-amber-100 text-amber-500' : 'text-slate-400'
        }`}
        title={isPR ? 'Nouveau record personnel' : undefined}
      >
        {isPR ? <StarIcon className="h-3.5 w-3.5" /> : index + 1}
      </span>

      <div className="flex min-w-[6.5rem] flex-1 items-center overflow-hidden rounded-xl border border-slate-200 bg-slate-50">
        <button
          type="button"
          onClick={() => stepWeight(-2.5)}
          className="shrink-0 px-1.5 py-3 text-lg font-semibold text-slate-400 active:text-brand-600"
          aria-label="Moins 2.5 kg"
        >
          −
        </button>
        <input
          value={weightText}
          onChange={(e) => setWeightText(e.target.value)}
          onFocus={(e) => e.target.select()}
          onBlur={(e) => commitWeight(e.target.value)}
          inputMode="decimal"
          className="w-0 min-w-[3.4rem] flex-1 bg-transparent py-3 text-center text-lg font-semibold tabular-nums text-slate-900 outline-none"
          aria-label="Poids en kg"
        />
        <button
          type="button"
          onClick={() => stepWeight(2.5)}
          className="shrink-0 px-1.5 py-3 text-lg font-semibold text-slate-400 active:text-brand-600"
          aria-label="Plus 2.5 kg"
        >
          +
        </button>
      </div>
      <span className="shrink-0 text-[10px] font-medium text-slate-400">kg</span>

      <div className="flex min-w-[5.5rem] flex-1 items-center overflow-hidden rounded-xl border border-slate-200 bg-slate-50">
        <button
          type="button"
          onClick={() => stepReps(-1)}
          className="shrink-0 px-1.5 py-3 text-lg font-semibold text-slate-400 active:text-brand-600"
          aria-label="Moins une répétition"
        >
          −
        </button>
        <input
          value={repsText}
          onChange={(e) => setRepsText(e.target.value)}
          onFocus={(e) => e.target.select()}
          onBlur={(e) => commitReps(e.target.value)}
          inputMode="numeric"
          className="w-0 min-w-[2.6rem] flex-1 bg-transparent py-3 text-center text-lg font-semibold tabular-nums text-slate-900 outline-none"
          aria-label="Répétitions"
        />
        <button
          type="button"
          onClick={() => stepReps(1)}
          className="shrink-0 px-1.5 py-3 text-lg font-semibold text-slate-400 active:text-brand-600"
          aria-label="Plus une répétition"
        >
          +
        </button>
      </div>
      <span className="shrink-0 text-[10px] font-medium text-slate-400">reps</span>

      <button
        type="button"
        onClick={onRemove}
        className="shrink-0 p-1 text-slate-300 active:text-red-500"
        aria-label="Supprimer la série"
      >
        <TrashIcon className="h-4 w-4" />
      </button>
    </div>
  )
}

function round2(n: number): number {
  return Math.round(n * 100) / 100
}

function trimZero(n: number): string {
  return Number.isInteger(n) ? String(n) : String(round2(n))
}
