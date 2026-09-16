import { db } from '../db'
import { todayISO } from './date'
import type {
  AppPreferences,
  BodyMeasurement,
  Exercise,
  PlannedSession,
  PlateCalculatorSettings,
  SetEntry,
  TemplateExercise,
  Workout,
  WorkoutExercise,
  WorkoutTemplate,
} from '../types'

const EXPORT_VERSION = 1

interface ExportedPhoto {
  id?: number
  date: string
  createdAt: number
  blobBase64: string
  blobType: string
}

interface ExportData {
  version: number
  exportedAt: number
  exercises: Exercise[]
  workouts: Workout[]
  workoutExercises: WorkoutExercise[]
  sets: SetEntry[]
  workoutTemplates: WorkoutTemplate[]
  templateExercises: TemplateExercise[]
  plannedSessions: PlannedSession[]
  settings: (PlateCalculatorSettings | AppPreferences)[]
  bodyMeasurements: BodyMeasurement[]
  progressPhotos: ExportedPhoto[]
}

function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  a.remove()
  URL.revokeObjectURL(url)
}

async function blobToBase64(blob: Blob): Promise<string> {
  const buffer = await blob.arrayBuffer()
  const bytes = new Uint8Array(buffer)
  let binary = ''
  const chunkSize = 0x8000
  for (let i = 0; i < bytes.length; i += chunkSize) {
    binary += String.fromCharCode(...bytes.subarray(i, i + chunkSize))
  }
  return btoa(binary)
}

function base64ToBlob(base64: string, type: string): Blob {
  const binary = atob(base64)
  const bytes = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i)
  return new Blob([bytes], { type })
}

export interface DataSummary {
  workouts: number
  exercises: number
  templates: number
  bodyMeasurements: number
  photos: number
}

export async function getDataSummary(): Promise<DataSummary> {
  const [workouts, exercises, templates, bodyMeasurements, photos] = await Promise.all([
    db.workouts.count(),
    db.exercises.count(),
    db.workoutTemplates.count(),
    db.bodyMeasurements.count(),
    db.progressPhotos.count(),
  ])
  return { workouts, exercises, templates, bodyMeasurements, photos }
}

/** Exports every table as a single JSON file the user can save anywhere, for
 * manual backup/restore — there's no account or server-side storage. */
export async function exportAllDataJSON(): Promise<void> {
  const [
    exercises,
    workouts,
    workoutExercises,
    sets,
    workoutTemplates,
    templateExercises,
    plannedSessions,
    settings,
    bodyMeasurements,
    photos,
  ] = await Promise.all([
    db.exercises.toArray(),
    db.workouts.toArray(),
    db.workoutExercises.toArray(),
    db.sets.toArray(),
    db.workoutTemplates.toArray(),
    db.templateExercises.toArray(),
    db.plannedSessions.toArray(),
    db.settings.toArray(),
    db.bodyMeasurements.toArray(),
    db.progressPhotos.toArray(),
  ])

  const progressPhotos: ExportedPhoto[] = await Promise.all(
    photos.map(async (p) => ({
      id: p.id,
      date: p.date,
      createdAt: p.createdAt,
      blobBase64: await blobToBase64(p.blob),
      blobType: p.blob.type || 'image/jpeg',
    })),
  )

  const data: ExportData = {
    version: EXPORT_VERSION,
    exportedAt: Date.now(),
    exercises,
    workouts,
    workoutExercises,
    sets,
    workoutTemplates,
    templateExercises,
    plannedSessions,
    settings,
    bodyMeasurements,
    progressPhotos,
  }

  downloadBlob(new Blob([JSON.stringify(data)], { type: 'application/json' }), `muscu-tracker-${todayISO()}.json`)
}

/** Replaces ALL local data with the contents of a previously exported JSON
 * file. Destructive and irreversible — the caller must confirm with the
 * user before calling this. */
export async function importDataJSON(file: File): Promise<void> {
  const text = await file.text()
  let data: ExportData
  try {
    data = JSON.parse(text)
  } catch {
    throw new Error('Ce fichier n’est pas un export JSON valide.')
  }
  if (!data || typeof data !== 'object' || !Array.isArray(data.workouts) || !Array.isArray(data.exercises)) {
    throw new Error('Ce fichier n’est pas un export Muscu Tracker valide.')
  }

  const progressPhotos = await Promise.all(
    (data.progressPhotos ?? []).map(async (p) => ({
      id: p.id,
      date: p.date,
      createdAt: p.createdAt,
      blob: base64ToBlob(p.blobBase64, p.blobType),
    })),
  )

  await db.transaction(
    'rw',
    [
      db.exercises,
      db.workouts,
      db.workoutExercises,
      db.sets,
      db.workoutTemplates,
      db.templateExercises,
      db.plannedSessions,
      db.settings,
      db.bodyMeasurements,
      db.progressPhotos,
    ],
    async () => {
      await Promise.all([
        db.exercises.clear(),
        db.workouts.clear(),
        db.workoutExercises.clear(),
        db.sets.clear(),
        db.workoutTemplates.clear(),
        db.templateExercises.clear(),
        db.plannedSessions.clear(),
        db.settings.clear(),
        db.bodyMeasurements.clear(),
        db.progressPhotos.clear(),
      ])
      await Promise.all([
        db.exercises.bulkPut(data.exercises ?? []),
        db.workouts.bulkPut(data.workouts ?? []),
        db.workoutExercises.bulkPut(data.workoutExercises ?? []),
        db.sets.bulkPut(data.sets ?? []),
        db.workoutTemplates.bulkPut(data.workoutTemplates ?? []),
        db.templateExercises.bulkPut(data.templateExercises ?? []),
        db.plannedSessions.bulkPut(data.plannedSessions ?? []),
        db.settings.bulkPut(data.settings ?? []),
        db.bodyMeasurements.bulkPut(data.bodyMeasurements ?? []),
        db.progressPhotos.bulkPut(progressPhotos),
      ])
    },
  )
}

function csvEscape(value: string): string {
  return /[;"\n]/.test(value) ? `"${value.replace(/"/g, '""')}"` : value
}

/** French-locale number formatting for the CSV (comma decimal separator),
 * consistent with the semicolon field delimiter used below. */
function csvNumber(n: number): string {
  return String(n).replace('.', ',')
}

/** Exports session history as a flattened CSV (one row per set) — a bonus
 * alongside the JSON export, handy for opening in a spreadsheet. */
export async function exportHistoryCSV(): Promise<void> {
  const workouts = await db.workouts.orderBy('date').toArray()
  const rows = ['Date;Exercice;Groupe musculaire;Série;Poids (kg);Répétitions;Volume (kg)']

  for (const workout of workouts) {
    const links = await db.workoutExercises.where('workoutId').equals(workout.id!).sortBy('order')
    for (const link of links) {
      const exercise = await db.exercises.get(link.exerciseId)
      const sets = await db.sets.where('workoutExerciseId').equals(link.id!).sortBy('order')
      sets.forEach((set, i) => {
        rows.push(
          [
            workout.date,
            csvEscape(exercise?.name ?? ''),
            csvEscape(exercise?.muscleGroup ?? ''),
            String(i + 1),
            csvNumber(set.weight),
            String(set.reps),
            csvNumber(set.weight * set.reps),
          ].join(';'),
        )
      })
    }
  }

  // UTF-8 BOM so Excel detects the encoding correctly on Windows.
  downloadBlob(
    new Blob(['﻿' + rows.join('\r\n')], { type: 'text/csv;charset=utf-8' }),
    `muscu-tracker-historique-${todayISO()}.csv`,
  )
}
