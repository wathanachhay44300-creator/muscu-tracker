import { formatDateFr } from '../lib/date'

export interface ChartPoint {
  date: string
  value: number
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

  const last = coords[coords.length - 1]

  return (
    <svg viewBox={`0 0 ${WIDTH} ${HEIGHT}`} className="w-full" role="img" aria-label="Graphique de progression">
      <text x={PAD_X} y={12} fontSize="10" fill="var(--color-slate-400)" fontWeight="600">
        {formatVal(maxV)} {unit}
      </text>
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
        <circle
          key={i}
          cx={c.x}
          cy={c.y}
          r={i === coords.length - 1 ? 3.5 : 2.5}
          fill={i === coords.length - 1 ? 'var(--color-brand-600)' : 'var(--color-surface)'}
          stroke="var(--color-brand-600)"
          strokeWidth="1.5"
        />
      ))}
      <text x={last.x} y={last.y - 8} fontSize="10" fill="var(--color-brand-600)" fontWeight="700" textAnchor="end">
        {formatVal(last.value)} {unit}
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
