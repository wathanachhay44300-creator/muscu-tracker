import { memo } from 'react'
import type { MuscleId } from '../types'
import { muscleLabel, t } from '../i18n'
import { musclesAriaLabel, type BodyCrop, type BodySide } from '../lib/bodyMap'

/**
 * Original body diagram (front and back views), drawn with plain SVG shapes —
 * works for every exercise, offline, in every theme. Shapes are drawn for the
 * viewer's left half and mirrored; the abs are drawn once. Each muscle is its
 * own shape, outlined in the silhouette colour so neighbours stay apart.
 * Colours come from the theme: --body, --muscle-idle / -secondary / -primary.
 */

interface Region {
  id: MuscleId
  /** Path for the viewer's left half, mirrored to the right half unless `center`. */
  d: string
  center?: boolean
}

/** Left half of the silhouette (torso, arm, leg), mirrored. Head and neck are drawn once. */
const SILHOUETTE: string[] = [
  // torso: wide shoulders, V-taper to a narrow waist, hips
  'M50 25 L44.5 25.5 C41 29.5 35 31 29.5 32.5 C25.5 35 25.5 42 29.5 48.5 C31 62 33.5 76 36 88 C35 95 33.5 101 33 108 L37 117 L50 119 Z',
  // shoulder cap + upper arm
  'M30 31.5 C22.5 31.5 18 36.5 17.8 44 C17.3 55 16.5 66 15.5 78.5 L27.5 80.5 C29.5 70 31 58 31.5 46 Z',
  // forearm, thicker at the elbow
  'M15.5 77.5 L27.5 79.5 C27 91 24.5 104 22 116.5 L15 116.5 C12.8 103 12.6 89 15.5 77.5 Z',
  // hand
  'M15 115.5 L22 115.5 C22.5 121 21.3 127 18.3 128.7 C14.8 128.3 13.2 122 15 115.5 Z',
  // thigh
  'M33.5 104 C30.8 117 30.6 136 34.3 158 L48 158 C49 144 50.3 128 50.3 117 Z',
  // knee + calf
  'M34.8 155 L47.8 155 C49.4 166 48.9 179 46.6 192 L45.8 204.5 L39 204.5 L38 192 C33.6 179 33.2 166 34.8 155 Z',
  // foot
  'M39 203 L45.8 203 L47.3 210 C43 212.6 37 212.2 35.4 209.6 Z',
]

const FRONT: Region[] = [
  { id: 'trapezes', d: 'M44.6 27.6 C41.5 30.6 37.5 32 33.5 33.2 L44.5 34.6 Z' },
  { id: 'delt_lat', d: 'M28.4 32.8 C23 33 19.3 37.5 19.1 44 L20.1 52.2 L22.7 51.4 C21.7 44.6 23.3 37.2 28.4 32.8 Z' },
  { id: 'delt_ant', d: 'M30.9 33.5 C25.9 35.3 24 40 24.4 45 L25.8 51.2 L32.4 46.4 C31.7 42 31.1 37.6 30.9 33.5 Z' },
  { id: 'pectoraux', d: 'M33.6 36 C38.6 35.3 44 35.7 48.9 37.2 L48.9 54.6 C44 58.2 37.4 57.8 33.6 53 C32.4 47.8 32.4 41.2 33.6 36 Z' },
  { id: 'biceps', d: 'M20.4 55 L27.8 53 C29.2 61 28.8 70 27.4 77.2 L18.2 76.2 C17.8 68.5 18.6 61 20.4 55 Z' },
  { id: 'avant_bras', d: 'M15.6 81.4 L26.8 83 C25.8 93.5 24 103.5 21.6 113.4 L15.6 113.4 C13.6 102.5 13.6 91.5 15.6 81.4 Z' },
  { id: 'obliques', d: 'M34.4 60.2 L41.8 62.2 L42.4 98 L37.8 95.6 C36.4 84 35.4 72 34.4 60.2 Z' },
  { id: 'abdominaux', d: 'M43.8 59.6 L56.2 59.6 L55.8 99 Q50 105.6 44.2 99 Z', center: true },
  { id: 'quadriceps', d: 'M33.6 111.5 C32 125 32.5 141 35.4 154 L44.4 154.6 C46.2 144.5 46.6 131.5 45 118 Z' },
  { id: 'adducteurs', d: 'M46.6 120 L49.4 120.6 L48.9 145.5 C47.6 139 46.9 129.5 46.6 120 Z' },
  { id: 'mollets', d: 'M35.8 161 L46.8 161 C47.8 170 46.8 181 44.6 190 L39 190 C35.8 181 34.9 170 35.8 161 Z' },
]

