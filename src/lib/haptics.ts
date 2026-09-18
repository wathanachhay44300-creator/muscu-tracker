/**
 * Thin wrapper around the Vibration API. Every call is a no-op when the
 * device doesn't support it (most desktop browsers) or when the user has
 * turned haptics off — callers don't need to check either themselves.
 */
function vibrate(pattern: number | number[]): void {
  if (typeof navigator === 'undefined' || !navigator.vibrate) return
  navigator.vibrate(pattern)
}

/** A set was added / a small action confirmed. */
export function hapticLight(enabled: boolean): void {
  if (enabled) vibrate(10)
}

/** A long-press opened a menu — slightly more present than `hapticLight`. */
export function hapticMenuOpen(enabled: boolean): void {
  if (enabled) vibrate(15)
}

/** A personal record was just broken — the one moment worth a stronger buzz. */
export function hapticSuccess(enabled: boolean): void {
  if (enabled) vibrate([20, 40, 20])
}
