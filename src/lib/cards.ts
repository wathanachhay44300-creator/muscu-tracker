/** Playing-card suits used by the Joker Aura theme's decorations. */
export type Suit = 'spade' | 'heart' | 'diamond' | 'club'

/** Program chips: ♣ violet, ♥ magenta, ♦ violet, ♠ magenta, then again. */
export const PROGRAM_SUITS: { suit: Suit; color: string }[] = [
  { suit: 'club', color: 'var(--joker-violet)' },
  { suit: 'heart', color: 'var(--joker-magenta)' },
  { suit: 'diamond', color: 'var(--joker-violet)' },
  { suit: 'spade', color: 'var(--joker-magenta)' },
]
