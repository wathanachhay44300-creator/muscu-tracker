export const MUSCLE_GROUPS = [
  'Quadriceps',
  'Ischio-jambiers',
  'Fessiers',
  'Mollets',
  'Dos',
  'Pectoraux',
  'Épaules',
  'Biceps',
  'Triceps',
  'Abdominaux',
  'Avant-bras',
  'Autre',
] as const

export type MuscleGroup = (typeof MUSCLE_GROUPS)[number]

/** How an exercise is loaded, which determines whether/how the plate calculator applies. */
export const LOAD_TYPES = [
  'Barre libre',
  'Machine à plaques',
  'Poulie / pile de poids',
  'Haltères',
  'Poids du corps',
] as const

export type LoadType = (typeof LOAD_TYPES)[number]

export interface Exercise {
  id?: number
  name: string
  muscleGroup: MuscleGroup
  loadType: LoadType
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
  /** Set when the session was started from a template — used to find the
   * last time this same program was run, for pre-filling next time. */
  templateId?: number
  /** Set when the user taps "Terminer la séance" — marks it done and, with
   * `createdAt`, gives an approximate session duration for the summary. */
  finishedAt?: number
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

/** A reusable session blueprint, e.g. "Push", "Full Body". */
export interface WorkoutTemplate {
  id?: number
  name: string
  createdAt: number
}

/** Links an exercise to a template, with how many sets to pre-create when starting from it. */
export interface TemplateExercise {
  id?: number
  templateId: number
  exerciseId: number
  order: number
  targetSets: number
}

/** A template scheduled for a future (or today's) date. Consumed once that
 * session is actually started — it's a to-do, not a historical record. */
export interface PlannedSession {
  id?: number
  /** ISO date, format yyyy-mm-dd */
  date: string
  templateId: number
  createdAt: number
}

export interface PlateOption {
  weight: number
  enabled: boolean
}

/** Singleton settings row for the plate calculator (id is always fixed). */
export interface PlateCalculatorSettings {
  id: 'plateCalculator'
  barWeight: number
  plates: PlateOption[]
}

/** Singleton settings row for app-wide preferences (id is always fixed). */
export interface AppPreferences {
  id: 'appPreferences'
  /** Short chime played when a personal record is revealed on the session summary. */
  soundEnabled: boolean
  /** Light vibrations on set-added / long-press menu / PR, where supported. */
  hapticsEnabled: boolean
}

/** One day's body-weight/measurements entry. All fields optional so the user
 * can log just their weight some days and full measurements other days. */
export interface BodyMeasurement {
  id?: number
  /** ISO date, format yyyy-mm-dd. One entry per date (upserted). */
  date: string
  weight?: number
  chest?: number
  waist?: number
  hips?: number
  arms?: number
  thighs?: number
  createdAt: number
}

/** A locally-stored progress photo, organized by the date it was taken. */
export interface ProgressPhoto {
  id?: number
  /** ISO date, format yyyy-mm-dd. */
  date: string
  blob: Blob
  createdAt: number
}