const BACK: Region[] = [
  { id: 'trapezes', d: 'M49.2 23.5 L44.6 26.8 C41 30.4 36 32 31.6 33.6 L40 40.8 L49.2 55.4 Z' },
  { id: 'delt_lat', d: 'M28.4 33 C23 33.2 19.3 37.7 19.1 44 L20.1 52.2 L22.7 51.4 C21.7 44.6 23.3 37.4 28.4 33 Z' },
  { id: 'delt_post', d: 'M30.8 34.6 C25.9 36 24 40.4 24.4 45.2 L25.8 51.2 L32.4 46.4 C31.8 42.2 31.2 38.4 30.8 34.6 Z' },
  { id: 'milieu_dos', d: 'M38.8 44.2 L48.8 58.6 L48.8 70.4 L41.4 64.4 Z' },
  { id: 'grand_dorsal', d: 'M32.4 48 L39.6 65 L48.8 73.6 L48.8 90.4 C43.4 90.4 39.4 88.6 37.2 86.4 C35.2 74 33.4 61 32.4 48 Z' },
  { id: 'lombaires', d: 'M42.4 92.6 L48.8 93.4 L48.8 108.6 L42.8 107.4 Z' },
  { id: 'triceps', d: 'M19.6 55 L27.8 53 C29.2 61 28.8 70 27.4 77.2 L18.2 76.2 C17.6 68.5 18.2 61 19.6 55 Z' },
  { id: 'avant_bras', d: 'M15.6 81.4 L26.8 83 C25.8 93.5 24 103.5 21.6 113.4 L15.6 113.4 C13.6 102.5 13.6 91.5 15.6 81.4 Z' },
  { id: 'moyen_fessier', d: 'M33.8 101.6 C36.4 100.6 39 100.6 40.8 101.8 L41.2 107.4 C37.6 107.8 35.2 109.4 33.6 111.6 Z' },
  { id: 'fessiers', d: 'M34.4 114.6 C35.6 110.6 42 109.2 48.8 110 L48.8 131 C42 135 35.4 132.4 33.4 126 Z' },
  { id: 'ischios', d: 'M33.6 135.4 C33.2 142.5 34 150 35.6 156 L47.6 156 C48.6 149 48.9 141.5 48.9 135.4 C44 137.4 38 137.4 33.6 135.4 Z' },
  { id: 'mollets', d: 'M35.6 160.6 C33.2 168 33.6 178 37.6 188.4 L46 188.4 C49 178 49 168 47.6 160.6 Z' },
]

/** Lines of the six-pack, drawn over the abs in the silhouette colour. */
const ABS_LINES = 'M50 60 L50 102 M44 72 L56 72 M44 84.5 L56 84.5'

const MIRROR = 'matrix(-1 0 0 1 100 0)'


const VIEWBOX: Record<BodyCrop, string> = {
  upper: '8 2 84 126',
  full: '0 0 100 216',
}

type Level = 'primary' | 'secondary' | 'none'

const FILL: Record<Level, string> = {
  primary: 'var(--muscle-primary)',
  secondary: 'var(--muscle-secondary)',
  none: 'var(--muscle-idle)',
}

interface BodyViewProps {
  side: BodySide
  crop?: BodyCrop
  /** Muscle ids joined with a comma: plain strings keep the memo cheap. */
  primaryKey: string
  secondaryKey: string
  label: string
  className?: string
}

