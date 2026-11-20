import { useWorkoutHistory } from '../hooks/useHistory'
import { formatDateFr, relativeDateLabel } from '../lib/date'
import { formatVolume } from '../lib/stats'
import { ChevronRightIcon, ClipboardIcon, XIcon } from './Icons'

interface DuplicateSessionSheetProps {
  onSelect: (workoutId: number) => void
  onClose: () => void
}

/** Bottom sheet listing past sessions to copy wholesale (exercises + exact
 * weights/reps) into today's session — for a one-off day you don't want to
 * save as a permanent program. */
export function DuplicateSessionSheet({ onSelect, onClose }: DuplicateSessionSheetProps) {
  const history = useWorkoutHistory()
  const withExercises = history?.filter((h) => h.exerciseCount > 0) ?? []

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-scrim/40 animate-fade-in-backdrop sm:items-center sm:p-4"
      onClick={onClose}
    >
      <div
        className="flex max-h-[80vh] w-full max-w-sm flex-col animate-slide-up rounded-t-2xl bg-surface pb-safe shadow-lg sm:rounded-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-5 pt-5 pb-3">
          <h2 className="text-base font-semibold text-ink">Dupliquer une séance précédente</h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-1.5 text-muted active:bg-surface-3"
            aria-label="Fermer"
          >
            <XIcon className="h-5 w-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-5 pb-5">
          {withExercises.length === 0 ? (
            <div className="flex flex-col items-center gap-2 rounded-2xl border border-dashed border-line-strong px-4 py-10 text-center">
              <ClipboardIcon className="h-8 w-8 text-faint" />
              <p className="text-sm text-muted">Aucune séance à dupliquer pour l'instant.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {withExercises.map(({ workout, exerciseCount, setCount, volume }) => (
                <button
                  key={workout.id}
                  type="button"
                  onClick={() => onSelect(workout.id!)}
                  className="flex w-full items-center justify-between rounded-2xl border border-line bg-surface px-4 py-3 text-left active:bg-surface-2"
                >
                  <div>
                    <p className="font-semibold text-ink">{relativeDateLabel(workout.date)}</p>
                    <p className="text-xs text-muted">{formatDateFr(workout.date)}</p>
                    <p className="mt-1 text-sm text-muted">
                      {exerciseCount} exercice{exerciseCount > 1 ? 's' : ''} · {setCount} série
                      {setCount > 1 ? 's' : ''}
                      {volume > 0 && <> · {formatVolume(volume)} kg</>}
                    </p>
                  </div>
                  <ChevronRightIcon className="h-4 w-4 shrink-0 text-faint" />
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
