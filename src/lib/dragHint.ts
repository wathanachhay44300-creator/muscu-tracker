const KEY = 'muscu-tracker:ruler-hint'
/** The hint shows during the first sessions, until hidden by the user. */
const MAX_SESSIONS = 5

function read(): number {
  try {
    const v = localStorage.getItem(KEY)
    if (v === 'off') return Infinity
    return Number(v) || 0
  } catch {
    return Infinity
  }
}

/** Counts one more session-mode opening; returns whether the hint should still show. */
export function takeDragHint(): boolean {
  const seen = read()
  if (seen >= MAX_SESSIONS) return false
  try {
    localStorage.setItem(KEY, String(seen + 1))
  } catch {
    // ignore
  }
  return true
}

export function dismissDragHint(): void {
  try {
    localStorage.setItem(KEY, 'off')
  } catch {
    // ignore
  }
}
