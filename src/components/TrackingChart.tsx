import { useMemo, useState, type PointerEvent as ReactPointerEvent } from 'react'
import { formatDateFr } from '../lib/date'
import { formatInt, formatKg, type ChartColumn } from '../lib/tracking'

const W = 340
const PAD_L = 38
const PAD_R = 8
const PANELS = {
  weight: { title: 12, top: 16, height: 96 },
  steps: { title: 128, top: 132, height: 56 },
  calories: { title: 204, top: 208, height: 56 },
} as const
const AXIS_Y = 278
const H = 286

interface TrackingChartProps {
  columns: ChartColumn[]
}

function niceMax(max: number, step: number): number {
  return Math.max(step, Math.ceil(max / step) * step)
}

function formatTick(n: number): string {
  return n >= 10000 ? `${Math.round(n / 1000)}k` : formatInt(n)
}

/**
 * Three aligned panels sharing one time axis — weight (line + 7-day average),
 * steps (bars), calories (bars) — each with its own scale so none flattens
 * the others. Touch/drag anywhere to inspect a day (or a week, when the
 * period is long enough that columns are weekly averages).
 */
export function TrackingChart({ columns }: TrackingChartProps) {
  const [picked, setPicked] = useState<number | null>(null)
  const selected = Math.min(picked ?? lastWithData(columns), columns.length - 1)

  const geometry = useMemo(() => {
    const innerW = W - PAD_L - PAD_R
    const colW = innerW / columns.length
    const x = (i: number) => PAD_L + (i + 0.5) * colW

    const wVals = columns.flatMap((c) => [c.weight, c.smooth]).filter((v): v is number => v != null)
    let wMin = wVals.length ? Math.min(...wVals) : 0
    let wMax = wVals.length ? Math.max(...wVals) : 1
    const pad = Math.max(0.3, (wMax - wMin) * 0.15)
    wMin -= pad
    wMax += pad
    const wy = (v: number) => PANELS.weight.top + PANELS.weight.height - ((v - wMin) / (wMax - wMin)) * PANELS.weight.height

    const sMax = niceMax(Math.max(0, ...columns.map((c) => c.steps ?? 0)), 2000)
    const cMax = niceMax(Math.max(0, ...columns.map((c) => c.calories ?? 0)), 500)
    const barY = (panel: 'steps' | 'calories', v: number, max: number) =>
      PANELS[panel].top + PANELS[panel].height - (v / max) * PANELS[panel].height

    let smoothPath = ''
    let pen = false
    columns.forEach((c, i) => {
      if (c.smooth == null) {
        pen = false
        return
      }
      smoothPath += `${pen ? 'L' : 'M'}${x(i).toFixed(1)},${wy(c.smooth).toFixed(1)} `
      pen = true
    })

    return { colW, x, wy, wMin, wMax, sMax, cMax, barY, smoothPath }
  }, [columns])

  function pick(e: ReactPointerEvent<SVGSVGElement>) {
    const rect = e.currentTarget.getBoundingClientRect()
    const vx = ((e.clientX - rect.left) / rect.width) * W
    const i = Math.floor((vx - PAD_L) / geometry.colW)
    setPicked(Math.max(0, Math.min(columns.length - 1, i)))
  }

  const { colW, x, wy, wMin, wMax, sMax, cMax, barY, smoothPath } = geometry
  const barW = Math.max(1, colW * 0.68)
  const cur = columns[selected]
  const labelAt = (i: number) => formatDateFr(columns[i].start, { withYear: false })

  return (
    <div>
      <svg
        viewBox={`0 0 ${W} ${H}`}
        className="w-full select-none"
        style={{ touchAction: 'pan-y' }}
        role="img"
        aria-label="Graphique du poids, des pas et des calories"
        onPointerDown={pick}
        onPointerMove={(e) => e.buttons === 1 && pick(e)}
      >
        {/* Selected day marker, across all three panels. */}
        <rect
          x={x(selected) - Math.max(colW, 4) / 2}
          y={PANELS.weight.top - 2}
          width={Math.max(colW, 4)}
          height={PANELS.calories.top + PANELS.calories.height - PANELS.weight.top + 4}
          fill="var(--color-slate-100)"
          rx="2"
        />

        {/* Weight */}
        <text x={PAD_L} y={PANELS.weight.title} fontSize="9" fontWeight="700" fill="var(--color-slate-500)">
          Poids (kg)
        </text>
        <text x={PAD_L - 4} y={PANELS.weight.top + 7} fontSize="8" textAnchor="end" fill="var(--color-slate-400)">
          {formatKg(wMax)}
        </text>
        <text x={PAD_L - 4} y={PANELS.weight.top + PANELS.weight.height} fontSize="8" textAnchor="end" fill="var(--color-slate-400)">
          {formatKg(wMin)}
        </text>
        <line x1={PAD_L} x2={W - PAD_R} y1={PANELS.weight.top + PANELS.weight.height} y2={PANELS.weight.top + PANELS.weight.height} stroke="var(--color-slate-200)" />
        {columns.map(
          (c, i) =>
            c.weight != null && (
              <circle key={i} cx={x(i)} cy={wy(c.weight)} r={i === selected ? 3 : 1.8} fill="var(--color-slate-400)" />
            ),
        )}
        {smoothPath && (
          <path d={smoothPath} fill="none" stroke="var(--color-accent)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        )}

        {/* Steps */}
        <text x={PAD_L} y={PANELS.steps.title} fontSize="9" fontWeight="700" fill="var(--color-slate-500)">
          Pas
        </text>
        <text x={PAD_L - 4} y={PANELS.steps.top + 7} fontSize="8" textAnchor="end" fill="var(--color-slate-400)">
          {formatTick(sMax)}
        </text>
        <line x1={PAD_L} x2={W - PAD_R} y1={PANELS.steps.top + PANELS.steps.height} y2={PANELS.steps.top + PANELS.steps.height} stroke="var(--color-slate-200)" />
        {columns.map(
          (c, i) =>
            c.steps != null && (
              <rect
                key={i}
                x={x(i) - barW / 2}
                y={barY('steps', c.steps, sMax)}
                width={barW}
                height={PANELS.steps.top + PANELS.steps.height - barY('steps', c.steps, sMax)}
                fill="var(--color-brand-400)"
                opacity={i === selected ? 1 : 0.7}
              />
            ),
        )}

        {/* Calories */}
        <text x={PAD_L} y={PANELS.calories.title} fontSize="9" fontWeight="700" fill="var(--color-slate-500)">
          Calories (kcal)
        </text>
        <text x={PAD_L - 4} y={PANELS.calories.top + 7} fontSize="8" textAnchor="end" fill="var(--color-slate-400)">
          {formatTick(cMax)}
        </text>
        <line x1={PAD_L} x2={W - PAD_R} y1={PANELS.calories.top + PANELS.calories.height} y2={PANELS.calories.top + PANELS.calories.height} stroke="var(--color-slate-200)" />
        {columns.map(
          (c, i) =>
            c.calories != null && (
              <rect
                key={i}
                x={x(i) - barW / 2}
                y={barY('calories', c.calories, cMax)}
                width={barW}
                height={PANELS.calories.top + PANELS.calories.height - barY('calories', c.calories, cMax)}
                fill="var(--color-amber-500)"
                opacity={i === selected ? 1 : 0.7}
              />
            ),
        )}

        {/* Shared time axis */}
        <text x={PAD_L} y={AXIS_Y} fontSize="9" fill="var(--color-slate-400)">
          {labelAt(0)}
        </text>
        {columns.length > 6 && (
          <text x={x(Math.floor(columns.length / 2))} y={AXIS_Y} fontSize="9" textAnchor="middle" fill="var(--color-slate-400)">
            {labelAt(Math.floor(columns.length / 2))}
          </text>
        )}
        <text x={W - PAD_R} y={AXIS_Y} fontSize="9" textAnchor="end" fill="var(--color-slate-400)">
          {formatDateFr(columns[columns.length - 1].end, { withYear: false })}
        </text>
      </svg>

      <div className="mt-2 rounded-xl bg-slate-50 px-3.5 py-3">
        <p className="mb-1.5 text-xs font-semibold text-slate-500">
          {cur.span === 1
            ? formatDateFr(cur.start)
            : `Semaine du ${formatDateFr(cur.start, { withYear: false })} au ${formatDateFr(cur.end, { withYear: false })} (moyennes)`}
        </p>
        <div className="grid grid-cols-3 gap-2 text-center">
          <DetailValue label="Poids" value={cur.weight != null ? `${formatKg(cur.weight)} kg` : '—'} sub={cur.smooth != null ? `lissé ${formatKg(cur.smooth)}` : undefined} />
          <DetailValue label="Pas" value={cur.steps != null ? formatInt(cur.steps) : '—'} />
          <DetailValue label="Calories" value={cur.calories != null ? `${formatInt(cur.calories)}` : '—'} sub="kcal" />
        </div>
      </div>
    </div>
  )
}

function DetailValue({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div>
      <p className="text-[11px] font-medium text-slate-400">{label}</p>
      <p className="text-base font-bold tabular-nums text-slate-900">{value}</p>
      {sub && <p className="text-[10px] text-slate-400">{sub}</p>}
    </div>
  )
}

function lastWithData(columns: ChartColumn[]): number {
  for (let i = columns.length - 1; i >= 0; i--) {
    const c = columns[i]
    if (c.weight != null || c.steps != null || c.calories != null) return i
  }
  return columns.length - 1
}
