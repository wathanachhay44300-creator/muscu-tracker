import { useState, type CSSProperties } from 'react'

interface ConfettiPiece {
  id: number
  left: number
  delay: number
  duration: number
  color: string
  rotate: number
  drift: number
}

const COLORS = ['#4f46e5', '#f59e0b', '#10b981', '#38bdf8', '#f472b6']
const PIECE_COUNT = 26

function prefersReducedMotion(): boolean {
  return typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

function makePieces(): ConfettiPiece[] {
  return Array.from({ length: PIECE_COUNT }, (_, i) => ({
    id: i,
    left: Math.random() * 100,
    delay: Math.random() * 250,
    duration: 900 + Math.random() * 500,
    color: COLORS[i % COLORS.length],
    rotate: 180 + Math.random() * 360,
    drift: (Math.random() - 0.5) * 80,
  }))
}

/**
 * A brief confetti burst for the session-summary screen, shown only when a
 * personal record was set. Pure CSS transform/opacity animation, so it's
 * cheap on low-end phones — and skipped entirely under reduced motion
 * rather than just shortened, since it's purely decorative.
 */
export function Confetti() {
  const [pieces] = useState<ConfettiPiece[]>(() => (prefersReducedMotion() ? [] : makePieces()))

  if (pieces.length === 0) return null

  return (
    <div className="pointer-events-none fixed inset-0 z-50 overflow-hidden" aria-hidden="true">
      {pieces.map((p) => (
        <span
          key={p.id}
          className="confetti-piece"
          style={
            {
              left: `${p.left}%`,
              backgroundColor: p.color,
              animationDelay: `${p.delay}ms`,
              animationDuration: `${p.duration}ms`,
              '--confetti-drift': `${p.drift}px`,
              '--confetti-rotate': `${p.rotate}deg`,
            } as CSSProperties
          }
        />
      ))}
    </div>
  )
}
