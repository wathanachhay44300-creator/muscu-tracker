import { useLiveQuery } from 'dexie-react-hooks'
import { getLastPerformance, type LastPerformance } from '../lib/performance'

/**
 * The most recent *other* session that logged this exercise, so it can be
 * shown for comparison while filling in today's sets. Returns `null` when
 * there is no earlier session (as opposed to `undefined`, which means the
 * query hasn't resolved yet).
 */
export function useLastPerformance(
  exerciseId: number | undefined,
  excludeWorkoutId: number | undefined,
): LastPerformance | null | undefined {
  return useLiveQuery(async () => {
    if (!exerciseId) return undefined
    return getLastPerformance(exerciseId, excludeWorkoutId)
  }, [exerciseId, excludeWorkoutId])
}
