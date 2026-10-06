import { useMemo } from 'react'
import { formatDateFr } from '../lib/date'
import { eachDay, formatKg, trailingWeightAverage, type DayEntry } from '../lib/tracking'

const W = 340
const H = 176
const PAD_L = 38
const PAD_R = 10
const PAD_T = 12
const PAD_B = 24

interface WeightChartProps {
  byDate: Map<string, DayEntry>
  start: string
  end: string
  /** Called with the date of the weigh-in nearest to a tap. */
  onPick: (date: string) => void
}

/**
 * Body-weight chart: raw weigh-ins as dots, 7-day average as a line (weight
 * jumps around with water and meals, the average shows the real direction).
 * Tapping near a dot opens that weigh-in for editing.
 */
export function WeightChart({ byDate, start, end, onPick }: WeightChartProps) {
  const model = useMemo(() => {
    const days = eachDay(start, end)
    const n = days.length
    const innerW = W - PAD_L - PAD_R
    const innerH = H - PAD_T - PAD_B
    const x = (i: number) => PAD_L + (n === 1 ? 0.5 : i / (n - 1)) * innerW

    const raw: { i: number; date: string; v: number }[] = []
    const smooth: { i: number; v: number }[] = []
    days.forEach((date, i) => {
      const w = byDate.get(date)?.weight
      if (w != null) raw.push({ i, date, v: w })
      const s = trailingWeightAverage(byDate, date)
      if (s != null && w != null) smooth.push({ i, v: s })
    })

    const all = [...raw.map((p) => p.v), ...smooth.map((p) => p.v)]
    let min = Math.min(...all)
    let max = Math.max(...all)
    const pad = Math.max(0.3, (max - min) * 0.15)
    min -= pad
    max += pad
    const y = (v: number) => PAD_T + innerH - ((v - min) / (max - min)) * innerH

    // Smoothed line only joins consecutive weigh-ins (gaps keep the line honest).
    const path = smooth.map((p, k) => `${k === 0 ? 'M' : 'L'}${x(p.i).toFixed(1)},${y(p.v).toFixed(1)}`).join(' ')
    return { days, n, x, y, raw, path, min, max }
  }, [byDate, start, end])

  const { days, x, y, raw, path, min, max } = model

  function handleClick(e: React.MouseEvent<SVGSVGElement>) {
    const rect = e.currentTarget.getBoundingClientRect()
    const vx = ((e.clientX - rect.left) / rect.width) * W
    let best: { date: string; d: number } | null = null
    for (const p of raw) {
      const d = Math.abs(x(p.i) - vx)
      if (!best || d < best.d) best = { date: p.date, d }
    }
    if (best && best.d <= 18) onPick(best.date)
  }

  const gridYs = [max, (max + min) / 2, min]
  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      className="w-full cursor-pointer touch-manipulation"
      role="img"
      aria-label="Graphique du poids : touchez une pesée pour la modifier"
      onClick={handleClick}
    >
      {gridYs.map((v, i) => (
        <g key={i}>
          <line x1={PAD_L} x2={W - PAD_R} y1={y(v)} y2={y(v)} stroke="var(--color-slate-200)" strokeDasharray={i === 1 ? '3 3' : undefined} />
          <text x={PAD_L - 5} y={y(v) + 3} fontSize="9" textAnchor="end" fill="var(--color-slate-400)">
            {formatKg(v)}
          </text>
        </g>
      ))}
      {path && <path d={path} fill="none" stroke="var(--color-accent)" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />}
      {raw.map((p) => (
        <circle key={p.date} cx={x(p.i)} cy={y(p.v)} r={days.length > 120 ? 1.6 : 2.6} fill="var(--color-slate-400)" />
      ))}
      <text x={PAD_L} y={H - 7} fontSize="9" fill="var(--color-slate-400)">
        {formatDateFr(days[0], { withYear: false })}
      </text>
      <text x={W - PAD_R} y={H - 7} fontSize="9" textAnchor="end" fill="var(--color-slate-400)">
        {formatDateFr(days[days.length - 1], { withYear: false })}
      </text>
    </svg>
  )
}
