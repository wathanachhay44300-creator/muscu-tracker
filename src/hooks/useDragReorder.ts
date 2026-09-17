import { useEffect, useRef, useState, type CSSProperties, type PointerEvent as ReactPointerEvent } from 'react'

const LONG_PRESS_MS = 150
const MOVE_CANCEL_PX = 8

interface DragState {
  id: number
  startClientY: number
  startTop: number
  height: number
  order: number[]
  index: number
  tops: Map<number, number>
}

interface PendingState {
  id: number
  startX: number
  startY: number
}

/**
 * Drag-to-reorder for a vertical list of variable-height items, using only
 * `transform` so it stays smooth without a DnD library. The dragged item
 * follows the pointer directly (mutated on its DOM node, bypassing React,
 * for zero-lag tracking); every other item shifts by exactly the dragged
 * item's height, in whichever direction makes room, once the dragged
 * item's center crosses that item's center — the same "make room" trick
 * used by most reorderable lists, and one that works regardless of each
 * item's own height since only the gap left by the dragged item moves.
 *
 * The drag only starts from a dedicated handle (an element the caller
 * marks with `data-drag-handle`), after a short hold, so it can't be
 * triggered by taps on the delete button, steppers, or a scroll gesture.
 */
export function useDragReorder(ids: number[], onReorder: (newIds: number[]) => void) {
  const [draggingId, setDraggingId] = useState<number | null>(null)
  const [shifts, setShifts] = useState<Map<number, number>>(new Map())
  const itemRefs = useRef<Map<number, HTMLElement>>(new Map())
  const dragRef = useRef<DragState | null>(null)
  const pendingRef = useRef<PendingState | null>(null)
  const timerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)
  const idsRef = useRef(ids)
  useEffect(() => {
    idsRef.current = ids
  }, [ids])

  function registerRef(id: number, el: HTMLElement | null) {
    if (el) itemRefs.current.set(id, el)
    else itemRefs.current.delete(id)
  }

  function beginDrag(id: number) {
    const container = itemRefs.current.get(id)
    if (!container) return
    const rect = container.getBoundingClientRect()
    const tops = new Map<number, number>()
    for (const [itemId, el] of itemRefs.current) tops.set(itemId, el.getBoundingClientRect().top)
    const pending = pendingRef.current
    dragRef.current = {
      id,
      startClientY: pending?.startY ?? rect.top,
      startTop: rect.top,
      height: rect.height,
      order: [...idsRef.current],
      index: idsRef.current.indexOf(id),
      tops,
    }
    setDraggingId(id)
  }

  function updateShifts(e: { clientY: number }) {
    const drag = dragRef.current
    if (!drag) return
    const deltaY = e.clientY - drag.startClientY
    const el = itemRefs.current.get(drag.id)
    if (el) el.style.transform = `translateY(${deltaY}px) scale(1.03)`

    const draggedCurrentMid = drag.startTop + drag.height / 2 + deltaY
    const newShifts = new Map<number, number>()
    for (const otherId of drag.order) {
      if (otherId === drag.id) continue
      const otherTop = drag.tops.get(otherId)
      const otherEl = itemRefs.current.get(otherId)
      if (otherTop == null || !otherEl) continue
      const otherMid = otherTop + otherEl.getBoundingClientRect().height / 2
      if (otherTop > drag.startTop && draggedCurrentMid > otherMid) {
        newShifts.set(otherId, -drag.height)
      } else if (otherTop < drag.startTop && draggedCurrentMid < otherMid) {
        newShifts.set(otherId, drag.height)
      }
    }
    setShifts(newShifts)
  }

  function finishDrag() {
    const drag = dragRef.current
    if (!drag) return

    let movedUp = 0
    let movedDown = 0
    for (const shift of shifts.values()) {
      if (shift < 0) movedUp++
      else if (shift > 0) movedDown++
    }
    const newIndex = drag.index + movedUp - movedDown

    const el = itemRefs.current.get(drag.id)
    if (el) el.style.transform = ''
    dragRef.current = null
    setDraggingId(null)
    setShifts(new Map())

    if (newIndex !== drag.index) {
      const newOrder = [...drag.order]
      newOrder.splice(drag.index, 1)
      newOrder.splice(newIndex, 0, drag.id)
      onReorder(newOrder)
    }
  }

  function cancelPending() {
    clearTimeout(timerRef.current)
    pendingRef.current = null
  }

  function handlePointerDown(id: number, e: ReactPointerEvent<HTMLElement>) {
    if (!e.isPrimary) return
    e.preventDefault()
    try {
      ;(e.currentTarget as HTMLElement).setPointerCapture(e.pointerId)
    } catch {
      // Some environments (or synthetic events) don't have an active pointer
      // to capture — the drag still works via normal event bubbling.
    }
    pendingRef.current = { id, startX: e.clientX, startY: e.clientY }
    clearTimeout(timerRef.current)
    timerRef.current = setTimeout(() => {
      if (pendingRef.current?.id === id) beginDrag(id)
    }, LONG_PRESS_MS)
  }

  function handlePointerMove(e: ReactPointerEvent<HTMLElement>) {
    if (dragRef.current) {
      e.preventDefault()
      updateShifts(e)
      return
    }
    const pending = pendingRef.current
    if (!pending) return
    const dx = e.clientX - pending.startX
    const dy = e.clientY - pending.startY
    if (Math.hypot(dx, dy) > MOVE_CANCEL_PX) cancelPending()
  }

  function handlePointerUp() {
    cancelPending()
    finishDrag()
  }

  function getRowProps(id: number): {
    isDragging: boolean
    containerProps: { ref: (el: HTMLElement | null) => void; style: CSSProperties }
    handleProps: {
      'data-drag-handle': true
      style: CSSProperties
      onPointerDown: (e: ReactPointerEvent<HTMLElement>) => void
      onPointerMove: (e: ReactPointerEvent<HTMLElement>) => void
      onPointerUp: (e: ReactPointerEvent<HTMLElement>) => void
      onPointerCancel: (e: ReactPointerEvent<HTMLElement>) => void
    }
  } {
    const isDragging = draggingId === id
    const shift = shifts.get(id) ?? 0
    return {
      isDragging,
      containerProps: {
        ref: (el) => registerRef(id, el),
        style: isDragging
          ? { position: 'relative', zIndex: 10 }
          : { position: 'relative', zIndex: 0, transform: `translateY(${shift}px)`, transition: 'transform 200ms ease' },
      },
      handleProps: {
        'data-drag-handle': true,
        style: { touchAction: 'none' },
        onPointerDown: (e) => handlePointerDown(id, e),
        onPointerMove: handlePointerMove,
        onPointerUp: handlePointerUp,
        onPointerCancel: handlePointerUp,
      },
    }
  }

  return { draggingId, getRowProps }
}
