import { useRef, type PointerEvent as ReactPointerEvent } from 'react'

const DELETE_THRESHOLD_PX = 80
const MAX_SWIPE_PX = 120
const AXIS_LOCK_PX = 8
const SETTLE_TRANSITION = 'transform 240ms cubic-bezier(0.22, 1, 0.36, 1)'

function prefersReducedMotion(): boolean {
  return typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

/**
 * Swipe-left-to-delete for a row or card. Attach `contentRef` to the sliding
 * element and `revealRef` to the red layer behind it: both are updated
 * directly on the DOM (transform/opacity only, one write per frame), so the
 * gesture never triggers React renders or layout while the finger moves.
 * Ignores gestures starting on `data-drag-handle` / `data-no-swipe`, and
 * coexists with `useLongPress` (a still press never crosses the axis-lock
 * threshold).
 */
export function useSwipeToDelete(onDelete: () => void) {
  const contentRef = useRef<HTMLDivElement | null>(null)
  const revealRef = useRef<HTMLDivElement | null>(null)
  const startRef = useRef<{ x: number; y: number } | null>(null)
  const axisRef = useRef<'x' | 'y' | null>(null)
  const lastDxRef = useRef(0)
  const frameRef = useRef(0)
  const reduced = prefersReducedMotion()

  function paint() {
    frameRef.current = 0
    const dx = lastDxRef.current
    if (contentRef.current) contentRef.current.style.transform = `translate3d(${dx}px,0,0)`
    if (revealRef.current) revealRef.current.style.opacity = String(Math.min(1, Math.abs(dx) / DELETE_THRESHOLD_PX))
  }

  function onPointerDown(e: ReactPointerEvent<HTMLElement>) {
    if (!e.isPrimary) return
    if ((e.target as HTMLElement).closest('[data-drag-handle],[data-no-swipe]')) return
    startRef.current = { x: e.clientX, y: e.clientY }
    axisRef.current = null
    lastDxRef.current = 0
  }

  function onPointerMove(e: ReactPointerEvent<HTMLElement>) {
    if (!startRef.current) return
    const dx = e.clientX - startRef.current.x
    const dy = e.clientY - startRef.current.y
    if (!axisRef.current) {
      if (Math.abs(dx) < AXIS_LOCK_PX && Math.abs(dy) < AXIS_LOCK_PX) return
      axisRef.current = Math.abs(dx) > Math.abs(dy) ? 'x' : 'y'
      if (axisRef.current === 'x' && contentRef.current && !reduced) {
        contentRef.current.style.transition = 'none'
        contentRef.current.style.willChange = 'transform'
      }
    }
    if (axisRef.current !== 'x') return
    e.preventDefault()
    lastDxRef.current = Math.max(-MAX_SWIPE_PX, Math.min(0, dx))
    if (!reduced && !frameRef.current) frameRef.current = requestAnimationFrame(paint)
  }

  function endGesture(_e?: ReactPointerEvent<HTMLElement>) {
    if (!startRef.current) return
    const wasHorizontal = axisRef.current === 'x'
    const finalDx = lastDxRef.current
    startRef.current = null
    axisRef.current = null
    lastDxRef.current = 0
    cancelAnimationFrame(frameRef.current)
    frameRef.current = 0

    const el = contentRef.current
    if (el && wasHorizontal && !reduced) {
      el.style.transition = SETTLE_TRANSITION
      el.style.transform = 'translate3d(0,0,0)'
      if (revealRef.current) revealRef.current.style.opacity = '0'
      window.setTimeout(() => {
        el.style.willChange = ''
      }, 300)
    }
    if (wasHorizontal && finalDx <= -DELETE_THRESHOLD_PX) onDelete()
  }

  return {
    contentRef,
    revealRef,
    handlers: { onPointerDown, onPointerMove, onPointerUp: endGesture, onPointerCancel: endGesture },
  }
}
