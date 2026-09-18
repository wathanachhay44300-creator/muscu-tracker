import { useEffect, useState } from 'react'

/** Live elapsed time since `startMs`, ticking every `intervalMs` (30s by
 * default — plenty for a "discreet" duration display, no need for per-second
 * precision). Returns 0 when there's no start time yet. */
export function useElapsedTime(startMs: number | null, intervalMs = 30_000): number {
  const [now, setNow] = useState(() => Date.now())

  useEffect(() => {
    if (startMs == null) return
    const id = setInterval(() => setNow(Date.now()), intervalMs)
    return () => clearInterval(id)
  }, [startMs, intervalMs])

  return startMs == null ? 0 : Math.max(0, now - startMs)
}
