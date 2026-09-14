import Dexie, { type Table } from 'dexie'
import type { Exercise, SetEntry, Workout, WorkoutExercise } from './types'
import { DEFAULT_EXERCISES } from './lib/exercisesSeed'

class MuscuDB extends Dexie {
  exercises!: Table<Exercise, number>
  workouts!: Table<Workout, number>
  workoutExercises!: Table<WorkoutExercise, number>
  sets!: Table<SetEntry, number>

  constructor() {
    super('muscu-tracker')
    this.version(1).stores({
      exercises: '++id, name, muscleGroup, isCustom',
      workouts: '++id, date',
      workoutExercises: '++id, workoutId, exerciseId',
      sets: '++id, workoutExerciseId',
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
        isCustom: false,
        createdAt: now,
      })),
    )
  })
}
