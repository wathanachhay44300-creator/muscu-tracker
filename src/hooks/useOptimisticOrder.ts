import { useEffect, useRef, useState } from 'react'

/**
 * Tracks a locally-controlled display order for a list of ids, kept stable
 * across re-renders from the underlying live query — except when the SET
 * of ids actually changes (an item was added or removed), in which case it
 * re-syncs from the source. This lets a drag-reorder apply instantly
 * without waiting for the DB write to round-trip through the live query,
 * and without that round-trip snapping the order back mid-animation.
 */
export function useOptimisticOrder(sourceIds: number[]): [number[], (next: number[]) => void] {
  const [order, setOrder] = useState(sourceIds)
  const signature = [...sourceIds].sort((a, b) => a - b).join(',')
  const prevSignature = useRef<string | null>(null)

  useEffect(() => {
    if (prevSignature.current === signature) return
    prevSignature.current = signature
    setOrder(sourceIds)
    // Re-sync only when the *set* of ids changes (see signature above) — not on every render.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [signature])

  return [order, setOrder]
}
