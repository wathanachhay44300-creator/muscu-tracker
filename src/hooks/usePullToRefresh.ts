import { useRef, useState, type PointerEvent as ReactPointerEvent } from 'react'

const PULL_THRESHOLD_PX = 64
const MAX_PULL_PX = 90
const RESISTANCE = 0.5
const SETTLE_PX = 48

/**
 * Classic pull-to-refresh: only engages when the page is already scrolled
 * to the top (so it never fights normal scrolling), and only once the
 * gesture is confirmed vertical. There's no server to refetch from — every
 * view here is a live Dexie query and is always current — so "refreshing"
 * is an honest, brief reassurance animation rather than an actual refetch;
 * an optional `onRefresh` still runs if the caller has something to do.
 */
export function usePullToRefresh(onRefresh?: () => void | Promise<void>) {
  // The pull distance is written straight to the indicator's DOM node
  // (transform/opacity only), so dragging never re-renders the screen.
  const indicatorRef = useRef<HTMLDivElement>(null)
  const [refreshing, setRefreshing] = useState(false)
  const startRef = useRef<{ x: number; y: number } | null>(null)
  const axisRef = useRef<'x' | 'y' | null>(null)
  const lastDyRef = useRef(0)

  function paint(y: number, animate: boolean) {
    const el = indicatorRef.current
    if (!el) return
    const progress = Math.min(1, y / SETTLE_PX)
    el.style.transition = animate ? 'transform 200ms cubic-bezier(0.22, 1, 0.36, 1), opacity 200ms ease' : 'none'
    el.style.transform = `translate3d(-50%, ${y - 48}px, 0)`
    el.style.opacity = String(progress)
    const icon = el.firstElementChild as HTMLElement | null
    if (icon) icon.style.transform = `rotate(${progress * 180}deg)`
  }

  function onPointerDown(e: ReactPointerEvent<HTMLElement>) {
    if (refreshing || !e.isPrimary) return
    if ((e.target as HTMLElement).closest('[data-drag-handle],[data-no-swipe],[data-swipe-to-delete]')) return
    if (window.scrollY > 0) return
    startRef.current = { x: e.clientX, y: e.clientY }
    axisRef.current = null
  }

  function onPointerMove(e: ReactPointerEvent<HTMLElement>) {
    if (refreshing || !startRef.current) return
    const dx = e.clientX - startRef.current.x
    const dy = e.clientY - startRef.current.y
    if (!axisRef.current) {
      if (Math.abs(dx) < 8 && Math.abs(dy) < 8) return
      axisRef.current = Math.abs(dy) > Math.abs(dx) ? 'y' : 'x'
    }
    if (axisRef.current !== 'y' || dy <= 0) return
    e.preventDefault()
    lastDyRef.current = dy
    paint(Math.min(MAX_PULL_PX, dy * RESISTANCE), false)
  }

  async function endGesture() {
    if (!startRef.current) return
    const wasVertical = axisRef.current === 'y'
    const finalDy = lastDyRef.current
    startRef.current = null
    axisRef.current = null
    lastDyRef.current = 0

    if (wasVertical && finalDy >= PULL_THRESHOLD_PX) {
      setRefreshing(true)
      paint(SETTLE_PX, true)
      await Promise.all([onRefresh?.(), new Promise((resolve) => setTimeout(resolve, 500))])
      setRefreshing(false)
    }
    paint(0, true)
  }

  return {
    indicatorRef,
    refreshing,
    handlers: {
      onPointerDown,
      onPointerMove,
      onPointerUp: endGesture,
      onPointerCancel: endGesture,
    },
  }
}
