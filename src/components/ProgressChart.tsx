import { useState } from 'react'
import { formatDateFr } from '../lib/date'

export interface ChartPoint {
  date: string
  value: number
  /** Highlighted with a star marker — this session set a personal record. */
  isPR?: boolean
}

interface ProgressChartProps {
  points: ChartPoint[]
  /** Appended after each value label, e.g. "kg". */
  unit: string
}

const WIDTH = 320
const HEIGHT = 150
const PAD_X = 10
const PAD_TOP = 22
const PAD_BOTTOM = 24

/** Minimal hand-rolled SVG line chart — no charting library needed for a single series. */
export function ProgressChart({ points, unit }: ProgressChartProps) {
  // Tapped point takes over the floating value label; defaults to the most
  // recent point so there's always something shown at a glance.
  const [selected, setSelected] = useState<number | null>(null)

  if (points.length < 2) return null

  const values = points.map((p) => p.value)
  const minV = Math.min(...values)
  const maxV = Math.max(...values, minV + 1)
  const innerW = WIDTH - PAD_X * 2
  const innerH = HEIGHT - PAD_TOP - PAD_BOTTOM

  const coords = points.map((p, i) => {
    const x = PAD_X + (i / (points.length - 1)) * innerW
    const y = PAD_TOP + innerH - ((p.value - minV) / (maxV - minV)) * innerH
    return { x, y, ...p }
  })

  const path = coords.map((c, i) => `${i === 0 ? 'M' : 'L'}${c.x.toFixed(1)},${c.y.toFixed(1)}`).join(' ')
  const areaPath = `${path} L${coords[coords.length - 1].x.toFixed(1)},${(PAD_TOP + innerH).toFixed(1)} L${coords[0].x.toFixed(1)},${(PAD_TOP + innerH).toFixed(1)} Z`

  const activeIndex = selected ?? coords.length - 1
  const active = coords[activeIndex]
  // Keep the floating label inside the chart: flip it below the point when
  // there isn't enough headroom above, and clamp it away from the edges.
  const labelBelow = active.y < PAD_TOP + 10
  const labelY = labelBelow ? active.y + 16 : active.y - 8
  const labelAnchor = active.x < PAD_X + 24 ? 'start' : active.x > WIDTH - PAD_X - 24 ? 'end' : 'middle'

  return (
    <svg viewBox={`0 0 ${WIDTH} ${HEIGHT}`} className="w-full touch-manipulation" role="img" aria-label="Graphique de progression">
      <path d={areaPath} fill="var(--color-brand-50)" />
      <path
        d={path}
        fill="none"
        stroke="var(--color-brand-600)"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {coords.map((c, i) => (
        <g
          key={i}
          onClick={() => setSelected(i)}
          className="cursor-pointer"
          role="button"
          aria-label={`${formatDateFr(c.date, { withYear: false })} : ${formatVal(c.value)} ${unit}`}
        >
          {/* Generous invisible hit target — the visible dot is tiny on a phone screen. */}
          <circle cx={c.x} cy={c.y} r={12} fill="transparent" />
          {c.isPR ? (
            <path
              d={starPath(c.x, c.y, i === activeIndex ? 6.5 : 5.5)}
              fill="var(--color-amber-500)"
              stroke="var(--color-surface)"
              strokeWidth={1.2}
              strokeLinejoin="round"
            />
          ) : (
            <circle
              cx={c.x}
              cy={c.y}
              r={i === activeIndex ? 4 : 2.5}
              fill={i === activeIndex ? 'var(--color-brand-600)' : 'var(--color-surface)'}
              stroke="var(--color-brand-600)"
              strokeWidth="1.5"
            />
          )}
        </g>
      ))}
      <text
        x={active.x}
        y={labelY}
        fontSize="10"
        fill="var(--color-brand-600)"
        fontWeight="700"
        textAnchor={labelAnchor}
      >
        {formatVal(active.value)} {unit}
      </text>
      <text x={PAD_X} y={HEIGHT - 6} fontSize="9" fill="var(--color-slate-400)">
        {formatDateFr(points[0].date, { withYear: false })}
      </text>
      <text x={WIDTH - PAD_X} y={HEIGHT - 6} fontSize="9" fill="var(--color-slate-400)" textAnchor="end">
        {formatDateFr(points[points.length - 1].date, { withYear: false })}
      </text>
    </svg>
  )
}

function formatVal(n: number): string {
  return Number.isInteger(n) ? String(n) : n.toFixed(1)
}

/** SVG path for a 5-point star centered at (cx, cy) with outer radius r. */
function starPath(cx: number, cy: number, r: number): string {
  const inner = r * 0.42
  const pts: string[] = []
  for (let i = 0; i < 10; i++) {
    const angle = (Math.PI / 5) * i - Math.PI / 2
    const radius = i % 2 === 0 ? r : inner
    const x = cx + radius * Math.cos(angle)
    const y = cy + radius * Math.sin(angle)
    pts.push(`${i === 0 ? 'M' : 'L'}${x.toFixed(1)},${y.toFixed(1)}`)
  }
  return pts.join(' ') + ' Z'
}
