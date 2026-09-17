import { useRef, useState, type CSSProperties, type PointerEvent as ReactPointerEvent } from 'react'

const SWIPE_THRESHOLD_PX = 60
const MAX_DRAG_PX = 120
const AXIS_LOCK_PX = 8

function prefersReducedMotion(): boolean {
  return typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

interface SwipeNavOptions {
  /** e.g. next day / next month. */
  onSwipeLeft: () => void
  /** e.g. previous day / previous month. */
  onSwipeRight: () => void
  /** Set while an unrelated gesture (like reordering a list) owns the pointer. */
  disabled?: boolean
}

/**
 * Horizontal swipe-to-navigate for paged content (day/month views), with a
 * live drag-follow while the finger is down and a spring-back if the swipe
 * doesn't clear the threshold. Ignores gestures starting on an element
 * marked `data-drag-handle`, so it never fights with a drag-to-reorder
 * list nested inside the swipeable area. Skips the live-follow transform
 * under `prefers-reduced-motion` — the swipe still navigates, it just
 * doesn't visually drag.
 */
export function useSwipeNav({ onSwipeLeft, onSwipeRight, disabled }: SwipeNavOptions) {
  const [dragX, setDragX] = useState(0)
  const [dragging, setDragging] = useState(false)
  const startRef = useRef<{ x: number; y: number } | null>(null)
  const axisRef = useRef<'x' | 'y' | null>(null)
  // The authoritative offset for the threshold decision on release — a ref
  // rather than the `dragX` state, so it's correct even if several pointer
  // events land in the same batch (no stale-closure read) and even under
  // reduced motion (where `dragX` itself is never updated, since there's no
  // visual drag to show).
  const lastDxRef = useRef(0)
  const reduced = prefersReducedMotion()

  function onPointerDown(e: ReactPointerEvent<HTMLElement>) {
    if (disabled || !e.isPrimary) return
    if ((e.target as HTMLElement).closest('[data-drag-handle]')) return
    startRef.current = { x: e.clientX, y: e.clientY }
    axisRef.current = null
  }

  function onPointerMove(e: ReactPointerEvent<HTMLElement>) {
    if (disabled || !startRef.current) return
    const dx = e.clientX - startRef.current.x
    const dy = e.clientY - startRef.current.y
    if (!axisRef.current) {
      if (Math.abs(dx) < AXIS_LOCK_PX && Math.abs(dy) < AXIS_LOCK_PX) return
      axisRef.current = Math.abs(dx) > Math.abs(dy) ? 'x' : 'y'
      if (axisRef.current === 'x') setDragging(true)
    }
    if (axisRef.current !== 'x') return
    e.preventDefault()
    const clamped = Math.max(-MAX_DRAG_PX, Math.min(MAX_DRAG_PX, dx))
    lastDxRef.current = clamped
    if (!reduced) setDragX(clamped)
  }

  function endGesture() {
    if (!startRef.current) return
    const wasHorizontal = axisRef.current === 'x'
    const finalDx = lastDxRef.current
    startRef.current = null
    axisRef.current = null
    lastDxRef.current = 0
    setDragging(false)
    setDragX(0)
    if (!wasHorizontal || disabled) return
    if (finalDx <= -SWIPE_THRESHOLD_PX) onSwipeLeft()
    else if (finalDx >= SWIPE_THRESHOLD_PX) onSwipeRight()
  }

  const handlers = {
    onPointerDown,
    onPointerMove,
    onPointerUp: endGesture,
    onPointerCancel: endGesture,
  }

  const style: CSSProperties =
    dragging && !reduced
      ? { transform: `translateX(${dragX}px)`, transition: 'none' }
      : { transform: 'translateX(0)', transition: dragging ? 'none' : 'transform 200ms ease' }

  return { handlers, style, reducedMotion: reduced }
}

/** Which side new content should slide in from, for `getSlideClass`. */
export type SwipeDirection = 'left' | 'right' | null

/** Picks the enter-animation class for content after a swipe/arrow nav. */
export function getSlideClass(direction: SwipeDirection, reducedMotion: boolean): string {
  if (reducedMotion || !direction) return 'animate-fade-in'
  return direction === 'left' ? 'animate-slide-in-right' : 'animate-slide-in-left'
}
