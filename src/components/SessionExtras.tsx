import { useEffect, useRef, useState } from 'react'
import { updateWorkoutNotes, updateWorkoutRpe } from '../lib/workoutActions'
import type { Workout } from '../types'

const RPE_VALUES = Array.from({ length: 10 }, (_, i) => i + 1)

/** Overall perceived difficulty of a session (RPE 1-10). */
export function SessionRpe({ workout }: { workout: Workout }) {
  return (
    <div className="rounded-2xl border border-line bg-surface p-4 shadow-sm">
      <div className="mb-2 flex items-center justify-between">
        <p className="text-sm font-semibold text-ink-2">Ressenti de la séance (RPE)</p>
        {workout.rpe != null && (
          <button
            type="button"
            onClick={() => updateWorkoutRpe(workout.id!, null)}
            className="min-h-9 px-1 text-xs font-medium text-muted active:text-ink-2"
          >
            Effacer
          </button>
        )}
      </div>
      <div className="flex flex-wrap gap-1.5">
        {RPE_VALUES.map((n) => (
          <button
            key={n}
            type="button"
            onClick={() => updateWorkoutRpe(workout.id!, n)}
            aria-pressed={workout.rpe === n}
            className={`h-11 w-11 rounded-full text-sm font-semibold ${
              workout.rpe === n ? 'bg-accent text-on-accent' : 'bg-surface-3 text-ink-2 active:bg-surface-4'
            }`}
          >
            {n}
          </button>
        ))}
      </div>
    </div>
  )
}

/** Free-text session notes, saved automatically. */
export function SessionNotes({ workout }: { workout: Workout }) {
  const [notes, setNotes] = useState(workout.notes ?? '')
  const timeout = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)
  useEffect(() => () => clearTimeout(timeout.current), [])

  function change(value: string) {
    setNotes(value)
    clearTimeout(timeout.current)
    timeout.current = setTimeout(() => updateWorkoutNotes(workout.id!, value), 400)
  }

  return (
    <div className="rounded-2xl border border-line bg-surface p-4 shadow-sm">
      <p className="mb-2 text-sm font-semibold text-ink-2">Notes de séance</p>
      <textarea
        value={notes}
        onChange={(e) => change(e.target.value)}
        placeholder="Fatigue, sommeil, douleurs, contexte…"
        rows={3}
        className="w-full resize-none rounded-xl border border-line bg-surface-2 px-3.5 py-2.5 text-sm outline-none focus:border-accent-line"
      />
    </div>
  )
}
