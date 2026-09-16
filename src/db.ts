import Dexie, { type Table } from 'dexie'
import type {
  AppPreferences,
  BodyMeasurement,
  Exercise,
  PlannedSession,
  PlateCalculatorSettings,
  ProgressPhoto,
  SetEntry,
  TemplateExercise,
  Workout,
  WorkoutExercise,
  WorkoutTemplate,
} from './types'
import { DEFAULT_EXERCISES } from './lib/exercisesSeed'

class MuscuDB extends Dexie {
  exercises!: Table<Exercise, number>
  workouts!: Table<Workout, number>
  workoutExercises!: Table<WorkoutExercise, number>
  sets!: Table<SetEntry, number>
  workoutTemplates!: Table<WorkoutTemplate, number>
  templateExercises!: Table<TemplateExercise, number>
  plannedSessions!: Table<PlannedSession, number>
  // A single keyed store shared by every singleton settings row (plate
  // calculator preferences, app preferences, …), distinguished by `id`.
  settings!: Table<PlateCalculatorSettings | AppPreferences, string>
  bodyMeasurements!: Table<BodyMeasurement, number>
  progressPhotos!: Table<ProgressPhoto, number>

  constructor() {
    super('muscu-tracker')
    this.version(1).stores({
      exercises: '++id, name, muscleGroup, isCustom',
      workouts: '++id, date',
      workoutExercises: '++id, workoutId, exerciseId',
      sets: '++id, workoutExerciseId',
    })
    // v2: templates (Phase 3) — unchanged stores are repeated, as Dexie
    // requires each version to declare the full schema it wants.
    this.version(2).stores({
      exercises: '++id, name, muscleGroup, isCustom',
      workouts: '++id, date',
      workoutExercises: '++id, workoutId, exerciseId',
      sets: '++id, workoutExerciseId',
      workoutTemplates: '++id, name',
      templateExercises: '++id, templateId, exerciseId',
      plannedSessions: '++id, date, templateId',
    })
    // v3: settings (plate calculator preferences).
    this.version(3).stores({
      exercises: '++id, name, muscleGroup, isCustom',
      workouts: '++id, date',
      workoutExercises: '++id, workoutId, exerciseId',
      sets: '++id, workoutExerciseId',
      workoutTemplates: '++id, name',
      templateExercises: '++id, templateId, exerciseId',
      plannedSessions: '++id, date, templateId',
      settings: 'id',
    })
    // v4: workouts remember which template they were started from, so the
    // next quick-start from that program can pre-fill from it specifically.
    this.version(4).stores({
      exercises: '++id, name, muscleGroup, isCustom',
      workouts: '++id, date, templateId',
      workoutExercises: '++id, workoutId, exerciseId',
      sets: '++id, workoutExerciseId',
      workoutTemplates: '++id, name',
      templateExercises: '++id, templateId, exerciseId',
      plannedSessions: '++id, date, templateId',
      settings: 'id',
    })
    // v5: Phase 4 — body measurements over time and local progress photos.
    this.version(5).stores({
      exercises: '++id, name, muscleGroup, isCustom',
      workouts: '++id, date, templateId',
      workoutExercises: '++id, workoutId, exerciseId',
      sets: '++id, workoutExerciseId',
      workoutTemplates: '++id, name',
      templateExercises: '++id, templateId, exerciseId',
      plannedSessions: '++id, date, templateId',
      settings: 'id',
      bodyMeasurements: '++id, date',
      progressPhotos: '++id, date',
    })
  }
}

export const db = new MuscuDB()

/**
 * Seeds the default exercise library the first time the app runs.
 * Wrapped in a single transaction so the check-then-write is atomic even if
 * called twice concurrently (e.g. React StrictMode double-invoking effects).
 */
export async function ensureSeedData() {
  await db.transaction('rw', db.exercises, async () => {
    const count = await db.exercises.count()
    if (count > 0) return
    const now = Date.now()
    await db.exercises.bulkAdd(
      DEFAULT_EXERCISES.map((e) => ({
        name: e.name,
        muscleGroup: e.muscleGroup,
        loadType: e.loadType,
        isCustom: false,
        createdAt: now,
      })),
    )
  })
}
