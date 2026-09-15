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
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <p className="mb-2.5 text-sm font-semibold text-slate-700">{title}</p>
      <div className="space-y-2">
        {breakdown.map(({ group, count }) => (
          <div key={group} className="flex items-center justify-between text-sm">
            <span className="text-slate-600">{group}</span>
            <span className="font-semibold text-slate-900">
              {count} série{count > 1 ? 's' : ''}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}
