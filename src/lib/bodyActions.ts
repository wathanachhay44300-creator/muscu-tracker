import { db } from '../db'
import type { BodyMeasurement } from '../types'

type MeasurementFields = Omit<BodyMeasurement, 'id' | 'date' | 'createdAt'>

/** Creates or updates the single measurement entry for a given date. */
export async function upsertBodyMeasurement(date: string, patch: Partial<MeasurementFields>): Promise<void> {
  await db.transaction('rw', db.bodyMeasurements, async () => {
    const existing = await db.bodyMeasurements.where('date').equals(date).first()
    if (existing?.id) {
      await db.bodyMeasurements.update(existing.id, patch)
      // Clearing the last remaining field leaves an empty day: drop it so
      // charts and averages only ever see days that actually have data.
      const updated = await db.bodyMeasurements.get(existing.id)
      if (updated && !hasAnyValue(updated)) await db.bodyMeasurements.delete(existing.id)
    } else if (Object.values(patch).some((v) => v != null)) {
      await db.bodyMeasurements.add({ date, createdAt: Date.now(), ...patch })
    }
  })
}

const VALUE_KEYS = ['weight', 'chest', 'waist', 'hips', 'arms', 'thighs', 'steps', 'calories'] as const

function hasAnyValue(m: BodyMeasurement): boolean {
  return VALUE_KEYS.some((k) => m[k] != null)
}

export async function getBodyMeasurementForDate(date: string): Promise<BodyMeasurement | undefined> {
  return db.bodyMeasurements.where('date').equals(date).first()
}

/** All measurements, oldest first — convenient for charting and history lists. */
export async function getBodyMeasurements(): Promise<BodyMeasurement[]> {
  return db.bodyMeasurements.orderBy('date').toArray()
}

export async function deleteBodyMeasurement(id: number): Promise<void> {
  await db.bodyMeasurements.delete(id)
}
