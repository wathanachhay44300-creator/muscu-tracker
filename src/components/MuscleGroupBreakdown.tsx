import { useMemo } from 'react'
import { countByMuscleGroup, SECONDARY_WEIGHT } from '../lib/stats'
import type { MuscleGroup } from '../types'

interface MuscleGroupBreakdownProps {
  items: { muscleGroup: MuscleGroup | undefined; secondaryGroups?: MuscleGroup[]; setCount: number }[]
  title?: string
}

/** "1,5 série" / "7 séries": halves appear because secondary muscles count for half a set. */
function formatSets(n: number): string {
  const text = n.toLocaleString('fr-FR', { maximumFractionDigits: 1 })
  return `${text} série${n > 1 ? 's' : ''}`
}

/** Simple sorted list of "Groupe : N séries" — no chart needed for this. */
export function MuscleGroupBreakdown({ items, title = 'Répartition par muscle' }: MuscleGroupBreakdownProps) {
  const breakdown = useMemo(() => countByMuscleGroup(items), [items])

  if (breakdown.length === 0) return null

  return (
    <div className="rounded-2xl border border-slate-200 bg-surface p-4 shadow-sm">
      <p className="mb-2.5 text-sm font-semibold text-slate-700">{title}</p>
      <div className="space-y-2">
        {breakdown.map(({ group, count }) => (
          <div key={group} className="flex items-center justify-between text-sm">
            <span className="text-slate-600">{group}</span>
            <span className="font-semibold tabular-nums text-slate-900">{formatSets(count)}</span>
          </div>
        ))}
      </div>
      <p className="mt-2.5 text-[11px] text-slate-400">
        Une série compte 1 pour le muscle principal et {String(SECONDARY_WEIGHT).replace('.', ',')} pour chaque muscle
        secondaire.
      </p>
    </div>
  )
}
