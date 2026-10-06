import { MUSCLES } from '../data/muscles'
import type { MuscleId } from '../types'

/**
 * Simple original body diagram (front and back views), drawn with plain SVG
 * shapes — works for every exercise, offline, in both themes. Muscle shapes
 * are drawn for one side and mirrored; the few central ones are drawn once.
 */

interface Region {
  id: MuscleId
  /** Path for the viewer's left half, mirrored to the right half unless `center`. */
  d: string
  center?: boolean
}

const SILHOUETTE: string[] = [
  // torso, hips
  'M30 33 Q50 27 70 33 L69 52 L64 100 L67 113 L33 113 L36 100 L31 52 Z',
  // left arm (upper arm + forearm + hand), mirrored below
  'M31 34 C25 33 20 37 19.5 43 L15.5 79 L26 81 L33 50 Z',
  'M15.5 79 L26 81 L22 119 L12.5 117 Z',
  'M17 117 L13 117 C10 120 10 126 14 128 C18 128 20 123 21 119 Z',
  // left leg (thigh + calf + foot)
  'M33 111 L50 113 L49.5 159 L34.5 159 Z',
  'M34.5 159 L49.5 159 L47.5 206 L37 206 Z',
  'M37 205 L47.5 205 L48 211 C42 213 36 212 35 210 Z',
]

const FRONT: Region[] = [
  { id: 'trapezes', d: 'M41 28.5 L49.5 28 L49.5 36 L37 37 Z' },
  { id: 'pectoraux', d: 'M33.5 39 Q41 36.5 49.5 40.5 L49.5 60 Q41 64 34.5 56.5 Z' },
  { id: 'delt_ant', d: 'M28.5 34.5 L33 38 L34 50 L27.5 55 L25.5 46 Z' },
  { id: 'delt_lat', d: 'M20 43 C21 37 25 34 28 34.5 L25.5 46 L27.5 55 L22 54 Z' },
  { id: 'biceps', d: 'M21.5 57 L29.5 54 L28 78 L19 78 Z' },
  { id: 'avant_bras', d: 'M17 83 L25.5 84 L22 113 L14 112 Z' },
  { id: 'abdominaux', d: 'M44 65 L56 65 L56 100 Q50 105 44 100 Z', center: true },
  { id: 'obliques', d: 'M35 62 L43 65 L43 99 L37.5 96.5 Z' },
  { id: 'quadriceps', d: 'M33.5 115 L49 117 L48.5 154 L35.5 153 Z' },
  { id: 'adducteurs', d: 'M44.5 119 L50 119 L49.5 146 L45.5 144 Z' },
  { id: 'mollets', d: 'M36.5 162 L47 162 L45.5 190 L38.5 190 Z' },
]

const BACK: Region[] = [
  { id: 'trapezes', d: 'M50 26 L43 29.5 L32 37 L40 43 L50 54 Z' },
  { id: 'delt_post', d: 'M28 39 L33 39.5 L35 50 L27.5 54 Z' },
  { id: 'delt_lat', d: 'M20 44 C21 38 25 35 28 36 L27 54 L22 55 Z' },
  { id: 'milieu_dos', d: 'M41 46 L50 55 L50 70 L42 65 Z' },
  { id: 'grand_dorsal', d: 'M34.5 51 L41 66 L49.5 72 L49.5 93 L39 91 L35 66 Z' },
  { id: 'lombaires', d: 'M43 94 L50 92 L50 111 L42 109 Z' },
  { id: 'triceps', d: 'M21.5 57 L29.5 54 L28 78 L19 78 Z' },
  { id: 'avant_bras', d: 'M17 83 L25.5 84 L22 113 L14 112 Z' },
  { id: 'fessiers', d: 'M34 112 L50 112 L50 129 Q40 135 33.5 126 Z' },
  { id: 'moyen_fessier', d: 'M31 104 L40 104 L38 113 L31 114 Z' },
  { id: 'ischios', d: 'M34.5 133 L49 131 L48.5 156 L35.5 156 Z' },
  { id: 'mollets', d: 'M36.5 162 Q34 174 38 191 L45 191 Q49 174 47 162 Z' },
]

const MIRROR = 'matrix(-1 0 0 1 100 0)'

type Level = 'primary' | 'secondary' | 'none'

function fillFor(level: Level): { fill: string; opacity?: number } {
  if (level === 'primary') return { fill: 'var(--color-brand-500)' }
  if (level === 'secondary') return { fill: 'var(--color-brand-300)', opacity: 0.6 }
  return { fill: 'var(--color-slate-300)', opacity: 0.3 }
}

function Body({ regions, label, levels }: { regions: Region[]; label: string; levels: Map<MuscleId, Level> }) {
  return (
    <svg viewBox="0 0 100 216" className="h-52 w-auto" role="img" aria-label={label}>
      {/* head and neck are drawn once (not mirrored) */}
      <ellipse cx="50" cy="14" rx="8.5" ry="10.5" fill="var(--color-slate-200)" />
      <rect x="45" y="22" width="10" height="9" rx="2" fill="var(--color-slate-200)" />
      {[false, true].map((mirrored) => (
        <g key={String(mirrored)} transform={mirrored ? MIRROR : undefined}>
          {SILHOUETTE.map((d, i) => (
            <path key={i} d={d} fill="var(--color-slate-200)" />
          ))}
        </g>
      ))}
      {regions.map((r) => {
        const level = levels.get(r.id) ?? 'none'
        const { fill, opacity } = fillFor(level)
        const title = level === 'none' ? undefined : <title>{MUSCLES[r.id].label}</title>
        return r.center ? (
          <path key={r.id} d={r.d} fill={fill} opacity={opacity}>
            {title}
          </path>
        ) : (
          <g key={r.id}>
            <path d={r.d} fill={fill} opacity={opacity}>
              {title}
            </path>
            <path d={r.d} transform={MIRROR} fill={fill} opacity={opacity} />
          </g>
        )
      })}
    </svg>
  )
}

interface BodyDiagramProps {
  primary: MuscleId[]
  secondary: MuscleId[]
}

/** Front and back views with the main muscles in a strong colour and the secondary ones lighter. */
export function BodyDiagram({ primary, secondary }: BodyDiagramProps) {
  const levels = new Map<MuscleId, Level>()
  for (const m of secondary) levels.set(m, 'secondary')
  for (const m of primary) levels.set(m, 'primary')

  return (
    <div>
      <div className="flex items-end justify-center gap-6">
        <figure className="text-center">
          <Body regions={FRONT} label="Schéma du corps, vue de face" levels={levels} />
          <figcaption className="mt-1 text-[11px] font-medium text-slate-400">Face</figcaption>
        </figure>
        <figure className="text-center">
          <Body regions={BACK} label="Schéma du corps, vue de dos" levels={levels} />
          <figcaption className="mt-1 text-[11px] font-medium text-slate-400">Dos</figcaption>
        </figure>
      </div>
      <div className="mt-2 flex justify-center gap-4 text-[11px] text-slate-500">
        <span className="flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-full" style={{ background: 'var(--color-brand-500)' }} />
          Principal
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-full opacity-60" style={{ background: 'var(--color-brand-300)' }} />
          Secondaire
        </span>
      </div>
    </div>
  )
}
