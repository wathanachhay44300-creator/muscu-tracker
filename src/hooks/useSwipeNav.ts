import { useRef, type PointerEvent as ReactPointerEvent } from 'react'

const SWIPE_THRESHOLD_PX = 60
const MAX_DRAG_PX = 140
const AXIS_LOCK_PX = 8
/** Natural release: fast start, gentle stop (no abrupt halt). */
const SETTLE_TRANSITION = 'transform 260ms cubic-bezier(0.22, 1, 0.36, 1)'

function prefersReducedMotion(): boolean {
  return typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

interface SwipeNavOptions {
  /** e.g. next day / next month. */
  onSwipeLeft: () => void
  /** e.g. previous day / previous month. */
  onSwipeRight: () => void
  disabled?: boolean
}

/**
 * Horizontal swipe-to-navigate for paged content (day/month views).
 *
 * Smoothness: the finger-follow writes `transform` straight onto the DOM
 * node (attach `ref` to the swiped element) — no React state, no re-render
 * and no layout work per pointermove, so it tracks the finger at the
 * display's full refresh rate (90/120Hz). Writes are coalesced to one per
 * animation frame. On release a CSS transition with an ease-out curve
 * settles it back. Ignores gestures starting on `[data-drag-handle]` /
 * `[data-swipe-to-delete]` so it never fights nested gestures; skips the
 * visual follow under `prefers-reduced-motion` (navigation still works).
 */
export function useSwipeNav({ onSwipeLeft, onSwipeRight, disabled }: SwipeNavOptions) {
  const ref = useRef<HTMLDivElement | null>(null)
  const startRef = useRef<{ x: number; y: number } | null>(null)
  const axisRef = useRef<'x' | 'y' | null>(null)
  const lastDxRef = useRef(0)
  const frameRef = useRef(0)
  const reduced = prefersReducedMotion()

  function paint() {
    frameRef.current = 0
    const el = ref.current
    if (el) el.style.transform = `translate3d(${lastDxRef.current}px,0,0)`
  }

  function onPointerDown(e: ReactPointerEvent<HTMLElement>) {
    if (disabled || !e.isPrimary) return
    if ((e.target as HTMLElement).closest('[data-drag-handle],[data-swipe-to-delete]')) return
    startRef.current = { x: e.clientX, y: e.clientY }
    axisRef.current = null
    lastDxRef.current = 0
  }

  function onPointerMove(e: ReactPointerEvent<HTMLElement>) {
    if (disabled || !startRef.current) return
    const dx = e.clientX - startRef.current.x
    const dy = e.clientY - startRef.current.y
    if (!axisRef.current) {
      if (Math.abs(dx) < AXIS_LOCK_PX && Math.abs(dy) < AXIS_LOCK_PX) return
      axisRef.current = Math.abs(dx) > Math.abs(dy) ? 'x' : 'y'
      if (axisRef.current === 'x' && ref.current && !reduced) {
        ref.current.style.transition = 'none'
        ref.current.style.willChange = 'transform'
      }
    }
    if (axisRef.current !== 'x') return
    e.preventDefault()
    lastDxRef.current = Math.max(-MAX_DRAG_PX, Math.min(MAX_DRAG_PX, dx))
    if (!reduced && !frameRef.current) frameRef.current = requestAnimationFrame(paint)
  }

  function endGesture() {
    if (!startRef.current) return
    const wasHorizontal = axisRef.current === 'x'
    const finalDx = lastDxRef.current
    startRef.current = null
    axisRef.current = null
    lastDxRef.current = 0
    cancelAnimationFrame(frameRef.current)
    frameRef.current = 0

    const el = ref.current
    if (el && wasHorizontal && !reduced) {
      el.style.transition = SETTLE_TRANSITION
      el.style.transform = 'translate3d(0,0,0)'
      const clear = () => {
        el.style.willChange = ''
        el.removeEventListener('transitionend', clear)
      }
      el.addEventListener('transitionend', clear)
    }
    if (!wasHorizontal || disabled) return
    if (finalDx <= -SWIPE_THRESHOLD_PX) onSwipeLeft()
    else if (finalDx >= SWIPE_THRESHOLD_PX) onSwipeRight()
  }

  return {
    ref,
    handlers: { onPointerDown, onPointerMove, onPointerUp: endGesture, onPointerCancel: endGesture },
    reducedMotion: reduced,
  }
}

/** Which side new content should slide in from, for `getSlideClass`. */
export type SwipeDirection = 'left' | 'right' | null

/** Picks the enter-animation class for content after a swipe/arrow nav. */
export function getSlideClass(direction: SwipeDirection, reducedMotion: boolean): string {
  if (reducedMotion || !direction) return 'animate-fade-in'
  return direction === 'left' ? 'animate-slide-in-right' : 'animate-slide-in-left'
}
