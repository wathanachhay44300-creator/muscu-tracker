import { useEffect, useLayoutEffect, useRef, type KeyboardEvent, type PointerEvent as ReactPointerEvent } from 'react'
import { formatDecimal } from '../../i18n'
import { hapticTick } from '../../lib/haptics'

/** Distance between two graduations, in px. */
const GAP = 13
/** No scroll event for this long = the ruler has come to rest. */
const SETTLE_MS = 140

interface ScrollRulerProps {
  value: number
  /** Value of one graduation (e.g. 2.5 kg, 1 rep). */
  step: number
  max: number
  /** A taller, labelled graduation every `majorEvery` units (10 kg, 5 reps). */
  majorEvery: number
  /** Accessible name, e.g. "Poids en kg". */
  label: string
  valueText: string
  haptics: boolean
  /** Live value while scrolling, on every graduation crossed. */
  onChange: (value: number, dir: 1 | -1) => void
  /** Final value once the ruler has stopped. */
  onSettle: (value: number) => void
}

function round2(n: number): number {
  return Math.round(n * 100) / 100
}

/**
 * Horizontal graduated ruler scrolled under a fixed centre indicator. It
 * relies on the browser's own scrolling (native momentum on iPhone) and
 * scroll-snap to land on a graduation; the value is derived from the scroll
 * position. Graduations are drawn with background gradients, so only one
 * light snap anchor per graduation and a few labels are created.
 * Pushing the ruler left brings higher values under the indicator.
 */