/** One view of the body. Memoized on plain strings so many thumbnails don't redraw while scrolling. */
export const BodyView = memo(function BodyView({ side, crop = 'full', primaryKey, secondaryKey, label, className = '' }: BodyViewProps) {
  const levels = new Map<string, Level>()
  for (const m of secondaryKey.split(',')) if (m) levels.set(m, 'secondary')
  for (const m of primaryKey.split(',')) if (m) levels.set(m, 'primary')
  const regions = side === 'front' ? FRONT : BACK
  const abs = levels.get('abdominaux')

  return (
    <svg viewBox={VIEWBOX[crop]} className={className} role="img" aria-label={label} preserveAspectRatio="xMidYMid meet">
      <ellipse cx="50" cy="13" rx="7.8" ry="10" fill="var(--body)" />
      <path d="M44.5 20 L55.5 20 L56 28 L44 28 Z" fill="var(--body)" />
      {[false, true].map((mirrored) => (
        <g key={String(mirrored)} transform={mirrored ? MIRROR : undefined} fill="var(--body)">
          {SILHOUETTE.map((d, i) => (
            <path key={i} d={d} />
          ))}
        </g>
      ))}
      <g stroke="var(--body)" strokeWidth="0.9" strokeLinejoin="round">
        {regions.map((r) => {
          const fill = FILL[levels.get(r.id) ?? 'none']
          return r.center ? (
            <path key={r.id} d={r.d} fill={fill} />
          ) : (
            <g key={r.id} fill={fill}>
              <path d={r.d} />
              <path d={r.d} transform={MIRROR} />
            </g>
          )
        })}
      </g>
      {side === 'front' && (
        <path d={ABS_LINES} stroke="var(--body)" strokeWidth={abs ? 1 : 0.8} fill="none" strokeLinecap="round" />
      )}
    </svg>
  )
})

interface BodyDiagramProps {
  primary: MuscleId[]
  secondary: MuscleId[]
}

/** Front and back views side by side, then the legend with the muscle names (exercise sheet). */
export function BodyDiagram({ primary, secondary }: BodyDiagramProps) {
  const primaryKey = primary.join(',')
  const secondaryKey = secondary.filter((m) => !primary.includes(m)).join(',')
  const secondaryList = secondaryKey ? (secondaryKey.split(',') as MuscleId[]) : []
  const label = musclesAriaLabel(primary, secondaryList)

  return (
    <div>
      <div className="flex justify-center gap-3" role="img" aria-label={label}>
        {(['front', 'back'] as const).map((side) => (
          <figure key={side} className="flex w-[150px] min-w-0 flex-col items-center" aria-hidden="true">
            <div className="flex w-full justify-center rounded-2xl bg-surface-2 px-2 py-3">
              <BodyView
                side={side}
                primaryKey={primaryKey}
                secondaryKey={secondaryKey}
                label={t(side === 'front' ? 'diagram.front' : 'diagram.back')}
                className="h-60 w-auto max-w-full"
              />
            </div>
            <figcaption className="mt-1.5 text-[11px] font-bold uppercase tracking-wider text-muted">
              {t(side === 'front' ? 'diagram.frontShort' : 'diagram.backShort')}
            </figcaption>
          </figure>
        ))}
      </div>

      <dl className="mt-3 space-y-1.5 text-sm">
        <LegendRow swatch="bg-muscle-primary" label={t('diagram.primary')} muscles={primary} />
        <LegendRow swatch="bg-muscle-secondary" label={t('diagram.secondaries')} muscles={secondaryList} />
      </dl>
    </div>
  )
}

function LegendRow({ swatch, label, muscles }: { swatch: string; label: string; muscles: MuscleId[] }) {
  return (
    <div className="flex items-start gap-2">
      <span className={`mt-1 h-3 w-3 shrink-0 rounded-[3px] ${swatch}`} aria-hidden="true" />
      <dt className="shrink-0 font-semibold text-ink">{label}</dt>
      <dd className="min-w-0 text-ink-2">{muscles.length ? muscles.map((m) => muscleLabel(m)).join(' · ') : '—'}</dd>
    </div>
  )
}
