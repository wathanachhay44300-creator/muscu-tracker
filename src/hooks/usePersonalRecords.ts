import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '../db'
import { setVolume } from '../lib/stats'

export interface PersonalRecords {
  /** Heaviest weight ever logged for a single set of this exercise. */
  bestWeight: number
  /** Highest single-set volume (weight × reps) ever logged for this exercise. */
  bestVolume: number
}

/** All-time bests for one exercise, across every session that ever used it. */
export function usePersonalRecords(exerciseId: number | undefined): PersonalRecords | undefined {
  return useLiveQuery(async () => {
    if (!exerciseId) return undefined
    const links = await db.workoutExercises.where('exerciseId').equals(exerciseId).toArray()
    let bestWeight = 0
    let bestVolume = 0
    for (const link of links) {
      const sets = await db.sets.where('workoutExerciseId').equals(link.id!).toArray()
      for (const s of sets) {
        if (s.weight > bestWeight) bestWeight = s.weight
        const vol = setVolume(s)
        if (vol > bestVolume) bestVolume = vol
      }
    }
    return { bestWeight, bestVolume }
  }, [exerciseId])
}
