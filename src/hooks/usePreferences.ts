import { useLiveQuery } from 'dexie-react-hooks'
import { getPreferences } from '../lib/settingsActions'
import type { AppPreferences } from '../types'

export function usePreferences(): AppPreferences | undefined {
  return useLiveQuery(() => getPreferences(), [])
}
