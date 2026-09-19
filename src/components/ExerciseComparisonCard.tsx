import type { CSSProperties } from 'react'
import type { WorkoutExerciseWithSets } from '../types'
import type { ExerciseComparison, SetComparison } from '../hooks/useWorkoutComparison'
import { formatWeight } from '../lib/stats'
import { StarIcon } from './Icons'

interface ExerciseComparisonCardProps {
  we: WorkoutExerciseWithSets
  comparison: ExerciseComparison | undefined
  style?: CSSProperties
}

export function ExerciseComparisonCard({ we, comparison, style }: ExerciseComparisonCardProps) {
  const hasHistory = !!comparison?.previous
  const sets = comparison?.sets ?? []

  return (
    <div className="animate-fade-in rounded-2xl border border-slate-200 bg-surface p-4 shadow-sm" style={style}>
      <p className="font-exercise text-[0.95rem] text-slate-900">{we.exercise.name}</p>
      <p className="mb-2.5 text-xs font-medium text-slate-400">{we.exercise.muscleGroup}</p>

      {!hasHistory && (
        <p className="mb-2 rounded-lg bg-slate-50 px-2.5 py-2 text-xs text-slate-500">
          Première fois sur cet exercice — rien à comparer.
        </p>
      )}

      <div className="space-y-1.5">
        {we.sets.map((set, i) => (
          <SetComparisonRow
            key={set.id}
            index={i}
            set={sets[i] ?? { weight: set.weight, reps: set.reps, previousWeight: null, previousReps: null, isPR: false }}
            hasHistory={hasHistory}
            rowDelayMs={i * 40}
          />
        ))}
      </div>
    </div>
  )
}

function SetComparisonRow({
  index,
  set,
  hasHistory,
  rowDelayMs,
}: {
  index: number
  set: SetComparison
  hasHistory: boolean
  rowDelayMs: number
}) {
  const hasPreviousSet = set.previousWeight != null && set.previousReps != null
  const weightDelta = hasPreviousSet ? round2(set.weight - set.previousWeight!) : 0
  const repsDelta = hasPreviousSet ? set.reps - set.previousReps! : 0
  const tone: 'up' | 'down' | 'flat' =
    weightDelta > 0 || (weightDelta === 0 && repsDelta > 0)
      ? 'up'
      : weightDelta < 0 || (weightDelta === 0 && repsDelta < 0)
        ? 'down'
        : 'flat'

  const toneClass = { up: 'text-emerald-600', down: 'text-red-700', flat: 'text-slate-500' }[tone]
  const toneArrow = { up: '↑', down: '↓', flat: '→' }[tone]

  // The pill gets its own slightly-delayed entrance on top of the row's own
  // fade-in, so the progress indicator "pops" in just after the row lands —
  // a small game-y flourish rather than everything appearing at once.
  const pillDelayMs = rowDelayMs + 80

  return (
    <div
      className={`flex items-center justify-between gap-2 rounded-xl px-3 py-2 text-sm ${
        set.isPR ? 'animate-pop-in bg-amber-50 ring-1 ring-amber-200' : 'animate-fade-in bg-slate-50'
      }`}
      style={{ animationDelay: `${rowDelayMs}ms` }}
    >
      <div className="flex min-w-0 items-center gap-1.5">
        {set.isPR && <StarIcon className="pr-star-glow h-3.5 w-3.5 shrink-0 text-amber-500" />}
        <span className="shrink-0 text-slate-400">Série {index + 1}</span>
        <span className="truncate font-semibold text-slate-900">
          {formatWeight(set.weight)}kg × {set.reps}
        </span>
      </div>
      {hasPreviousSet ? (
        <span
          className={`animate-fade-in shrink-0 rounded-full bg-slate-100 px-2 py-0.5 text-xs font-semibold ${toneClass}`}
          style={{ animationDelay: `${pillDelayMs}ms` }}
        >
          {toneArrow} {formatDelta(weightDelta, repsDelta)}
        </span>
      ) : hasHistory ? (
        <span className="shrink-0 text-xs font-medium text-slate-400">Nouvelle série</span>
      ) : null}
    </div>
  )
}

function formatDelta(weightDelta: number, repsDelta: number): string {
  const parts: string[] = []
  if (weightDelta !== 0) parts.push(`${weightDelta > 0 ? '+' : ''}${formatWeight(weightDelta)}kg`)
  if (repsDelta !== 0) parts.push(`${repsDelta > 0 ? '+' : ''}${repsDelta} reps`)
  return parts.length > 0 ? parts.join(', ') : 'identique'
}

function round2(n: number): number {
  return Math.round(n * 100) / 100
}
