import { useMemo } from 'react'
import { countByMuscleGroup } from '../lib/stats'
import type { MuscleGroup } from '../types'

interface MuscleGroupBreakdownProps {
  items: { muscleGroup: MuscleGroup | undefined; setCount: number }[]
  title?: string
}

/** Simple sorted list of "Groupe : N séries" — no chart needed for this. */
export function MuscleGroupBreakdown({ items, title = 'Répartition par muscle' }: MuscleGroupBreakdownProps) {
  const breakdown = useMemo(() => countByMuscleGroup(items), [items])

  if (breakdown.length === 0) return null

  return (
    <div className="rounded-2xl border border-line bg-surface p-4 shadow-sm">
      <p className="mb-2.5 text-sm font-semibold text-ink-2">{title}</p>
      <div className="space-y-2">
        {breakdown.map(({ group, count }) => (
          <div key={group} className="flex items-center justify-between text-sm">
            <span className="text-ink-2">{group}</span>
            <span className="font-semibold text-ink">
              {count} série{count > 1 ? 's' : ''}
            </span>
          </div>
        ))}
      </div>
      <p className="mt-2.5 text-[11px] text-muted">
        Seul le muscle principal de chaque exercice est compté.
      </p>
    </div>
  )
}
