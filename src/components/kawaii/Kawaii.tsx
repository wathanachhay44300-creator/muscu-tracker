import type { ReactNode, SVGProps } from 'react'

/*
 * Decorations of the Fraise Chantilly theme. They are always rendered but
 * only shown when the theme turns them on (--decor-kawaii in theme.css), so
 * the other themes keep exactly their layout. Colors come from the theme's
 * --kawaii-* / --sprinkle-* tokens.
 */

/** Shown only in the kawaii theme. `display: contents` there, so children lay out as usual. */
export function KawaiiOnly({ children }: { children: ReactNode }) {
  return <span className="decor-kawaii">{children}</span>
}

/** The plain element a kawaii decoration replaces: hidden in the kawaii theme. */
export function PlainOnly({ children }: { children: ReactNode }) {
  return <span className="decor-plain">{children}</span>
}

const HEART = 'M12 21s-7.5-4.6-9.6-9.2C.9 8.4 3 4.5 6.7 4.5c2.1 0 3.7 1.2 4.6 2.7.9-1.5 2.5-2.7 4.6-2.7 3.7 0 5.8 3.9 4.3 7.3C19.5 16.4 12 21 12 21z'

/** Small heart, in the current text color unless given one. */
export function HeartIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" {...props}>
      <path d={HEART} />
    </svg>
  )
}

/** A few sprinkles (rounded sticks, 12×5) for the top right corner of the pink hero card. */
const SPRINKLES: { x: number; y: number; r: number; c: number }[] = [
  { x: 14, y: 10, r: -30, c: 1 },
  { x: 38, y: 6, r: 25, c: 2 },
  { x: 60, y: 14, r: -55, c: 3 },
  { x: 26, y: 30, r: 60, c: 4 },
  { x: 50, y: 34, r: -15, c: 5 },
  { x: 74, y: 30, r: 35, c: 1 },
  { x: 8, y: 46, r: 15, c: 3 },
  { x: 66, y: 52, r: -40, c: 2 },
]

export function Sprinkles({ className = '' }: { className?: string }) {
  return (
    <svg viewBox="0 0 88 64" className={className} aria-hidden="true">
      {SPRINKLES.map((s, i) => (
        <rect
          key={i}
          x={s.x}
          y={s.y}
          width="12"
          height="5"
          rx="2.5"
          fill={`var(--sprinkle-${s.c})`}
          opacity="0.55"
          transform={`rotate(${s.r} ${s.x + 6} ${s.y + 2.5})`}
        />
      ))}
    </svg>
  )
}
