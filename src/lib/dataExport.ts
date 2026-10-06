import { db } from '../db'
import { todayISO } from './date'
import { syncExerciseLibrary } from './exerciseLibrarySync'
import type {
  AppPreferences,
  BodyMeasurement,
  Exercise,
  ExerciseLibraryState,
  PlateCalculatorSettings,
  SetEntry,
  TemplateExercise,
  Workout,
  WorkoutExercise,
  WorkoutTemplate,
} from '../types'

const EXPORT_VERSION = 1

interface ExportData {
  version: number
  exportedAt: number
  exercises: Exercise[]
  workouts: Workout[]
  workoutExercises: WorkoutExercise[]
  sets: SetEntry[]
  workoutTemplates: WorkoutTemplate[]
  templateExercises: TemplateExercise[]
  settings: (PlateCalculatorSettings | AppPreferences | ExerciseLibraryState)[]
  bodyMeasurements: BodyMeasurement[]
}

export function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  a.remove()
  URL.revokeObjectURL(url)
}

export interface DataSummary {
  workouts: number
  exercises: number
  templates: number
  bodyMeasurements: number
}

export async function getDataSummary(): Promise<DataSummary> {
  const [workouts, exercises, templates, bodyMeasurements] = await Promise.all([
    db.workouts.count(),
    db.exercises.count(),
    db.workoutTemplates.count(),
    db.bodyMeasurements.count(),
  ])
  return { workouts, exercises, templates, bodyMeasurements }
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
    settings,
    bodyMeasurements,
  ] = await Promise.all([
    db.exercises.toArray(),
    db.workouts.toArray(),
    db.workoutExercises.toArray(),
    db.sets.toArray(),
    db.workoutTemplates.toArray(),
    db.templateExercises.toArray(),
    db.settings.toArray(),
    db.bodyMeasurements.toArray(),
  ])

  const data: ExportData = {
    version: EXPORT_VERSION,
    exportedAt: Date.now(),
    exercises,
    workouts,
    workoutExercises,
    sets,
    workoutTemplates,
    templateExercises,
    settings,
    bodyMeasurements,
  }

  downloadBlob(new Blob([JSON.stringify(data)], { type: 'application/json' }), `muscu-tracker-${todayISO()}.json`)
}

/** Replaces all local data (except stored progress photos, which are no
 * longer part of the app and are left untouched) with the contents of a
 * previously exported JSON file; `progressPhotos` and `plannedSessions` fields
 * in an old backup (removed features) are simply ignored. Destructive and irreversible — the caller must confirm with the
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

  await db.transaction(
    'rw',
    [
      db.exercises,
      db.workouts,
      db.workoutExercises,
      db.sets,
      db.workoutTemplates,
      db.templateExercises,
      db.settings,
      db.bodyMeasurements,
    ],
    async () => {
      await Promise.all([
        db.exercises.clear(),
        db.workouts.clear(),
        db.workoutExercises.clear(),
        db.sets.clear(),
        db.workoutTemplates.clear(),
        db.templateExercises.clear(),
        db.settings.clear(),
        db.bodyMeasurements.clear(),
      ])
      await Promise.all([
        db.exercises.bulkPut(data.exercises ?? []),
        db.workouts.bulkPut(data.workouts ?? []),
        db.workoutExercises.bulkPut(data.workoutExercises ?? []),
        db.sets.bulkPut(data.sets ?? []),
        db.workoutTemplates.bulkPut(data.workoutTemplates ?? []),
        db.templateExercises.bulkPut(data.templateExercises ?? []),
        db.settings.bulkPut(data.settings ?? []),
        db.bodyMeasurements.bulkPut(data.bodyMeasurements ?? []),
      ])
    },
  )
  // A backup made before some library exercises existed: bring them in right away.
  await syncExerciseLibrary()
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
