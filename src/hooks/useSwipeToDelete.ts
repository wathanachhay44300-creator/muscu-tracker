import { useRef, useState, type CSSProperties, type PointerEvent as ReactPointerEvent } from 'react'

const DELETE_THRESHOLD_PX = 80
const MAX_SWIPE_PX = 120
const AXIS_LOCK_PX = 8

function prefersReducedMotion(): boolean {
  return typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

/**
 * Swipe-left-to-delete for a row, revealing a red background behind it as
 * it slides. Left as a plain hook (not a component) so the caller controls
 * exactly how the reveal layer looks. Ignores gestures starting on
 * `data-drag-handle` or `data-no-swipe` (steppers, inputs…) so it never
 * fights with those controls, and coexists with `useLongPress` on the same
 * element — a still press never moves past the axis-lock threshold, so it
 * never engages the swipe, and vice versa.
 */
export function useSwipeToDelete(onDelete: () => void) {
  const [dragX, setDragX] = useState(0)
  const [dragging, setDragging] = useState(false)
  const startRef = useRef<{ x: number; y: number } | null>(null)
  const axisRef = useRef<'x' | 'y' | null>(null)
  const lastDxRef = useRef(0)
  const reduced = prefersReducedMotion()

  function onPointerDown(e: ReactPointerEvent<HTMLElement>) {
    if (!e.isPrimary) return
    if ((e.target as HTMLElement).closest('[data-drag-handle],[data-no-swipe]')) return
    startRef.current = { x: e.clientX, y: e.clientY }
    axisRef.current = null
  }

  function onPointerMove(e: ReactPointerEvent<HTMLElement>) {
    if (!startRef.current) return
    const dx = e.clientX - startRef.current.x
    const dy = e.clientY - startRef.current.y
    if (!axisRef.current) {
      if (Math.abs(dx) < AXIS_LOCK_PX && Math.abs(dy) < AXIS_LOCK_PX) return
      axisRef.current = Math.abs(dx) > Math.abs(dy) ? 'x' : 'y'
      if (axisRef.current === 'x') setDragging(true)
    }
    if (axisRef.current !== 'x') return
    e.preventDefault()
    const clamped = Math.max(-MAX_SWIPE_PX, Math.min(0, dx))
    lastDxRef.current = clamped
    setDragX(clamped)
  }

  function endGesture(_e?: ReactPointerEvent<HTMLElement>) {
    if (!startRef.current) return
    const wasHorizontal = axisRef.current === 'x'
    const finalDx = lastDxRef.current
    startRef.current = null
    axisRef.current = null
    lastDxRef.current = 0
    setDragging(false)
    setDragX(0)
    if (wasHorizontal && finalDx <= -DELETE_THRESHOLD_PX) onDelete()
  }

  const handlers = {
    onPointerDown,
    onPointerMove,
    onPointerUp: endGesture,
    onPointerCancel: endGesture,
  }

  const style: CSSProperties = reduced
    ? {}
    : { transform: `translateX(${dragX}px)`, transition: dragging ? 'none' : 'transform 200ms ease' }

  const revealProgress = reduced ? 0 : Math.min(1, Math.abs(dragX) / DELETE_THRESHOLD_PX)

  return { handlers, style, revealProgress }
}
