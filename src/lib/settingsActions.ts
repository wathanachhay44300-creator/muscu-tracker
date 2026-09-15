import { db } from '../db'
import type { PlateCalculatorSettings } from '../types'

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
  return existing ?? defaultSettings()
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
