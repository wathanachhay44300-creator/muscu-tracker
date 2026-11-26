import type { CSSProperties, ReactNode, SVGProps } from 'react'
import { useLocation } from 'react-router-dom'

/*
 * Decorations of the Dragon d'or theme (clouds, gold coins, seals, the red
 * home halo). Always rendered, shown only when the theme turns them on
 * (--decor-dragon in theme.css), so other themes keep exactly their layout.
 * Colors come from the theme's --dragon-* tokens; the seal characters use a
 * 3-glyph font subset (--font-seal).
 */

/** Shown only in the Dragon theme. `display: contents` there, so children lay out as usual. */
export function DragonOnly({ children }: { children: ReactNode }) {
  return <span className="decor-dragon">{children}</span>
}

/** The plain element a Dragon decoration replaces: hidden in the Dragon theme. */
export function NoDragon({ children }: { children: ReactNode }) {
  return <span className="decor-nodragon">{children}</span>
}

/** One of the seal characters 力 气 息, decorative. */
export function SealGlyph({ char, className = '', style }: { char: '力' | '气' | '息'; className?: string; style?: CSSProperties }) {
  return (
    <span aria-hidden="true" className={`leading-none ${className}`} style={{ fontFamily: 'var(--font-seal)', ...style }}>
      {char}
    </span>
  )
}

/** Round gold coin with a square hole. */
export function CoinIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 36 36" aria-hidden="true" {...props}>
      <circle cx="18" cy="18" r="16" fill="var(--dragon-gold)" />
      <circle cx="18" cy="18" r="12.5" fill="none" stroke="var(--dragon-gold-dark)" strokeWidth="1.5" />
      <rect x="13" y="13" width="10" height="10" fill="var(--dragon-hole)" />
    </svg>
  )
}

/** Trophy-like icon of the last-record card. */
export function RecordTrophyIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 40 40" aria-hidden="true" {...props}>
      <path d="M6 14h28l-3 6H9z" fill="var(--dragon-gold)" />
      <path d="M10 20h20v12a4 4 0 0 1-4 4H14a4 4 0 0 1-4-4z" fill="var(--dragon-red)" />
      <rect x="16" y="6" width="8" height="8" rx="2" fill="var(--dragon-gold)" />
      <path d="M20 24v8M16 28h8" stroke="var(--dragon-gold)" strokeWidth="2" />
    </svg>
  )
}

/** Stylized clouds, gold outline. */
function Clouds({ className = '' }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 200 120"
      fill="none"
      stroke="var(--dragon-gold)"
      strokeWidth="2.2"
      strokeLinecap="round"
      aria-hidden="true"
      className={className}
    >
      <path d="M30 70c-14 0-14-20 0-20 2-14 24-16 28-2 8-10 26-6 24 8 12 0 14 14 2 14H30z" />
      <path d="M46 62a6 6 0 1 1 6-6M70 62a5 5 0 1 0-5-5" />
      <path d="M110 40c-10 0-10-15 0-15 2-10 18-12 21-1 6-7 19-4 18 6 9 0 10 10 1 10h-40z" />
      <path d="M122 34a4.5 4.5 0 1 1 4.5-4.5" />
      <path d="M120 100c-9 0-9-13 0-13 1-9 16-10 18-1 5-6 17-4 16 5 8 0 9 9 1 9h-35z" />
    </svg>
  )
}

/** Home card as a lacquered panel: clouds at the top right, round 力 seal at the bottom right. */
export function DragonHeroDecor() {
  return (
    <DragonOnly>
      <Clouds className="pointer-events-none absolute right-1 top-1 -z-10 h-[90px] w-[150px] opacity-55" />
      <span
        aria-hidden="true"
        className="pointer-events-none absolute bottom-4 right-4 flex h-16 w-16 items-center justify-center rounded-full"
        style={{
          background: 'var(--dragon-lacquer)',
          border: '2.5px solid var(--dragon-gold)',
          boxShadow: 'var(--dragon-seal-ring)',
        }}
      >
        <SealGlyph char="力" className="text-[40px]" style={{ color: 'var(--dragon-gold)' }} />
      </span>
    </DragonOnly>
  )
}

/** Red halo at the top left of the home screen (fixed, never touched). */
export function DragonBackdrop() {
  const { pathname } = useLocation()
  if (pathname !== '/') return null
  return (
    <DragonOnly>
      <span
        aria-hidden="true"
        className="pointer-events-none fixed -z-10 rounded-full"
        style={{ left: -180, top: -180, width: 460, height: 460, background: 'var(--dragon-halo)' }}
      />
    </DragonOnly>
  )
}
