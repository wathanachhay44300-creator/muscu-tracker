import { useLiveQuery } from 'dexie-react-hooks'
import { getPersonalRecords, type PersonalRecords } from '../lib/performance'

export type { PersonalRecords }

/** All-time bests for one exercise, across every session that ever used it. */
export function usePersonalRecords(exerciseId: number | undefined): PersonalRecords | undefined {
  return useLiveQuery(async () => {
    if (!exerciseId) return undefined
    return getPersonalRecords(exerciseId)
  }, [exerciseId])
}
