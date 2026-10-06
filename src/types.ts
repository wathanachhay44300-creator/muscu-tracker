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

/** Equipment an exercise is done with (drives the library's equipment filter). */
export const EQUIPMENT = ['barre', 'halteres', 'ez', 'machine', 'smith', 'poulie', 'poids_du_corps'] as const
export type Equipment = (typeof EQUIPMENT)[number]

export const EQUIPMENT_LABEL: Record<Equipment, string> = {
  barre: 'Barre',
  halteres: 'Haltères',
  ez: 'Barre EZ',
  machine: 'Machine',
  smith: 'Smith',
  poulie: 'Poulie',
  poids_du_corps: 'Poids du corps',
}

/**
 * Finer muscles than `MuscleGroup`, used for the "muscles travaillés" lists
 * and the body diagram. Each one belongs to exactly one group (see data/muscles.ts).
 */
export type MuscleId =
  | 'pectoraux'
  | 'delt_ant'
  | 'delt_lat'
  | 'delt_post'
  | 'trapezes'
  | 'grand_dorsal'
  | 'milieu_dos'
  | 'lombaires'
  | 'biceps'
  | 'triceps'
  | 'avant_bras'
  | 'abdominaux'
  | 'obliques'
  | 'quadriceps'
  | 'adducteurs'
  | 'ischios'
  | 'fessiers'
  | 'moyen_fessier'
  | 'mollets'

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
  /** When the exercise was marked as a favorite; undefined when it isn't
   * one. Doubles as the sort key so the most recently favorited comes first. */
  favoritedAt?: number
  /** Stable id of the predefined library entry this row comes from (absent
   * for exercises the user created). Lets the library grow without duplicates. */
  seedId?: string
  equipment?: Equipment
  /** Muscles worked, for exercises the user created (predefined ones take
   * theirs from the bundled library). */
  primaryMuscles?: MuscleId[]
  secondaryMuscles?: MuscleId[]
  /** Personal notes shown on the exercise sheet. */
  notes?: string
  /** Optional link to a demonstration video the user likes. */
  videoUrl?: string
}

export interface Workout {
  id?: number
  /** ISO date, format yyyy-mm-dd */
  date: string
  createdAt: number
  notes?: string
  /** Custom title for this session only (never touches the program's name). */
  title?: string
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
  /** Free-text note on this exercise for this session (shown next time). */
  note?: string
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

/** Singleton settings row remembering which version of the predefined exercise library was synced. */
export interface ExerciseLibraryState {
  id: 'exerciseLibrary'
  version: number
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
  /** Body-weight objective, used for the indicative advice on the tracking screen. */
  goal: WeightGoal
  /** Target pace in kg/week (magnitude; the sign comes from `goal`). */
  goalRateKg: number
}

export type WeightGoal = 'loss' | 'maintain' | 'gain'

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
  /** Daily step count. Lives on the same per-day row as the weight, so
   * there is exactly one weight history shared by every screen. */
  steps?: number
  /** Daily calorie intake, in kcal. */
  calories?: number
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
