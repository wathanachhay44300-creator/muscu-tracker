import { db } from '../db'
import { resizeImageFile } from './imageResize'

export async function addProgressPhoto(date: string, file: File): Promise<void> {
  const blob = await resizeImageFile(file)
  await db.progressPhotos.add({ date, blob, createdAt: Date.now() })
}

/** All photos, most recent date first — for the date-grouped grid. */
export async function getProgressPhotos() {
  return db.progressPhotos.orderBy('date').reverse().toArray()
}

export async function deleteProgressPhoto(id: number): Promise<void> {
  await db.progressPhotos.delete(id)
}
