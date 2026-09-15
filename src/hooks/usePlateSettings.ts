import { useLiveQuery } from 'dexie-react-hooks'
import { getPlateSettings } from '../lib/settingsActions'
import type { PlateCalculatorSettings } from '../types'

export function usePlateSettings(): PlateCalculatorSettings | undefined {
  return useLiveQuery(() => getPlateSettings(), [])
}
