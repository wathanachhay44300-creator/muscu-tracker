import { RefreshIcon } from './Icons'

interface PullToRefreshIndicatorProps {
  pullY: number
  refreshing: boolean
}

/** The little spinner that grows in as the user pulls down, then spins
 * briefly while "refreshing" (see usePullToRefresh for why that's brief). */
export function PullToRefreshIndicator({ pullY, refreshing }: PullToRefreshIndicatorProps) {
  if (pullY <= 0 && !refreshing) return null
  const progress = Math.min(1, pullY / 48)

  return (
    <div
      className="flex items-center justify-center overflow-hidden"
      style={{ height: pullY, transition: refreshing ? 'height 150ms ease' : 'none' }}
      aria-hidden="true"
    >
      <RefreshIcon
        className={`h-5 w-5 text-accent ${refreshing ? 'animate-spin' : ''}`}
        style={{ opacity: progress, transform: refreshing ? undefined : `rotate(${progress * 180}deg)` }}
      />
    </div>
  )
}
