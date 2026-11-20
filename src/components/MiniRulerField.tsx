import { useEffect, useLayoutEffect, useRef, useState, type KeyboardEvent } from 'react'
import { formatDecimal, parseDecimal } from '../i18n'
import { hapticTick } from '../lib/haptics'

/** Distance between two graduations, in px. */
const GAP = 9
/** No scroll event for this long = the ruler has come to rest. */
const SETTLE_MS = 140

function round2(n: number): number {
  return Math.round(n * 100) / 100
}

interface MiniRulerFieldProps {
  value: number
  /** Value of one graduation (e.g. 2.5 kg, 1 rep). */
  step: number
  max: number
  decimal?: boolean
  unit: string
  /** Accessible label, e.g. "Poids en kg, série 2". */
  label: string
  haptics?: boolean
  onCommit: (value: number) => void
  className?: string
}

/**
 * A weight / reps box that is also a small ruler. Swiping sideways on it
 * scrolls the graduations under a fixed centre mark (native scrolling, so
 * it follows the finger, keeps its momentum and snaps to a graduation);
 * pushing left raises the value. A tap without sliding opens the keyboard
 * (decimal pad for the weight, comma accepted); a typed value between two
 * graduations is kept as is. A vertical swipe still scrolls the page.
 */
export function MiniRulerField({
  value,
  step,
  max,
  decimal = false,
  unit,
  label,
  haptics = false,
  onCommit,
  className = '',
}: MiniRulerFieldProps) {
  const [current, setCurrent] = useState(value)
  const [adjusting, setAdjusting] = useState(false)
  const [editing, setEditing] = useState(false)
  const [text, setText] = useState('')
  const [bump, setBump] = useState<{ n: number; dir: 1 | -1 } | null>(null)
  const scrollerRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const count = Math.max(1, Math.round(max / step))

  const expectedLeft = useRef<number | null>(null)
  const interacting = useRef(false)
  const offGrid = useRef(false)
  const lastIndex = useRef(0)
  const settleTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)
  const latest = useRef({ step, count, value, onCommit, haptics })
  useEffect(() => {
    latest.current = { step, count, value, onCommit, haptics }
  })
  useEffect(() => () => clearTimeout(settleTimer.current), [])

  // Outside changes (undo, another row…) show up unless the user is acting on this box.
  useEffect(() => {
    if (!interacting.current && !editing) setCurrent(value)
  }, [value, editing])

  // Place the ruler on the shown value, unless it's being scrolled (that would kill the momentum).
  useLayoutEffect(() => {
    const el = scrollerRef.current
    if (!el || interacting.current) return
    const exact = Math.min(Math.max(current, 0), max) / step
    const onGrid = Math.abs(exact - Math.round(exact)) < 1e-6
    // A typed value between two graduations stays put: snapping is off until the next swipe.
    offGrid.current = !onGrid
    el.style.scrollSnapType = onGrid ? 'x mandatory' : 'none'
    const left = exact * GAP
    expectedLeft.current = left
    el.scrollLeft = left
    lastIndex.current = Math.round(exact)
  }, [current, step, max])

  function settle() {
    const el = scrollerRef.current
    interacting.current = false
    setAdjusting(false)
    if (!el) return
    const { step, count, value, onCommit } = latest.current
    const index = Math.min(Math.max(Math.round(el.scrollLeft / GAP), 0), count)
    const v = round2(index * step)
    lastIndex.current = index
    setCurrent(v)
    if (v !== value) onCommit(v)
  }

  function handleScroll() {
    const el = scrollerRef.current
    if (!el) return
    const left = el.scrollLeft
    if (expectedLeft.current != null && Math.abs(left - expectedLeft.current) < 1.5) return
    expectedLeft.current = null
    if (!interacting.current) {
      interacting.current = true
      setAdjusting(true)
    }
    if (offGrid.current) {
      offGrid.current = false
      el.style.scrollSnapType = 'x mandatory'
    }
    const { step, count, haptics } = latest.current
    const index = Math.min(Math.max(Math.round(left / GAP), 0), count)
    if (index !== lastIndex.current) {
      const dir: 1 | -1 = index > lastIndex.current ? 1 : -1
      lastIndex.current = index
      setCurrent(round2(index * step))
      setBump((b) => ({ n: (b?.n ?? 0) + 1, dir }))
      hapticTick(haptics)
    }
    clearTimeout(settleTimer.current)
    settleTimer.current = setTimeout(settle, SETTLE_MS)
  }

  // Desktop: a vertical mouse wheel over the box moves the ruler.
  useEffect(() => {
    const el = scrollerRef.current
    if (!el) return
    const onWheel = (e: WheelEvent) => {
      if (Math.abs(e.deltaY) <= Math.abs(e.deltaX)) return
      e.preventDefault()
      el.scrollBy({ left: e.deltaY })
    }
    el.addEventListener('wheel', onWheel, { passive: false })
    return () => el.removeEventListener('wheel', onWheel)
  }, [])

  /** A tap (no slide: a scroll swallows the click) opens the keyboard. */
  function openKeyboard() {
    if (interacting.current) return
    const input = inputRef.current
    if (!input) return
    setText(formatDecimal(current))
    setEditing(true)
    input.focus()
    input.select()
  }

  function commitText() {
    const raw = inputRef.current?.value ?? text
    const n = decimal ? parseDecimal(raw) : parseInt(raw, 10)
    setEditing(false)
    if (!Number.isFinite(n)) return
    const v = Math.min(Math.max(0, decimal ? round2(n) : Math.round(n)), 999)
    setCurrent(v)
    if (v !== value) onCommit(v)
  }

  function stepBy(delta: 1 | -1) {
    const base = Math.round(current / step)
    const v = round2(Math.min(Math.max(base + delta, 0), count) * step)
    if (v === current) return
    setCurrent(v)
    setBump((b) => ({ n: (b?.n ?? 0) + 1, dir: delta }))
    onCommit(v)
  }

  function onSliderKey(e: KeyboardEvent<HTMLDivElement>) {
    if (e.key === 'ArrowRight' || e.key === 'ArrowUp') {
      e.preventDefault()
      stepBy(1)
    } else if (e.key === 'ArrowLeft' || e.key === 'ArrowDown') {
      e.preventDefault()
      stepBy(-1)
    } else if (e.key === 'Enter') {
      openKeyboard()
    }
  }

  const active = adjusting || editing

  return (
    <div
      data-no-swipe
      data-no-long-press
      className={`relative h-14 select-none overflow-hidden rounded-xl border ${
        active ? 'border-accent bg-accent-soft' : 'border-transparent bg-surface-2'
      } ${className}`}
      style={{ WebkitTouchCallout: 'none', WebkitUserSelect: 'none' }}
    >
      {/* The scrolling ruler covers the whole box: a sideways swipe anywhere moves it. */}
      <div
        ref={scrollerRef}
        role="slider"
        tabIndex={0}
        aria-label={label}
        aria-valuemin={0}
        aria-valuemax={max}
        aria-valuenow={current}
        aria-valuetext={`${formatDecimal(current)} ${unit}`}
        onScroll={handleScroll}
        onClick={openKeyboard}
        onKeyDown={onSliderKey}
        className={`absolute inset-0 flex cursor-ew-resize overflow-x-auto overflow-y-hidden outline-none [scrollbar-width:none] [&::-webkit-scrollbar]:hidden ${
          editing ? 'pointer-events-none' : ''
        }`}
        style={{
          scrollSnapType: 'x mandatory',
          touchAction: 'pan-x pan-y',
          overscrollBehaviorX: 'contain',
          maskImage: 'linear-gradient(to right, transparent, #000 25%, #000 75%, transparent)',
          WebkitMaskImage: 'linear-gradient(to right, transparent, #000 25%, #000 75%, transparent)',
        }}
      >
        <div className="shrink-0 basis-1/2" aria-hidden="true" />
        <div
          className="relative h-full shrink-0"
          aria-hidden="true"
          style={{
            width: count * GAP + 1,
            backgroundImage: 'linear-gradient(to right, var(--text-faint) 1px, transparent 1px)',
            backgroundSize: `${GAP}px 8px`,
            backgroundRepeat: 'repeat-x',
            backgroundPosition: '0 calc(100% - 5px)',
          }}
        >
          {Array.from({ length: count + 1 }, (_, i) => (
            <span key={i} className="absolute top-0 h-px w-0.5" style={{ left: i * GAP - 0.5, scrollSnapAlign: 'center' }} />
          ))}
        </div>
        <div className="shrink-0 basis-1/2" aria-hidden="true" />
      </div>

      {/* Number + unit (display only) and the fixed centre mark */}
      <div className="pointer-events-none absolute inset-x-0 top-1 flex items-baseline justify-center gap-1">
        <span
          className={`font-numbers text-[1.6rem] font-bold leading-none ${active ? 'text-accent-ink' : 'text-ink'} ${
            editing ? 'invisible' : ''
          }`}
          style={
            bump && !editing
              ? { animation: `${bump.n % 2 ? 'num-bump-a' : 'num-bump-b'} 170ms ease-out`, ['--bump-dir' as string]: String(bump.dir) }
              : undefined
          }
        >
          {formatDecimal(current)}
        </span>
        <span className={`text-[10px] font-semibold text-muted ${editing ? 'invisible' : ''}`}>{unit}</span>
      </div>
      <span
        aria-hidden="true"
        className={`pointer-events-none absolute bottom-1 left-1/2 h-3 w-0.5 -translate-x-1/2 rounded-full ${
          active ? 'bg-accent' : 'bg-muted'
        }`}
      />

      {/* Keyboard entry, on top only while typing */}
      <input
        ref={inputRef}
        value={editing ? text : formatDecimal(current)}
        onChange={(e) => setText(e.target.value)}
        onFocus={(e) => {
          const el = e.currentTarget
          setTimeout(() => el.select(), 0)
        }}
        onBlur={commitText}
        onKeyDown={(e) => {
          if (e.key === 'Enter') e.currentTarget.blur()
        }}
        inputMode={decimal ? 'decimal' : 'numeric'}
        enterKeyHint="done"
        autoComplete="off"
        aria-label={label}
        tabIndex={-1}
        className={`font-numbers absolute inset-x-1 top-1 h-8 rounded-lg bg-transparent text-center text-[1.6rem] font-bold leading-none text-accent-ink outline-none ${
          editing ? 'opacity-100' : 'pointer-events-none opacity-0'
        }`}
      />
    </div>
  )
}
