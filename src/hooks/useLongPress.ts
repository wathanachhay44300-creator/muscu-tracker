import { useRef, type PointerEvent as ReactPointerEvent } from 'react'

const LONG_PRESS_MS = 450
const MOVE_CANCEL_PX = 10

/**
 * Opens a context menu on a sustained press over a "clear" part of an
 * element — never over its drag handle (`data-drag-handle`) or any control
 * marked `data-no-long-press` (delete button, steppers, inputs…), and
 * canceled outright if the pointer moves more than a few pixels, so it
 * never fires mid-scroll or mid-swipe. Swallows the synthetic click that
 * browsers fire right after the pointer lifts, so a long-press on a link
 * (e.g. an exercise name) opens the menu instead of also navigating.
 */
export function useLongPress(onLongPress: () => void, disabled = false) {
  const timerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)
  const startRef = useRef<{ x: number; y: number } | null>(null)
  const firedRef = useRef(false)

  function clear() {
    clearTimeout(timerRef.current)
    startRef.current = null
  }

  function onPointerDown(e: ReactPointerEvent<HTMLElement>) {
    if (disabled || !e.isPrimary) return
    if ((e.target as HTMLElement).closest('[data-drag-handle],[data-no-long-press]')) return
    startRef.current = { x: e.clientX, y: e.clientY }
    clearTimeout(timerRef.current)
    timerRef.current = setTimeout(() => {
      firedRef.current = true
      onLongPress()
    }, LONG_PRESS_MS)
  }

  function onPointerMove(e: ReactPointerEvent<HTMLElement>) {
    if (!startRef.current) return
    const dx = e.clientX - startRef.current.x
    const dy = e.clientY - startRef.current.y
    if (Math.hypot(dx, dy) > MOVE_CANCEL_PX) clear()
  }

  function onPointerUp(_e?: ReactPointerEvent<HTMLElement>) {
    clear()
  }

  function onClickCapture(e: React.MouseEvent<HTMLElement>) {
    if (firedRef.current) {
      e.preventDefault()
      e.stopPropagation()
      firedRef.current = false
    }
  }

  // Long-press fires `contextmenu` on some browsers (and Android): the app's own menu replaces it.
  function onContextMenu(e: React.MouseEvent<HTMLElement>) {
    e.preventDefault()
  }

  return {
    onContextMenu,
    onPointerDown,
    onPointerMove,
    onPointerUp,
    onPointerCancel: onPointerUp,
    onClickCapture,
  }
}
