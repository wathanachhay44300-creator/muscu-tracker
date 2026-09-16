import { useLiveQuery } from 'dexie-react-hooks'
import { getBodyMeasurementForDate, getBodyMeasurements } from '../lib/bodyActions'

export function useBodyMeasurements() {
  return useLiveQuery(() => getBodyMeasurements(), [])
}

export function useBodyMeasurementForDate(date: string) {
  return useLiveQuery(() => getBodyMeasurementForDate(date), [date])
}
