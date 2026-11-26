import type { CSSProperties, ReactNode, SVGProps } from 'react'
import { useLocation } from 'react-router-dom'
import type { Suit } from '../../lib/cards'

/*
 * Decorations of the Joker Aura theme (playing cards, suits, aura halos).
 * Always rendered, shown only when the theme turns them on (--decor-joker in
 * theme.css), so other themes keep exactly their layout. Colors come from
 * the theme's --joker-* tokens. Suits are drawn in SVG (a ♥ character can
 * turn into a red emoji on iPhone).
 */

/** Shown only in the Joker theme. `display: contents` there, so children lay out as usual. */
export function JokerOnly({ children }: { children: ReactNode }) {
  return <span className="decor-joker">{children}</span>
}

/** The plain element a Joker decoration replaces: hidden in the Joker theme. */
export function NoJoker({ children }: { children: ReactNode }) {
  return <span className="decor-nojoker">{children}</span>
}


const SUIT_PATHS: Record<Suit, string> = {
  spade: 'M12 2.5c-3.2 4.3-8 7.3-8 11.3a4.3 4.3 0 0 0 7.2 3.2L10 21.5h4l-1.2-4.5a4.3 4.3 0 0 0 7.2-3.2c0-4-4.8-7-8-11.3z',
  heart:
    'M12 21s-7.5-4.6-9.6-9.2C.9 8.4 3 4.5 6.7 4.5c2.1 0 3.7 1.2 4.6 2.7.9-1.5 2.5-2.7 4.6-2.7 3.7 0 5.8 3.9 4.3 7.3C19.5 16.4 12 21 12 21z',
  diamond: 'M12 2.5l7 9.5-7 9.5-7-9.5z',
  club: 'M12 3a3.9 3.9 0 0 0-3.4 5.8A3.9 3.9 0 1 0 10.9 15L10 21h4l-.9-6a3.9 3.9 0 1 0 2.3-6.2A3.9 3.9 0 0 0 12 3z',
}

/** A card suit, in the current text color unless given one. */
export function SuitIcon({ suit, ...props }: { suit: Suit } & SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" {...props}>
      <path d={SUIT_PATHS[suit]} />
    </svg>
  )
}

interface MiniCardProps {
  suit: Suit
  /** Red suits are magenta, black ones are near-black. */
  red?: boolean
  /** Show an "A" in the top-left corner. */
  ace?: boolean
  glow?: 'magenta' | 'violet'
  className?: string
  style?: CSSProperties
}

/** A small white playing card with a suit in the middle (and optionally an "A"). */
export function MiniCard({ suit, red = false, ace = false, glow, className = '', style }: MiniCardProps) {
  const color = red ? 'var(--joker-suit-red)' : 'var(--joker-suit-dark)'
  return (
    <span
      aria-hidden="true"
      // Pass `relative` or `absolute` in className: the "A" is placed inside the card.
      className={`flex items-center justify-center rounded-lg ${className}`}
      style={{
        background: 'var(--joker-card)',
        boxShadow: glow === 'violet' ? 'var(--joker-card-glow-violet)' : glow === 'magenta' ? 'var(--joker-card-glow)' : undefined,
        color,
        ...style,
      }}
    >
      {ace && <span className="font-display absolute left-1 top-0.5 text-[11px] font-bold leading-none">A</span>}
      <SuitIcon suit={suit} className={ace ? 'mt-1.5 h-1/2 w-1/2' : 'h-1/2 w-1/2'} />
    </span>
  )
}

/** "A ♠" in a card corner, magenta. */
function Corner({ className, style }: { className: string; style?: CSSProperties }) {
  return (
    <span
      aria-hidden="true"
      className={`font-display pointer-events-none absolute flex flex-col items-center text-[12px] font-bold leading-none ${className}`}
      style={{ color: 'var(--joker-magenta)', ...style }}
    >
      A
      <SuitIcon suit="spade" className="mt-0.5 h-2.5 w-2.5" />
    </span>
  )
}

/** Home card as a playing card: corners and a big ♠ watermark (inside a relative, isolated card). */
export function JokerHeroDecor() {
  return (
    <JokerOnly>
      <Corner className="left-2 top-2" />
      <Corner className="bottom-2 right-2" style={{ transform: 'rotate(180deg)' }} />
      <SuitIcon
        suit="spade"
        className="pointer-events-none absolute -right-3 -top-3 -z-10 h-[110px] w-[110px]"
        style={{ color: 'var(--joker-watermark)' }}
      />
    </JokerOnly>
  )
}

const HALO = 'pointer-events-none fixed -z-10 rounded-full'

/** Aura halos behind every screen (fixed, no blur, never touched). */
export function JokerBackdrop() {
  const { pathname } = useLocation()
  const session = pathname.startsWith('/seance')
  return (
    <JokerOnly>
      {session ? (
        <span aria-hidden="true" className={HALO} style={{ right: -190, top: '22%', width: 420, height: 420, background: 'var(--joker-halo-session)' }} />
      ) : (
        <>
          <span aria-hidden="true" className={HALO} style={{ left: -160, top: -160, width: 420, height: 420, background: 'var(--joker-halo-violet)' }} />
          <span aria-hidden="true" className={HALO} style={{ right: -140, top: -120, width: 380, height: 380, background: 'var(--joker-halo-magenta)' }} />
        </>
      )}
    </JokerOnly>
  )
}
