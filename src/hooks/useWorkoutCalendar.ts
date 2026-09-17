import { useLiveQuery } from 'dexie-react-hooks'
import { getAllWorkoutDates, type WorkoutDate } from '../lib/calendarActions'

export function useWorkoutCalendarDates(): WorkoutDate[] | undefined {
  return useLiveQuery(() => getAllWorkoutDates(), [])
}
