import { useEffect, useRef, useState } from 'react'

function prefersReducedMotion(): boolean {
  return typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

/**
 * Animates a number counting up from 0 to `target` over `duration` ms,
 * easing out — used for the session-summary stat tiles. Snaps straight to
 * `target` (no animation) when the user prefers reduced motion.
 */
export function useCountUp(target: number, duration = 700): number {
  const [value, setValue] = useState(() => (prefersReducedMotion() ? target : 0))
  const frameRef = useRef<number>(0)

  useEffect(() => {
    if (prefersReducedMotion()) {
      setValue(target)
      return
    }

    const start = performance.now()
    function tick(now: number) {
      const elapsed = now - start
      const t = Math.min(1, elapsed / duration)
      const eased = 1 - (1 - t) * (1 - t)
      setValue(target * eased)
      if (t < 1) frameRef.current = requestAnimationFrame(tick)
    }
    frameRef.current = requestAnimationFrame(tick)

    return () => cancelAnimationFrame(frameRef.current)
    // Re-run only when the target itself changes — not on every render.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [target, duration])

  return value
}
