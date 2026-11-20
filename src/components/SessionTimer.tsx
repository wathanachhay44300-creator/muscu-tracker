import { useElapsedTime } from '../hooks/useElapsedTime'

/** "12:05" or "1:02:05" */
function formatChrono(ms: number): string {
  const total = Math.max(0, Math.floor(ms / 1000))
  const h = Math.floor(total / 3600)
  const m = Math.floor((total % 3600) / 60)
  const s = String(total % 60).padStart(2, '0')
  return h > 0 ? `${h}:${String(m).padStart(2, '0')}:${s}` : `${m}:${s}`
}

/** Live session chrono in a pill (surface background, accent dot). */
export function SessionTimer({ startedAt, label }: { startedAt: number; label: string }) {
  const elapsed = useElapsedTime(startedAt, 1000)
  return (
    <span
      className="flex h-8 shrink-0 items-center gap-1.5 rounded-full border border-line bg-surface px-3"
      role="timer"
      aria-label={label}
    >
      <span className="h-2 w-2 rounded-full bg-accent" aria-hidden="true" />
      <span className="font-numbers text-base font-bold tabular-nums text-ink">{formatChrono(elapsed)}</span>
    </span>
  )
}
