import { useElapsedTime } from '../hooks/useElapsedTime'
import { formatDuration } from '../lib/date'
import { TimerIcon } from './Icons'

/** Discreet live "time elapsed" readout, shown once the first set of an
 * in-progress session has been logged. */
export function SessionTimer({ startedAt }: { startedAt: number }) {
  const elapsed = useElapsedTime(startedAt)
  return (
    <p className="mb-3 flex items-center justify-center gap-1 text-xs font-medium text-slate-400">
      <TimerIcon className="h-3.5 w-3.5" />
      {formatDuration(elapsed)}
    </p>
  )
}
