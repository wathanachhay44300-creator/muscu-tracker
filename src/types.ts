export const MUSCLE_GROUPS = [
  'Pectoraux',
  'Dos',
  'Épaules',
  'Biceps',
  'Triceps',
  'Jambes',
  'Abdominaux',
  'Cardio',
  'Autre',
] as const

export type MuscleGroup = (typeof MUSCLE_GROUPS)[number]

export interface Exercise {
  id?: number
  name: string
  muscleGroup: MuscleGroup
  isCustom: boolean
  createdAt: number
  /** Set when the exercise was removed from the library. The row (and its
   * name) is kept so past sessions that used it still display correctly —
   * it's just hidden from the picker and the exercise list. */
  deletedAt?: number
}

export interface Workout {
  id?: number
  /** ISO date, format yyyy-mm-dd */
  date: string
  createdAt: number
  notes?: string
  /** Overall perceived difficulty for the whole session, 1-10. */
  rpe?: number | null
}

/** Links an exercise to a workout, preserving the order it was added in. */
export interface WorkoutExercise {
  id?: number
  workoutId: number
  exerciseId: number
  order: number
}

export interface SetEntry {
  id?: number
  workoutExerciseId: number
  weight: number
  reps: number
  order: number
  createdAt: number
}

/** Convenience shape used in the UI: an exercise plus its sets within one workout. */
export interface WorkoutExerciseWithSets extends WorkoutExercise {
  exercise: Exercise
  sets: SetEntry[]
}