export function ScrollRuler({ value, step, max, majorEvery, label, valueText, haptics, onChange, onSettle }: ScrollRulerProps) {
  const scrollerRef = useRef<HTMLDivElement>(null)
  const count = Math.max(1, Math.round(max / step))
  const perMajor = Math.max(1, Math.round(majorEvery / step))
  const trackWidth = count * GAP

  /** scrollLeft we set ourselves: its scroll event isn't the user's. */
  const expectedLeft = useRef<number | null>(null)
  const interacting = useRef(false)
  const offGrid = useRef(false)
  const lastIndex = useRef(0)
  const settleTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)
  const mouseDrag = useRef<{ id: number; x: number; left: number } | null>(null)
  const latest = useRef({ step, count, onChange, onSettle, haptics })
  useEffect(() => {
    latest.current = { step, count, onChange, onSettle, haptics }
  })
  useEffect(() => () => clearTimeout(settleTimer.current), [])

  // Place the ruler on the value, unless the user is moving it (that would kill the momentum).
  useLayoutEffect(() => {
    const el = scrollerRef.current
    if (!el || interacting.current) return
    const exact = Math.min(Math.max(value, 0), max) / step
    const onGrid = Math.abs(exact - Math.round(exact)) < 1e-6
    // A typed value between two graduations (63 kg with a 2.5 step) stays where it is:
    // snapping is switched off until the user scrolls again.
    offGrid.current = !onGrid
    el.style.scrollSnapType = onGrid ? 'x mandatory' : 'none'
    const left = exact * GAP
    expectedLeft.current = left
    el.scrollLeft = left
    lastIndex.current = Math.round(exact)
  }, [value, step, max])

  function settle() {
    const el = scrollerRef.current
    interacting.current = false
    if (!el) return
    const { step, count, onChange, onSettle } = latest.current
    const index = Math.min(Math.max(Math.round(el.scrollLeft / GAP), 0), count)
    if (index !== lastIndex.current) {
      onChange(round2(index * step), index > lastIndex.current ? 1 : -1)
      lastIndex.current = index
    }
    onSettle(round2(index * step))
  }

  function handleScroll() {
    const el = scrollerRef.current
    if (!el) return
    const left = el.scrollLeft
    if (expectedLeft.current != null && Math.abs(left - expectedLeft.current) < 1.5) return
    expectedLeft.current = null
    interacting.current = true
    if (offGrid.current) {
      offGrid.current = false
      el.style.scrollSnapType = 'x mandatory'
    }
    const { step, count, onChange, haptics } = latest.current
    const index = Math.min(Math.max(Math.round(left / GAP), 0), count)
    if (index !== lastIndex.current) {
      const dir = index > lastIndex.current ? 1 : -1
      lastIndex.current = index
      onChange(round2(index * step), dir)
      hapticTick(haptics)
    }
    clearTimeout(settleTimer.current)
    settleTimer.current = setTimeout(settle, SETTLE_MS)
  }

  // Desktop: a vertical mouse wheel moves the ruler (trackpads scroll it natively).
  useEffect(() => {
    const el = scrollerRef.current
    if (!el) return
    const onWheel = (e: WheelEvent) => {
      if (Math.abs(e.deltaY) <= Math.abs(e.deltaX)) return
      e.preventDefault()
      el.scrollBy({ left: e.deltaY })
    }
    el.addEventListener('wheel', onWheel, { passive: false })
    return () => el.removeEventListener('wheel', onWheel)
  }, [])

  // Desktop: drag with the mouse (touch uses native scrolling).
  function onPointerDown(e: ReactPointerEvent<HTMLDivElement>) {
    if (e.pointerType !== 'mouse' || e.button !== 0) return
    const el = scrollerRef.current
    if (!el) return
    mouseDrag.current = { id: e.pointerId, x: e.clientX, left: el.scrollLeft }
    el.setPointerCapture(e.pointerId)
  }
  function onPointerMove(e: ReactPointerEvent<HTMLDivElement>) {
    const drag = mouseDrag.current
    const el = scrollerRef.current
    if (!drag || !el || e.pointerId !== drag.id) return
    el.scrollLeft = drag.left - (e.clientX - drag.x)
  }
  function onPointerUp(e: ReactPointerEvent<HTMLDivElement>) {
    if (mouseDrag.current?.id === e.pointerId) mouseDrag.current = null
  }

  function onKeyDown(e: KeyboardEvent<HTMLDivElement>) {
    const delta = e.key === 'ArrowRight' || e.key === 'ArrowUp' ? 1 : e.key === 'ArrowLeft' || e.key === 'ArrowDown' ? -1 : 0
    if (!delta) return
    e.preventDefault()
    const base = Math.round(value / step)
    const next = round2(Math.min(Math.max(base + delta, 0), count) * step)
    if (next === value) return
    onChange(next, delta)
    onSettle(next)
  }

  // Labels at least ~48 px apart, so a 5 kg step doesn't crowd them.
  const perLabel = perMajor * Math.ceil(48 / (perMajor * GAP))
  const majors: number[] = []
  for (let i = 0; i <= count; i += perLabel) majors.push(i)

  return (
    <div
      role="slider"
      tabIndex={0}
      aria-label={label}
      aria-valuemin={0}
      aria-valuemax={max}
      aria-valuenow={value}
      aria-valuetext={valueText}
      onKeyDown={onKeyDown}
      data-no-swipe
      data-no-long-press
      className="relative mx-auto h-11 w-full select-none rounded-lg outline-none focus-visible:ring-2 focus-visible:ring-accent"
      style={{ WebkitTouchCallout: 'none', WebkitUserSelect: 'none' }}
    >
      <div
        ref={scrollerRef}
        onScroll={handleScroll}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
        className="flex h-full cursor-ew-resize overflow-x-auto overflow-y-hidden [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        style={{
          scrollSnapType: 'x mandatory',
          touchAction: 'pan-x pan-y',
          overscrollBehaviorX: 'contain',
          maskImage: 'linear-gradient(to right, transparent, #000 22%, #000 78%, transparent)',
          WebkitMaskImage: 'linear-gradient(to right, transparent, #000 22%, #000 78%, transparent)',
        }}
      >
        {/* Half-width spacers: 0 and the maximum can both reach the centre. */}
        <div className="shrink-0 basis-1/2" aria-hidden="true" />
        <div
          className="relative h-full shrink-0"
          aria-hidden="true"
          style={{
            width: trackWidth + 2,
            backgroundImage:
              'linear-gradient(to right, var(--text-muted) 2px, transparent 2px), linear-gradient(to right, var(--text-faint) 1px, transparent 1px)',
            backgroundSize: `${GAP * perMajor}px 20px, ${GAP}px 12px`,
            backgroundRepeat: 'repeat-x, repeat-x',
            backgroundPosition: '0 2px, 0 6px',
          }}
        >
          {Array.from({ length: count + 1 }, (_, i) => (
            <span
              key={i}
              className="absolute top-0 h-px w-0.5"
              style={{ left: i * GAP - 0.5, scrollSnapAlign: 'center' }}
            />
          ))}
          {majors.map((i) => (
            <span
              key={`m${i}`}
              className="font-numbers absolute top-[24px] -translate-x-1/2 text-[11px] font-semibold leading-none text-muted"
              style={{ left: i * GAP + 1 }}
            >
              {formatDecimal(round2(i * step))}
            </span>
          ))}
        </div>
        <div className="shrink-0 basis-1/2" aria-hidden="true" />
      </div>
      {/* Fixed centre indicator */}
      <span
        aria-hidden="true"
        className="pointer-events-none absolute left-1/2 top-0 h-[26px] w-[3px] -translate-x-1/2 rounded-full bg-accent"
      />
    </div>
  )
}
