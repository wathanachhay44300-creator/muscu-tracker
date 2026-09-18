import { useEffect, useRef, useState } from 'react'
import type { LoadType, SetEntry } from '../types'
import { useLongPress } from '../hooks/useLongPress'
import { useSwipeToDelete } from '../hooks/useSwipeToDelete'
import { usePreferences } from '../hooks/usePreferences'
import { hapticMenuOpen } from '../lib/haptics'
import { DumbbellIcon, StarIcon, TrashIcon, CopyIcon } from './Icons'
import { PlateCalculatorSheet } from './PlateCalculatorSheet'
import { ContextMenuSheet } from './ContextMenuSheet'

/** The plate calculator only makes sense for these — the rest have no plates to pick. */
const PLATE_CALC_LOAD_TYPES: LoadType[] = ['Barre libre', 'Machine à plaques']

interface SetRowProps {
  set: SetEntry
  index: number
  loadType: LoadType
  /** True when this set ties or holds the all-time PR (weight or volume) for its exercise. */
  isPR?: boolean
  onChangeWeight: (weight: number) => void
  onChangeReps: (reps: number) => void
  onRemove: () => void
  onDuplicate: () => void
}

export function SetRow({ set, index, loadType, isPR, onChangeWeight, onChangeReps, onRemove, onDuplicate }: SetRowProps) {
  // Local state is the source of truth while this row is being edited. It's
  // only re-synced from props when a *different* set is mounted into this row
  // (new set.id) — not on every set.weight/reps change — otherwise rapid
  // taps on the steppers would race against the async DB write + live-query
  // round trip and silently drop increments.
  const [weight, setWeight] = useState(set.weight)
  const [reps, setReps] = useState(set.reps)
  const [weightText, setWeightText] = useState(trimZero(set.weight))
  const [repsText, setRepsText] = useState(String(set.reps))
  const [calculatorOpen, setCalculatorOpen] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const preferences = usePreferences()

  // Brief scale "pop" on the number when a stepper button changes it —
  // transform-only, so it stays cheap and GPU-composited.
  const [weightPulse, setWeightPulse] = useState(false)
  const [repsPulse, setRepsPulse] = useState(false)
  const weightPulseTimeout = useRef<ReturnType<typeof setTimeout> | null>(null)
  const repsPulseTimeout = useRef<ReturnType<typeof setTimeout> | null>(null)

  const longPress = useLongPress(() => {
    hapticMenuOpen(!!preferences?.hapticsEnabled)
    setMenuOpen(true)
  })
  const swipe = useSwipeToDelete(onRemove)

  useEffect(() => {
    setWeight(set.weight)
    setReps(set.reps)
    setWeightText(trimZero(set.weight))
    setRepsText(String(set.reps))
    // Only re-sync when a new set is mounted into this row, not on every edit.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [set.id])

  useEffect(() => {
    return () => {
      if (weightPulseTimeout.current) clearTimeout(weightPulseTimeout.current)
      if (repsPulseTimeout.current) clearTimeout(repsPulseTimeout.current)
    }
  }, [])

  function pulseWeight() {
    setWeightPulse(true)
    if (weightPulseTimeout.current) clearTimeout(weightPulseTimeout.current)
    weightPulseTimeout.current = setTimeout(() => setWeightPulse(false), 150)
  }

  function pulseReps() {
    setRepsPulse(true)
    if (repsPulseTimeout.current) clearTimeout(repsPulseTimeout.current)
    repsPulseTimeout.current = setTimeout(() => setRepsPulse(false), 150)
  }

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
    pulseWeight()
  }

  function stepReps(delta: number) {
    const n = Math.max(0, reps + delta)
    setReps(n)
    setRepsText(String(n))
    onChangeReps(n)
    pulseReps()
  }

  return (
    <div className="relative overflow-hidden rounded-xl">
      <div
        ref={swipe.revealRef}
        className="absolute inset-0 flex items-center justify-end bg-red-500 pr-4 opacity-0"
        aria-hidden="true"
      >
        <TrashIcon className="h-5 w-5 text-white" />
      </div>

      <div
        data-swipe-to-delete
        ref={swipe.contentRef}
        className="animate-fade-in relative flex flex-wrap items-center gap-1 rounded-xl bg-surface"
        onPointerDown={(e) => {
          // Stop here so the exercise card's own long-press (for its context
          // menu) never also sees this gesture — whichever level the press
          // actually started at should be the only one reacting to it.
          e.stopPropagation()
          longPress.onPointerDown(e)
          swipe.handlers.onPointerDown(e)
        }}
        onPointerMove={(e) => {
          longPress.onPointerMove(e)
          swipe.handlers.onPointerMove(e)
        }}
        onPointerUp={(e) => {
          longPress.onPointerUp(e)
          swipe.handlers.onPointerUp(e)
        }}
        onPointerCancel={(e) => {
          longPress.onPointerCancel(e)
          swipe.handlers.onPointerCancel(e)
        }}
        onClickCapture={longPress.onClickCapture}
      >
        <span
          className={`flex h-6 w-5 shrink-0 items-center justify-center rounded-full text-xs font-semibold ${
            isPR ? 'bg-amber-100 text-amber-500' : 'text-slate-400'
          }`}
          title={isPR ? 'Nouveau record personnel' : undefined}
        >
          {isPR ? <StarIcon className="animate-pop-in h-3.5 w-3.5" /> : index + 1}
        </span>

        <div
          data-no-long-press
          data-no-swipe
          className="flex min-w-[6.5rem] flex-1 items-center overflow-hidden rounded-xl border border-slate-200 bg-slate-50"
        >
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
            className={`w-0 min-w-[3.4rem] flex-1 bg-transparent py-3 text-center text-lg font-semibold tabular-nums text-slate-900 outline-none transition-transform duration-150 ${
              weightPulse ? 'scale-110' : 'scale-100'
            }`}
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
        {PLATE_CALC_LOAD_TYPES.includes(loadType) ? (
          <button
            type="button"
            data-no-long-press
            data-no-swipe
            onClick={() => setCalculatorOpen(true)}
            className="flex shrink-0 items-center gap-0.5 rounded-md px-0.5 py-0.5 text-[10px] font-medium text-slate-400 active:text-brand-600"
            aria-label="Calculateur de plaques"
            title="Calculateur de plaques"
          >
            <DumbbellIcon className="h-2.5 w-2.5" />
            kg
          </button>
        ) : (
          <span className="shrink-0 text-[10px] font-medium text-slate-400">kg</span>
        )}

        <div
          data-no-long-press
          data-no-swipe
          className="flex min-w-[5.5rem] flex-1 items-center overflow-hidden rounded-xl border border-slate-200 bg-slate-50"
        >
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
            className={`w-0 min-w-[2.6rem] flex-1 bg-transparent py-3 text-center text-lg font-semibold tabular-nums text-slate-900 outline-none transition-transform duration-150 ${
              repsPulse ? 'scale-110' : 'scale-100'
            }`}
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
          data-no-long-press
          data-no-swipe
          onClick={onRemove}
          className="shrink-0 p-1 text-slate-300 active:text-red-500"
          aria-label="Supprimer la série"
        >
          <TrashIcon className="h-4 w-4" />
        </button>
      </div>

      {calculatorOpen && PLATE_CALC_LOAD_TYPES.includes(loadType) && (
        <PlateCalculatorSheet
          initialWeight={weight}
          loadType={loadType}
          onClose={() => setCalculatorOpen(false)}
        />
      )}

      {menuOpen && (
        <ContextMenuSheet
          title={`Série ${index + 1}`}
          actions={[
            { label: 'Dupliquer la série', icon: CopyIcon, onSelect: onDuplicate },
            { label: 'Supprimer la série', icon: TrashIcon, onSelect: onRemove, danger: true },
          ]}
          onClose={() => setMenuOpen(false)}
        />
      )}
    </div>
  )
}

function round2(n: number): number {
  return Math.round(n * 100) / 100
}

function trimZero(n: number): string {
  return Number.isInteger(n) ? String(n) : String(round2(n))
}
