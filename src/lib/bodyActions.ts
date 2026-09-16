import { db } from '../db'
import type { BodyMeasurement } from '../types'

type MeasurementFields = Omit<BodyMeasurement, 'id' | 'date' | 'createdAt'>

/** Creates or updates the single measurement entry for a given date. */
export async function upsertBodyMeasurement(date: string, patch: Partial<MeasurementFields>): Promise<void> {
  const existing = await db.bodyMeasurements.where('date').equals(date).first()
  if (existing?.id) {
    await db.bodyMeasurements.update(existing.id, patch)
  } else {
    await db.bodyMeasurements.add({ date, createdAt: Date.now(), ...patch })
  }
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
