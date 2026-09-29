import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '../db'
import type { Exercise } from '../types'

export interface ExerciseLibrary {
  /** Every non-deleted exercise, A-Z. */
  all: Exercise[]
  /** Manually starred exercises, most recently favorited first. */
  favorites: Exercise[]
  /** Exercise ids used in recent sessions and not already a favorite, most
   * recent first — so the exercises actually in rotation stay one tap away. */
  recentIds: number[]
}

/** How many past sessions to scan for "recently used" — bounded so this stays
 * cheap no matter how long the training history gets. */
const RECENT_WORKOUTS_SCANNED = 30
const RECENT_LIMIT = 6

export function useExerciseLibrary(): ExerciseLibrary | undefined {
  return useLiveQuery(async () => {
    const all = await db.exercises.orderBy('name').filter((e) => !e.deletedAt).toArray()
    const favorites = all
      .filter((e) => e.favoritedAt)
      .sort((a, b) => b.favoritedAt! - a.favoritedAt!)
    const favoriteIds = new Set(favorites.map((e) => e.id!))
    const validIds = new Set(all.map((e) => e.id!))

    const recentWorkouts = await db.workouts.orderBy('date').reverse().limit(RECENT_WORKOUTS_SCANNED).toArray()
    const workoutRank = new Map(recentWorkouts.map((w, i) => [w.id!, i]))
    const links = await db.workoutExercises.where('workoutId').anyOf([...workoutRank.keys()]).toArray()
    links.sort((a, b) => workoutRank.get(a.workoutId)! - workoutRank.get(b.workoutId)!)

    const seen = new Set<number>()
    const recentIds: number[] = []
    for (const link of links) {
      if (favoriteIds.has(link.exerciseId) || seen.has(link.exerciseId) || !validIds.has(link.exerciseId)) continue
      seen.add(link.exerciseId)
      recentIds.push(link.exerciseId)
      if (recentIds.length >= RECENT_LIMIT) break
    }

    return { all, favorites, recentIds }
  }, [])
}
