import { t } from '../../i18n'
import { KawaiiOnly } from './Kawaii'

export type MochiMood = 'happy' | 'sleepy' | 'wink'

interface MochiProps {
  mood?: MochiMood
  /** Size in px (it's square). */
  size?: number
  /** Drawn on the pink hero card: white outline, deeper shadow and plates. */
  onAccent?: boolean
  /** Meaningful (gets a label) or purely decorative (hidden from screen readers). */
  decorative?: boolean
  /** Little bounce when it appears (skipped under reduced motion). */
  bounce?: boolean
  className?: string
}

/**
 * Mochi, the original mascot of the Fraise Chantilly theme: a round pale-pink
 * ball with rosy cheeks holding a tiny dumbbell. Plain SVG, colors from the
 * theme's --mochi-* tokens.
 */
export function Mochi({ mood = 'happy', size = 64, onAccent = false, decorative = true, bounce = false, className = '' }: MochiProps) {
  const line = onAccent ? 'var(--mochi-line-on-accent)' : 'var(--mochi-line)'
  const shadow = onAccent ? 'var(--mochi-shadow-on-accent)' : 'var(--mochi-shadow)'
  const plate = onAccent ? 'var(--mochi-plate-on-accent)' : 'var(--mochi-plate)'
  const ink = 'var(--mochi-ink)'
  const a11y = decorative ? { 'aria-hidden': true as const } : { role: 'img', 'aria-label': t('kawaii.mochi') }

  return (
    <svg
      viewBox="0 0 48 48"
      width={size}
      height={size}
      className={`${bounce ? 'mochi-bounce' : ''} ${className}`}
      {...a11y}
    >
      <ellipse cx="24" cy="43.5" rx="14" ry="2.5" fill={shadow} />
      <path d="M8 32c0-11 7-20 16-20s16 9 16 20c0 6-7 9-16 9S8 38 8 32z" fill="var(--mochi-body)" stroke={line} strokeWidth="1.5" />
      <ellipse cx="18" cy="19.5" rx="3" ry="1.8" fill="var(--mochi-shine)" opacity=".85" />
      {mood === 'sleepy' && <path d="M24 12c-1-3 1-5.5 3-5.5-.3 2.3-1.3 4-3 5.5z" fill="var(--mochi-leaf)" />}

      {/* eyes */}
      {mood === 'sleepy' ? (
        <path d="M17 29q2-2 4 0M27 29q2-2 4 0" stroke={ink} strokeWidth="1.5" fill="none" strokeLinecap="round" />
      ) : (
        <>
          <circle cx="19" cy="29" r="1.8" fill={ink} />
          {mood === 'wink' ? (
            <path d="M27 29q2-2 4 0" stroke={ink} strokeWidth="1.5" fill="none" strokeLinecap="round" />
          ) : (
            <circle cx="29" cy="29" r="1.8" fill={ink} />
          )}
        </>
      )}
      <path d="M22 32.4q2 2 4 0" fill="none" stroke={ink} strokeWidth="1.4" strokeLinecap="round" />
      <ellipse cx="15.5" cy="32" rx="2.2" ry="1.3" fill="var(--mochi-cheek)" opacity=".55" />
      <ellipse cx="32.5" cy="32" rx="2.2" ry="1.3" fill="var(--mochi-cheek)" opacity=".55" />

      {mood !== 'sleepy' && (
        <>
          <rect x="13" y="37" width="22" height="2" rx="1" fill="var(--mochi-bar)" />
          <rect x="9.5" y="34.5" width="4.5" height="7" rx="1.8" fill={plate} />
          <rect x="34" y="34.5" width="4.5" height="7" rx="1.8" fill={plate} />
          <circle cx="17.5" cy="38" r="2.2" fill="var(--mochi-body)" stroke={line} strokeWidth="1.2" />
          <circle cx="30.5" cy="38" r="2.2" fill="var(--mochi-body)" stroke={line} strokeWidth="1.2" />
        </>
      )}

      {mood === 'wink' && (
        <path
          d="M40.5 15.5l1 2.2 2.3.3-1.7 1.6.4 2.3-2-1.1-2 1.1.4-2.3-1.7-1.6 2.3-.3z"
          fill="var(--mochi-star)"
        />
      )}
    </svg>
  )
}

/** Sleepy Mochi above an empty state's message, kawaii theme only. */
export function EmptyMochi({ className = '' }: { className?: string }) {
  return (
    <KawaiiOnly>
      <Mochi mood="sleepy" size={64} className={`mx-auto block ${className}`} />
    </KawaiiOnly>
  )
}
