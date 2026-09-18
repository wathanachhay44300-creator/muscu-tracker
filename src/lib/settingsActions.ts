import { db } from '../db'
import type { AppPreferences, PlateCalculatorSettings } from '../types'

export const DEFAULT_BAR_WEIGHT = 20
export const DEFAULT_PLATE_WEIGHTS = [20, 10, 5, 2.5, 1.25]

const SETTINGS_ID = 'plateCalculator' as const

function defaultSettings(): PlateCalculatorSettings {
  return {
    id: SETTINGS_ID,
    barWeight: DEFAULT_BAR_WEIGHT,
    plates: DEFAULT_PLATE_WEIGHTS.map((weight) => ({ weight, enabled: true })),
  }
}

export async function getPlateSettings(): Promise<PlateCalculatorSettings> {
  const existing = await db.settings.get(SETTINGS_ID)
  return (existing as PlateCalculatorSettings | undefined) ?? defaultSettings()
}

export async function updateBarWeight(barWeight: number): Promise<void> {
  const current = await getPlateSettings()
  await db.settings.put({ ...current, barWeight: Math.max(0, barWeight) })
}

export async function togglePlate(weight: number, enabled: boolean): Promise<void> {
  const current = await getPlateSettings()
  const plates = current.plates.map((p) => (p.weight === weight ? { ...p, enabled } : p))
  await db.settings.put({ ...current, plates })
}

const PREFERENCES_ID = 'appPreferences' as const

function defaultPreferences(): AppPreferences {
  // Off by default: the app is often used in a gym, where an unexpected
  // chime (or buzz) is more awkward than welcome — both are opt-in.
  return { id: PREFERENCES_ID, soundEnabled: false, hapticsEnabled: false }
}

export async function getPreferences(): Promise<AppPreferences> {
  const existing = await db.settings.get(PREFERENCES_ID)
  // Merged with defaults so a preferences row saved before a new field
  // existed (e.g. hapticsEnabled) doesn't come back `undefined` for it.
  return { ...defaultPreferences(), ...(existing as AppPreferences | undefined) }
}

export async function setSoundEnabled(soundEnabled: boolean): Promise<void> {
  const current = await getPreferences()
  await db.settings.put({ ...current, soundEnabled })
}

export async function setHapticsEnabled(hapticsEnabled: boolean): Promise<void> {
  const current = await getPreferences()
  await db.settings.put({ ...current, hapticsEnabled })
}
