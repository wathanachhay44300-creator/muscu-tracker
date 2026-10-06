import Dexie, { type Table } from 'dexie'
import type {
  AppPreferences,
  BodyMeasurement,
  Exercise,
  ExerciseLibraryState,
  PlateCalculatorSettings,
  ProgressPhoto,
  SetEntry,
  TemplateExercise,
  Workout,
  WorkoutExercise,
  WorkoutTemplate,
} from './types'

class MuscuDB extends Dexie {
  exercises!: Table<Exercise, number>
  workouts!: Table<Workout, number>
  workoutExercises!: Table<WorkoutExercise, number>
  sets!: Table<SetEntry, number>
  workoutTemplates!: Table<WorkoutTemplate, number>
  templateExercises!: Table<TemplateExercise, number>
  // A single keyed store shared by every singleton settings row (plate
  // calculator preferences, app preferences, …), distinguished by `id`.
  settings!: Table<PlateCalculatorSettings | AppPreferences | ExerciseLibraryState, string>
  bodyMeasurements!: Table<BodyMeasurement, number>
  progressPhotos!: Table<ProgressPhoto, number>

  constructor() {
    super('muscu-tracker')
    // NOTE: the `plannedSessions` store below belongs to the removed planning
    // feature. It stays declared in the schema (without any accessor) so rows
    // already on a device are neither migrated nor deleted — just never read.
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
    // (The photos feature was later removed from the UI; the store is kept so
    // photos already on the device are never deleted.)
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
