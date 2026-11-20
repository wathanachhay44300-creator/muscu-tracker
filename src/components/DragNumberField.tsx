import { useEffect, useRef, useState, type KeyboardEvent, type PointerEvent as ReactPointerEvent } from 'react'
import { formatDecimal, parseDecimal } from '../i18n'
import { hapticTick } from '../lib/haptics'
import { ChevronLeftIcon, ChevronRightIcon } from './Icons'

/** Horizontal distance for one notch. */
const NOTCH_PX = 24
/** Horizontal travel before a drag starts (below that, it's a tap or a scroll). */
const ACTIVATE_PX = 8

function round2(n: number): number {
  return Math.round(n * 100) / 100
}

/** "62,5" / "62.5", "8": decimal separator of the current language, no trailing zeros. */
export function formatFieldValue(n: number): string {
  return formatDecimal(round2(n))
}

function parseFieldValue(raw: string, decimal: boolean): number | null {
  const n = decimal ? parseDecimal(raw) : parseInt(raw, 10)
  return Number.isFinite(n) ? n : null
}

interface DragNumberFieldProps {
  value: number
  /** Change per notch (e.g. 2.5 kg, 1 rep). */
  step: number
  decimal?: boolean
  /** Accessible label, e.g. "Poids en kg, série 2". */
  label: string
  dimmed?: boolean
  haptics?: boolean
  onCommit: (value: number) => void
  className?: string
}

/**
 * A number set by dragging: right = up, left = down, one notch every
 * ~24 px. The drag only starts after 8 px of mostly-horizontal travel, so
 * vertical scrolling is never blocked (touch-action: pan-y). A plain tap
 * opens the keyboard on the real input underneath (decimal/numeric pad,
 * value selected, comma accepted, Enter or tapping elsewhere validates).
 * Arrow up/down adjust the value from a keyboard. Each notch makes the
 * number bounce (and vibrates where the browser supports it).
 */
