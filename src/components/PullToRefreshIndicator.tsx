import type { Ref } from 'react'
import { RefreshIcon } from './Icons'

interface PullToRefreshIndicatorProps {
  indicatorRef: Ref<HTMLDivElement>
  refreshing: boolean
}

/** The little spinner that slides in as the user pulls down, then spins
 * briefly while "refreshing" (see usePullToRefresh for why that's brief).
 * Positioned by transform/opacity from the hook, without re-rendering. */
export function PullToRefreshIndicator({ indicatorRef, refreshing }: PullToRefreshIndicatorProps) {
  return (
    <div
      ref={indicatorRef}
      className="pointer-events-none fixed left-1/2 z-20 flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 bg-surface shadow-md"
      style={{ top: 'calc(env(safe-area-inset-top) + 8px)', opacity: 0, transform: 'translate3d(-50%, -48px, 0)' }}
      aria-hidden="true"
    >
      <RefreshIcon className={`h-5 w-5 text-accent ${refreshing ? 'animate-spin' : ''}`} />
    </div>
  )
}
