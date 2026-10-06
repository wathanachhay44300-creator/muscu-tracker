import type { MuscleGroup, MuscleId } from '../types'

/** Display name and parent group of each muscle used by the exercise sheet and body diagram. */
export const MUSCLES: Record<MuscleId, { label: string; group: MuscleGroup }> = {
  pectoraux: { label: 'Pectoraux', group: 'Pectoraux' },
  delt_ant: { label: 'Deltoïdes antérieurs', group: 'Épaules' },
  delt_lat: { label: 'Deltoïdes latéraux', group: 'Épaules' },
  delt_post: { label: 'Deltoïdes postérieurs', group: 'Épaules' },
  trapezes: { label: 'Trapèzes', group: 'Dos' },
  grand_dorsal: { label: 'Grand dorsal', group: 'Dos' },
  milieu_dos: { label: 'Milieu du dos (rhomboïdes)', group: 'Dos' },
  lombaires: { label: 'Lombaires', group: 'Dos' },
  biceps: { label: 'Biceps', group: 'Biceps' },
  triceps: { label: 'Triceps', group: 'Triceps' },
  avant_bras: { label: 'Avant-bras', group: 'Avant-bras' },
  abdominaux: { label: 'Abdominaux', group: 'Abdominaux' },
  obliques: { label: 'Obliques', group: 'Abdominaux' },
  quadriceps: { label: 'Quadriceps', group: 'Quadriceps' },
  adducteurs: { label: 'Adducteurs', group: 'Quadriceps' },
  ischios: { label: 'Ischio-jambiers', group: 'Ischio-jambiers' },
  fessiers: { label: 'Grand fessier', group: 'Fessiers' },
  moyen_fessier: { label: 'Moyen fessier (abducteurs)', group: 'Fessiers' },
  mollets: { label: 'Mollets', group: 'Mollets' },
}

export const MUSCLE_IDS = Object.keys(MUSCLES) as MuscleId[]