export function DragNumberField({
  value,
  step,
  decimal = false,
  label,
  dimmed = false,
  haptics = false,
  onCommit,
  className = '',
}: DragNumberFieldProps) {
  const [current, setCurrent] = useState(value)
  const [text, setText] = useState(formatFieldValue(value))
  const [editing, setEditing] = useState(false)
  const [dragging, setDragging] = useState(false)
  const [bump, setBump] = useState<{ n: number; dir: 1 | -1 } | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const gesture = useRef<{
    id: number
    x: number
    y: number
    start: number
    active: boolean
    steps: number
  } | null>(null)
  const suppressClick = useRef(false)
  const currentRef = useRef(current)
  useEffect(() => {
    currentRef.current = current
  }, [current])

  // Follow outside changes (another device row, undo…) except while the user is acting on this field.
  useEffect(() => {
    if (editing || gesture.current?.active) return
    setCurrent(value)
    setText(formatFieldValue(value))
  }, [value, editing])

  function clamp(n: number): number {
    return Math.max(0, decimal ? round2(n) : Math.round(n))
  }

  function show(n: number, dir: 1 | -1) {
    currentRef.current = n // read by the next pointer events before React re-renders
    setCurrent(n)
    setText(formatFieldValue(n))
    setBump((b) => ({ n: (b?.n ?? 0) + 1, dir }))
    hapticTick(haptics)
  }

  function onPointerDown(e: ReactPointerEvent<HTMLDivElement>) {
    if (editing || !e.isPrimary || (e.pointerType === 'mouse' && e.button !== 0)) return
    gesture.current = { id: e.pointerId, x: e.clientX, y: e.clientY, start: currentRef.current, active: false, steps: 0 }
  }

  function onPointerMove(e: ReactPointerEvent<HTMLDivElement>) {
    const g = gesture.current
    if (!g || e.pointerId !== g.id) return
    const dx = e.clientX - g.x
    const dy = e.clientY - g.y
    if (!g.active) {
      if (Math.abs(dy) > ACTIVATE_PX && Math.abs(dy) >= Math.abs(dx)) {
        gesture.current = null // vertical: it's a scroll, let the page have it
        return
      }
      if (Math.abs(dx) < ACTIVATE_PX || Math.abs(dx) <= Math.abs(dy)) return
      g.active = true
      // Count notches from where the drag actually started.
      g.x = e.clientX
      setDragging(true)
      try {
        e.currentTarget.setPointerCapture(e.pointerId)
      } catch {
        // synthetic events / unsupported: still works through bubbling
      }
      return
    }
    e.preventDefault()
    const steps = Math.trunc((e.clientX - g.x) / NOTCH_PX)
    if (steps === g.steps) return
    const dir: 1 | -1 = steps > g.steps ? 1 : -1
    g.steps = steps
    const next = clamp(g.start + steps * step)
    if (next !== currentRef.current) show(next, dir)
  }

  function onPointerEnd(e: ReactPointerEvent<HTMLDivElement>) {
    const g = gesture.current
    if (!g || e.pointerId !== g.id) return
    gesture.current = null
    if (!g.active) return
    setDragging(false)
    // A drag must not also count as a tap that opens the keyboard.
    suppressClick.current = true
    setTimeout(() => (suppressClick.current = false), 0)
    if (currentRef.current !== g.start) onCommit(currentRef.current)
  }

  function onClick() {
    if (suppressClick.current || editing) return
    const input = inputRef.current
    if (!input) return
    input.focus()
    input.select()
  }

  function commitText() {
    const n = parseFieldValue(inputRef.current?.value ?? text, decimal)
    const v = n == null ? current : clamp(n)
    setCurrent(v)
    setText(formatFieldValue(v))
    if (v !== value) onCommit(v)
  }

  function onKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter') {
      e.currentTarget.blur()
    } else if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
      e.preventDefault()
      const base = parseFieldValue(e.currentTarget.value, decimal) ?? current
      const next = clamp(base + (e.key === 'ArrowUp' ? step : -step))
      setCurrent(next)
      setText(formatFieldValue(next))
      onCommit(next)
    }
  }

  return (
    <div
      data-no-long-press
      data-no-swipe
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerEnd}
      onPointerCancel={onPointerEnd}
      onClick={onClick}
      className={`relative flex h-12 cursor-ew-resize select-none items-center rounded-xl ${
        editing ? 'bg-surface ring-2 ring-inset ring-accent' : dragging ? 'bg-surface-4' : 'bg-surface-2'
      } ${dimmed && !editing ? 'opacity-55' : ''} ${className}`}
      style={{ touchAction: 'pan-y', WebkitTouchCallout: 'none', WebkitUserSelect: 'none' }}
    >
      <ChevronLeftIcon
        aria-hidden="true"
        className={`pointer-events-none absolute left-1 h-3.5 w-3.5 ${dragging ? 'text-accent-ink' : 'text-faint'} ${editing ? 'opacity-0' : ''}`}
      />
      <input
        ref={inputRef}
        value={text}
        onChange={(e) => setText(e.target.value)}
        onFocus={(e) => {
          setEditing(true)
          // iOS ignores select() during the focus event itself.
          const el = e.currentTarget
          setTimeout(() => el.select(), 0)
        }}
        onBlur={() => {
          setEditing(false)
          commitText()
        }}
        onKeyDown={onKeyDown}
        inputMode={decimal ? 'decimal' : 'numeric'}
        enterKeyHint="done"
        autoComplete="off"
        aria-label={label}
        // Not tappable until editing: a touch here is first a potential drag.
        className={`h-full w-full min-w-0 bg-transparent px-5 text-center text-xl font-bold font-numbers text-ink outline-none ${
          editing ? 'pointer-events-auto select-text' : 'pointer-events-none'
        }`}
        // Each notch restarts a small bounce (two identical keyframes alternate so it replays).
        style={
          bump && !editing
            ? {
                animation: `${bump.n % 2 ? 'num-bump-a' : 'num-bump-b'} 170ms ease-out`,
                ['--bump-dir' as string]: String(bump.dir),
              }
            : undefined
        }
      />
      <ChevronRightIcon
        aria-hidden="true"
        className={`pointer-events-none absolute right-1 h-3.5 w-3.5 ${dragging ? 'text-accent-ink' : 'text-faint'} ${editing ? 'opacity-0' : ''}`}
      />
    </div>
  )
}
