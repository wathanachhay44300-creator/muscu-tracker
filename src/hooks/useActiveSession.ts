import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '../db'
import { todayISO } from '../lib/date'
import { getWorkoutForDate } from '../lib/workoutActions'
import type { Workout } from '../types'
import { t } from '../i18n'

export interface ActiveSession {
  workout: Workout
  /** Session title: custom title, program name, or "Séance libre". */
  title: string
  exerciseCount: number
  setCount: number
}

/**
 * Today's session in progress (started and not finished), or null. Drives
 * the "Reprendre" card on the home screen and the "Séance en cours" banner.
 */
export function useActiveSession(): ActiveSession | null | undefined {
  return useLiveQuery(async () => {
    const workout = await getWorkoutForDate(todayISO())
    if (!workout?.id) return null
    const links = await db.workoutExercises.where('workoutId').equals(workout.id).toArray()
    const setCount = links.length
      ? await db.sets.where('workoutExerciseId').anyOf(links.map((l) => l.id!)).count()
      : 0
    const template = workout.templateId ? await db.workoutTemplates.get(workout.templateId) : undefined
    return {
      workout,
      title: workout.title ?? template?.name ?? t('common.freeSession'),
      exerciseCount: links.length,
      setCount,
    }
  }, [])
}
