import { useEffect, useRef, useState, type KeyboardEvent } from 'react'
import { formatDecimal, parseDecimal } from '../i18n'

function round2(n: number): number {
  return Math.round(n * 100) / 100
}

/** "62,5" / "62.5", "8": decimal separator of the current language, no trailing zeros. */
function formatFieldValue(n: number): string {
  return formatDecimal(round2(n))
}

function parseFieldValue(raw: string, decimal: boolean): number | null {
  const n = decimal ? parseDecimal(raw) : parseInt(raw, 10)
  return Number.isFinite(n) ? n : null
}

interface NumberFieldProps {
  value: number
  /** Change for the arrow keys (e.g. 2.5 kg, 1 rep). */
  step: number
  decimal?: boolean
  /** Accessible label, e.g. "Poids en kg, série 2". */
  label: string
  onCommit: (value: number) => void
  className?: string
}

/**
 * A compact number field for editing past sessions: tap to type (decimal or
 * numeric pad, value selected, comma accepted, Enter or tapping elsewhere
 * validates); arrow up/down adjust it from a keyboard. Session mode uses the
 * scrolling ruler instead.
 */
export function NumberField({ value, step, decimal = false, label, onCommit, className = '' }: NumberFieldProps) {
  const [text, setText] = useState(formatFieldValue(value))
  const [editing, setEditing] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (!editing) setText(formatFieldValue(value))
  }, [value, editing])

  function clamp(n: number): number {
    return Math.max(0, decimal ? round2(n) : Math.round(n))
  }

  function commitText() {
    const n = parseFieldValue(inputRef.current?.value ?? text, decimal)
    const v = n == null ? value : clamp(n)
    setText(formatFieldValue(v))
    if (v !== value) onCommit(v)
  }

  function onKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter') {
      e.currentTarget.blur()
    } else if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
      e.preventDefault()
      const base = parseFieldValue(e.currentTarget.value, decimal) ?? value
      const next = clamp(base + (e.key === 'ArrowUp' ? step : -step))
      setText(formatFieldValue(next))
      onCommit(next)
    }
  }

  return (
    <input
      ref={inputRef}
      value={text}
      onChange={(e) => setText(e.target.value)}
      onFocus={(e) => {
        setEditing(true)
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
      data-no-long-press
      data-no-swipe
      className={`h-12 min-w-0 rounded-xl bg-surface-2 px-2 text-center text-xl font-bold font-numbers text-ink outline-none focus:bg-surface focus:ring-2 focus:ring-inset focus:ring-accent ${className}`}
    />
  )
}
