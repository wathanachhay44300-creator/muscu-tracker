import { useRef, useState } from 'react'

/**
 * Turns a name into an editable text field in place — no navigation, no
 * sheet. Shared between the programs list and the exercise library so both
 * rename the same way: Enter or blur commits, Escape reverts, and an empty
 * value is rejected (the old name comes back) rather than saved blank.
 */
export function useInlineRename(name: string, onRename: (name: string) => void) {
  const [editing, setEditing] = useState(false)
  const [value, setValue] = useState(name)
  const committedRef = useRef(false)

  function start() {
    setValue(name)
    committedRef.current = false
    setEditing(true)
  }

  function commit() {
    if (committedRef.current) return
    committedRef.current = true
    setEditing(false)
    const trimmed = value.trim()
    if (trimmed && trimmed !== name) onRename(trimmed)
  }

  function cancel() {
    committedRef.current = true
    setEditing(false)
    setValue(name)
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter') {
      e.preventDefault()
      commit()
    } else if (e.key === 'Escape') {
      e.preventDefault()
      cancel()
    }
  }

  return {
    editing,
    value,
    setValue,
    start,
    commit,
    cancel,
    onKeyDown,
    // Blur commits (tapping elsewhere validates); Escape already canceled
    // by the time blur fires, so this never double-fires after a cancel.
    onBlur: commit,
  }
}
