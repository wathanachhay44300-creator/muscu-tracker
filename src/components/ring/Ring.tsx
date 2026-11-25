import type { ReactNode, SVGProps } from 'react'

/*
 * Decorations of the Title Fight theme (ring ropes, spotlight, glove, belt,
 * bell). Always rendered, shown only when the theme turns them on
 * (--decor-ring in theme.css), so other themes keep exactly their layout.
 * Colors come from the theme's --rope-* / --glove / --belt-* tokens.
 */

/** Shown only in the ring theme. `display: contents` there, so children lay out as usual. */
export function RingOnly({ children }: { children: ReactNode }) {
  return <span className="decor-ring">{children}</span>
}

/** The plain element a ring decoration replaces: hidden in the ring theme. */
export function NoRing({ children }: { children: ReactNode }) {
  return <span className="decor-noring">{children}</span>
}

/** Three ropes (red, white, blue): 9 px, or 6 px when `thin`. */
export function RopeBand({ thin = false, className = '' }: { thin?: boolean; className?: string }) {
  return (
    <span
      aria-hidden="true"
      className={`block ${thin ? 'h-1.5' : 'h-[9px]'} ${className}`}
      style={{ background: thin ? 'var(--rope-band-thin)' : 'var(--rope-band)' }}
    />
  )
}

/** Spotlight coming down from the top of its (relative) parent. */
export function Spotlight() {
  return <span aria-hidden="true" className="pointer-events-none absolute inset-0 block" style={{ background: 'var(--spotlight)' }} />
}

export function GloveIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" {...props}>
      <path d="M8 3.5h6.5a5 5 0 0 1 5 5v5.5a4 4 0 0 1-4 4H9.5a4 4 0 0 1-4-4V6a2.5 2.5 0 0 1 2.5-2.5z" fill="var(--glove)" />
      <path d="M5.5 9.5c-2.2 0-2.2 4.5 0 4.5" fill="var(--glove)" />
      <rect x="8" y="18" width="8.5" height="3" rx="1" fill="var(--glove-cuff)" opacity=".7" />
    </svg>
  )
}

/** Champion's belt (54 × 34). */
export function BeltIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 54 34" aria-hidden="true" {...props}>
      <rect x="0" y="10" width="54" height="14" rx="3" fill="var(--belt-strap)" />
      <ellipse cx="27" cy="17" rx="15" ry="14" fill="var(--belt-gold)" />
      <ellipse cx="27" cy="17" rx="10" ry="9" fill="none" stroke="var(--belt-engrave)" strokeWidth="1.5" />
      <path d="M27 10l2 4.5 5 .4-3.8 3.2 1.2 4.8L27 20.3l-4.4 2.6 1.2-4.8L20 14.9l5-.4z" fill="var(--belt-engrave)" />
      <rect x="3" y="13" width="6" height="8" rx="1.5" fill="var(--belt-gold)" />
      <rect x="45" y="13" width="6" height="8" rx="1.5" fill="var(--belt-gold)" />
    </svg>
  )
}

/** Ring bell, drawn in the current text color. */
export function BellIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      {...props}
    >
      <path d="M6 15a6 6 0 0 1 12 0v1H6z" />
      <path d="M12 9V6M4 16h16M12 19.5a1.5 1.5 0 0 0 1.5-1.5h-3a1.5 1.5 0 0 0 1.5 1.5z" />
    </svg>
  )
}
