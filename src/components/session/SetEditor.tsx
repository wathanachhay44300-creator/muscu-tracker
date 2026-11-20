import { useRef, useState } from 'react'
import { formatDecimal, parseDecimal, t } from '../../i18n'
import { CheckIcon } from '../Icons'
import { ScrollRuler } from './ScrollRuler'

const MAX_WEIGHT = 300
const MAX_REPS = 50

function round2(n: number): number {
  return Math.round(n * 100) / 100
}

type Bump = { n: number; dir: 1 | -1 } | null

interface BigNumberProps {
  value: number
  decimal: boolean
  /** Shown instead of the number when not editing (e.g. "PDC" for bodyweight at 0). */
  display?: string
  unit: string
  label: string
  bump: Bump
  onCommit: (value: number) => void
}

/**
 * The big number above a ruler. Tapping it opens the keyboard (decimal pad
 * for the weight), value selected, comma accepted; Enter or tapping elsewhere
 * validates. A value between two graduations is kept as typed.
 */
function BigNumber({ value, decimal, display, unit, label, bump, onCommit }: BigNumberProps) {
  const [editing, setEditing] = useState(false)
  const [text, setText] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  function commit() {
    const raw = inputRef.current?.value ?? text
    const n = decimal ? parseDecimal(raw) : parseInt(raw, 10)
    setEditing(false)
    if (!Number.isFinite(n)) return
    // Kept as typed, even between two graduations; only absurd typos are capped.
    const v = Math.min(Math.max(0, decimal ? round2(n) : Math.round(n)), 999)
    if (v !== value) onCommit(v)
  }

  const shown = editing ? text : (display ?? formatDecimal(value))
  return (
    <div className="flex items-end justify-center gap-1">
      <input
        ref={inputRef}
        value={shown}
        onChange={(e) => setText(e.target.value)}
        onFocus={(e) => {
          setText(formatDecimal(value))
          setEditing(true)
          const el = e.currentTarget
          el.select()
          // iOS ignores select() during the focus event itself.
          setTimeout(() => el.select(), 0)
        }}
        onBlur={commit}
        onKeyDown={(e) => e.key === 'Enter' && e.currentTarget.blur()}
        inputMode={decimal ? 'decimal' : 'numeric'}
        enterKeyHint="done"
        autoComplete="off"
        aria-label={label}
        className={`font-numbers rounded-xl bg-transparent px-1 text-center text-[3rem] font-extrabold leading-none text-ink outline-none ${
          editing ? 'bg-surface-3 ring-2 ring-accent' : ''
        }`}
        style={{
          // Sized to the digits so the unit sits right after them.
          width: `${Math.max(editing ? 3 : 1, shown.length) * 0.55 + 0.5}em`,
          ...(bump && !editing
            ? { animation: `${bump.n % 2 ? 'num-bump-a' : 'num-bump-b'} 170ms ease-out`, ['--bump-dir' as string]: String(bump.dir) }
            : {}),
        }}
      />
      {unit && <span className="pb-1.5 text-sm font-semibold text-muted">{unit}</span>}
    </div>
  )
}

interface SetEditorProps {
  /** "Série 3", shown above the numbers. */
  title: string
  /** Optional hint on the right of the title (last time's values for this set). */
  hint?: string
  weight: number
  reps: number
  weightStep: number
  /** Bodyweight exercise: 0 kg reads "PDC", more is extra load. */
  bodyweight: boolean
  haptics: boolean
  buttonLabel: string
  canSubmit: boolean
  onWeight: (value: number) => void
  onReps: (value: number) => void
  /** The ruler stopped or a value was typed: a good moment to save. */
  onSettle: (patch: { weight?: number; reps?: number }) => void
  onSubmit: () => void
}

/** The single set editor of session mode: big numbers, two rulers, one button. */
export function SetEditor({
  title,
  hint,
  weight,
  reps,
  weightStep,
  bodyweight,
  haptics,
  buttonLabel,
  canSubmit,
  onWeight,
  onReps,
  onSettle,
  onSubmit,
}: SetEditorProps) {
  const [weightBump, setWeightBump] = useState<Bump>(null)
  const [repsBump, setRepsBump] = useState<Bump>(null)
  const bw = bodyweight && weight === 0
  const weightDisplay = bodyweight ? (weight === 0 ? t('editor.bw') : `+${formatDecimal(weight)}`) : undefined

  return (
    <div className="rounded-2xl border border-line bg-surface px-4 pb-4 pt-3">
      <div className="mb-1 flex items-baseline justify-between gap-2">
        <p className="text-xs font-bold uppercase tracking-wide text-ink-2">{title}</p>
        {hint && <p className="truncate text-xs text-muted">{hint}</p>}
      </div>

      <div className="grid grid-cols-[3.5rem_1fr_3.5rem] items-center">
        <span className="text-[11px] font-bold uppercase tracking-wide text-muted">{t('editor.weight')}</span>
        <BigNumber
          value={weight}
          decimal
          display={weightDisplay}
          unit={bw ? '' : 'kg'}
          label={t('editor.weightLabel')}
          bump={weightBump}
          onCommit={(v) => {
            onWeight(v)
            onSettle({ weight: v })
          }}
        />
        <span />
      </div>
      <ScrollRuler
        value={weight}
        step={weightStep}
        max={MAX_WEIGHT}
        majorEvery={10}
        label={t('editor.weightLabel')}
        valueText={bw ? t('editor.bw') : `${formatDecimal(weight)} kg`}
        haptics={haptics}
        onChange={(v, dir) => {
          onWeight(v)
          setWeightBump((b) => ({ n: (b?.n ?? 0) + 1, dir }))
        }}
        onSettle={(v) => onSettle({ weight: v })}
      />

      <div className="mt-2 grid grid-cols-[3.5rem_1fr_3.5rem] items-center">
        <span className="text-[11px] font-bold uppercase tracking-wide text-muted">{t('editor.reps')}</span>
        <BigNumber
          value={reps}
          decimal={false}
          unit={t('editor.repsUnit')}
          label={t('editor.repsLabel')}
          bump={repsBump}
          onCommit={(v) => {
            onReps(v)
            onSettle({ reps: v })
          }}
        />
        <span />
      </div>
      <ScrollRuler
        value={reps}
        step={1}
        max={MAX_REPS}
        majorEvery={5}
        label={t('editor.repsLabel')}
        valueText={`${reps} ${t('editor.repsUnit')}`}
        haptics={haptics}
        onChange={(v, dir) => {
          onReps(v)
          setRepsBump((b) => ({ n: (b?.n ?? 0) + 1, dir }))
        }}
        onSettle={(v) => onSettle({ reps: v })}
      />

      <button
        type="button"
        onClick={onSubmit}
        disabled={!canSubmit}
        className="mt-3 flex min-h-14 w-full items-center justify-center gap-2 rounded-2xl bg-accent text-base font-bold text-on-accent active:bg-accent-hover disabled:opacity-40"
      >
        <CheckIcon className="h-5 w-5" strokeWidth={3} />
        {buttonLabel}
      </button>
    </div>
  )
}
