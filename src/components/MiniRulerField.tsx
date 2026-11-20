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
  /** Typed values are rounded to this (0.01 for the weight, 0.5 for half reps). */
  typedStep?: number
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
 * (decimal pad, comma or point, rounded to `typedStep`); a typed value
 * between two graduations is kept as is, and the next swipe goes to the
 * neighbouring graduation in the direction of the gesture (62,5 → 65 or 60
 * with a 2,5 step). A vertical swipe still scrolls the page.
 */
export function MiniRulerField({
  value,
  step,
  max,
  typedStep = 0.01,
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
  /** A finger, mouse or wheel is acting on the ruler. Scroll events without it are the browser's own (snap, keyboard closing…). */
  const userGesture = useRef(false)
  /** A finger is on the box. Stays true through pointercancel: on a phone the browser cancels the
   * pointer as soon as it starts scrolling, while the finger is still dragging the ruler. */
  const fingerDown = useRef(false)
  const gestureEndTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)
  const offGrid = useRef(false)
  /** Off-grid value being left: its fractional index and the scroll offset it sits at. */
  const leaving = useRef<{ index: number; left: number } | null>(null)
  const offGridAt = useRef<{ index: number; left: number } | null>(null)
  const lastIndex = useRef(0)
  const settleTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)
  const latest = useRef({ step, count, value, onCommit, haptics })
  useEffect(() => {
    latest.current = { step, count, value, onCommit, haptics }
  })
  useEffect(
    () => () => {
      clearTimeout(settleTimer.current)
      clearTimeout(gestureEndTimer.current)
    },
    [],
  )

  // Outside changes (undo, another row…) show up unless the user is acting on this box.
  // Only reacts to a new stored value: closing the keyboard must not bring back the old one
  // before the typed value has been saved.
  useEffect(() => {
    if (!interacting.current && !editing) setCurrent(value)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value])

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
    offGridAt.current = onGrid ? null : { index: exact, left: el.scrollLeft }
    // The fractional index makes the first tick of the next swipe always change the shown value.
    lastIndex.current = onGrid ? Math.round(exact) : exact
    leaving.current = null
  }, [current, step, max])

  /** Graduation under the centre mark; from an off-grid value, the first one in the gesture's direction. */
  function indexAt(left: number): number {
    const { count } = latest.current
    let index = Math.round(left / GAP)
    const from = leaving.current
    if (from) index = left >= from.left ? Math.max(index, Math.ceil(from.index)) : Math.min(index, Math.floor(from.index))
    return Math.min(Math.max(index, 0), count)
  }

  function settle() {
    const el = scrollerRef.current
    interacting.current = false
    // A finger held still mid-swipe also lets the ruler settle: the gesture isn't over yet.
    if (!fingerDown.current) userGesture.current = false
    setAdjusting(false)
    if (!el) return
    const { step, value, onCommit } = latest.current
    const index = indexAt(el.scrollLeft)
    leaving.current = null
    const v = round2(index * step)
    lastIndex.current = index
    setCurrent(v)
    // Snapping may have stopped on the other side of the off-grid value: put the ruler on the kept one.
    const target = index * GAP
    // Also the reference a later browser-driven scroll gets put back to.
    expectedLeft.current = target
    if (Math.abs(el.scrollLeft - target) >= 1) el.scrollLeft = target
    if (v !== value) onCommit(v)
  }

  function handleScroll() {
    const el = scrollerRef.current
    if (!el) return
    const left = el.scrollLeft
    if (expectedLeft.current != null && Math.abs(left - expectedLeft.current) < 1.5) return
    if (!userGesture.current && !fingerDown.current && !interacting.current) {
      // The browser moved the ruler by itself (re-snap after the keyboard closes, layout change…):
      // put it back on the shown value instead of rounding it to a graduation.
      if (expectedLeft.current != null) el.scrollLeft = expectedLeft.current
      return
    }
    expectedLeft.current = null
    if (!interacting.current) {
      interacting.current = true
      setAdjusting(true)
    }
    if (offGrid.current) {
      offGrid.current = false
      leaving.current = offGridAt.current
      el.style.scrollSnapType = 'x mandatory'
    }
    const { step, haptics } = latest.current
    const index = indexAt(left)
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
      userGesture.current = true
      if (Math.abs(e.deltaY) <= Math.abs(e.deltaX)) return
      e.preventDefault()
      el.scrollBy({ left: e.deltaY })
    }
    el.addEventListener('wheel', onWheel, { passive: false })
    return () => el.removeEventListener('wheel', onWheel)
  }, [])

  function startTouch() {
    clearTimeout(gestureEndTimer.current)
    fingerDown.current = true
    userGesture.current = true
  }

  /** Finger lifted: a swipe in progress keeps going (momentum) through `interacting`; a tap leaves
   * no gesture behind. A quick flick can lift the finger before the first scroll event, hence the delay. */
  function endTouch() {
    fingerDown.current = false
    clearTimeout(gestureEndTimer.current)
    gestureEndTimer.current = setTimeout(() => {
      if (!interacting.current) userGesture.current = false
    }, 300)
  }

  /** A tap (no slide: a scroll swallows the click) opens the keyboard. */
  function openKeyboard() {
    if (interacting.current) return
    // A tap, not a swipe: the scroll the keyboard causes when it opens or closes isn't the user's.
    clearTimeout(gestureEndTimer.current)
    userGesture.current = false
    const input = inputRef.current
    if (!input) return
    setText(formatDecimal(current))
    setEditing(true)
    input.focus()
    input.select()
  }

  function commitText() {
    const raw = inputRef.current?.value ?? text
    const n = parseDecimal(raw)
    setEditing(false)
    if (!Number.isFinite(n)) return
    const v = Math.min(Math.max(0, round2(Math.round(n / typedStep) * typedStep)), 999)
    setCurrent(v)
    if (v !== value) onCommit(v)
  }

  function stepBy(delta: 1 | -1) {
    // From an off-grid value, the neighbouring graduation on that side.
    const exact = current / step
    const next = delta > 0 ? Math.floor(exact + 1e-6) + 1 : Math.ceil(exact - 1e-6) - 1
    const v = round2(Math.min(Math.max(next, 0), count) * step)
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
        onPointerDown={startTouch}
        onTouchStart={startTouch}
        onPointerUp={endTouch}
        onTouchEnd={endTouch}
        onTouchCancel={endTouch}
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
        inputMode="decimal"
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
