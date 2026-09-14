import { useEffect, useState } from 'react'
import type { SetEntry } from '../types'
import { TrashIcon } from './Icons'

interface SetRowProps {
  set: SetEntry
  index: number
  onChangeWeight: (weight: number) => void
  onChangeReps: (reps: number) => void
  onRemove: () => void
}

export function SetRow({ set, index, onChangeWeight, onChangeReps, onRemove }: SetRowProps) {
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
    <div className="flex items-center gap-2">
      <span className="w-5 shrink-0 text-center text-sm font-medium text-slate-400">
        {index + 1}
      </span>

      <div className="flex flex-1 items-center overflow-hidden rounded-xl border border-slate-200 bg-slate-50">
        <button
          type="button"
          onClick={() => stepWeight(-2.5)}
          className="px-3 py-3 text-lg font-semibold text-slate-400 active:text-brand-600"
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
          className="w-full min-w-0 bg-transparent py-3 text-center text-lg font-semibold text-slate-900 outline-none"
          aria-label="Poids en kg"
        />
        <button
          type="button"
          onClick={() => stepWeight(2.5)}
          className="px-3 py-3 text-lg font-semibold text-slate-400 active:text-brand-600"
          aria-label="Plus 2.5 kg"
        >
          +
        </button>
      </div>
      <span className="shrink-0 text-xs font-medium text-slate-400">kg</span>

      <span className="shrink-0 text-slate-300">×</span>

      <div className="flex flex-1 items-center overflow-hidden rounded-xl border border-slate-200 bg-slate-50">
        <button
          type="button"
          onClick={() => stepReps(-1)}
          className="px-3 py-3 text-lg font-semibold text-slate-400 active:text-brand-600"
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
          className="w-full min-w-0 bg-transparent py-3 text-center text-lg font-semibold text-slate-900 outline-none"
          aria-label="Répétitions"
        />
        <button
          type="button"
          onClick={() => stepReps(1)}
          className="px-3 py-3 text-lg font-semibold text-slate-400 active:text-brand-600"
          aria-label="Plus une répétition"
        >
          +
        </button>
      </div>
      <span className="shrink-0 text-xs font-medium text-slate-400">reps</span>

      <button
        type="button"
        onClick={onRemove}
        className="shrink-0 p-2 text-slate-300 active:text-red-500"
        aria-label="Supprimer la série"
      >
        <TrashIcon className="h-5 w-5" />
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
