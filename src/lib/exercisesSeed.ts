import type { LoadType, MuscleGroup } from '../types'

/** Default exercise library, seeded once on first launch. */
export const DEFAULT_EXERCISES: { name: string; muscleGroup: MuscleGroup; loadType: LoadType }[] = [
  // Pectoraux
  { name: 'Développé couché', muscleGroup: 'Pectoraux', loadType: 'Barre libre' },
  { name: 'Développé incliné', muscleGroup: 'Pectoraux', loadType: 'Barre libre' },
  { name: 'Développé couché haltères', muscleGroup: 'Pectoraux', loadType: 'Haltères' },
  { name: 'Écarté couché haltères', muscleGroup: 'Pectoraux', loadType: 'Haltères' },
  { name: 'Dips', muscleGroup: 'Pectoraux', loadType: 'Poids du corps' },
  { name: 'Pompes', muscleGroup: 'Pectoraux', loadType: 'Poids du corps' },
  // Dos
  { name: 'Tractions', muscleGroup: 'Dos', loadType: 'Poids du corps' },
  { name: 'Rowing barre', muscleGroup: 'Dos', loadType: 'Barre libre' },
  { name: 'Rowing haltère', muscleGroup: 'Dos', loadType: 'Haltères' },
  { name: 'Tirage vertical', muscleGroup: 'Dos', loadType: 'Poulie / pile de poids' },
  { name: 'Tirage horizontal', muscleGroup: 'Dos', loadType: 'Poulie / pile de poids' },
  { name: 'Soulevé de terre', muscleGroup: 'Dos', loadType: 'Barre libre' },
  // Épaules
  { name: 'Développé militaire', muscleGroup: 'Épaules', loadType: 'Barre libre' },
  { name: 'Développé haltères épaules', muscleGroup: 'Épaules', loadType: 'Haltères' },
  { name: 'Élévations latérales', muscleGroup: 'Épaules', loadType: 'Haltères' },
  { name: 'Élévations frontales', muscleGroup: 'Épaules', loadType: 'Haltères' },
  { name: 'Oiseau (élévations arrière)', muscleGroup: 'Épaules', loadType: 'Haltères' },
  // Biceps
  { name: 'Curl barre', muscleGroup: 'Biceps', loadType: 'Barre libre' },
  { name: 'Curl haltères', muscleGroup: 'Biceps', loadType: 'Haltères' },
  { name: 'Curl marteau', muscleGroup: 'Biceps', loadType: 'Haltères' },
  { name: 'Curl pupitre', muscleGroup: 'Biceps', loadType: 'Barre libre' },
  // Triceps
  { name: 'Extension triceps poulie', muscleGroup: 'Triceps', loadType: 'Poulie / pile de poids' },
  { name: 'Barre au front', muscleGroup: 'Triceps', loadType: 'Barre libre' },
  { name: 'Dips triceps', muscleGroup: 'Triceps', loadType: 'Poids du corps' },
  { name: 'Extension nuque haltère', muscleGroup: 'Triceps', loadType: 'Haltères' },
  // Jambes (muscles précis)
  { name: 'Squat', muscleGroup: 'Quadriceps', loadType: 'Barre libre' },
  { name: 'Presse à cuisses', muscleGroup: 'Quadriceps', loadType: 'Machine à plaques' },
  { name: 'Fentes', muscleGroup: 'Quadriceps', loadType: 'Haltères' },
  { name: 'Leg curl', muscleGroup: 'Ischio-jambiers', loadType: 'Poulie / pile de poids' },
  { name: 'Leg extension', muscleGroup: 'Quadriceps', loadType: 'Poulie / pile de poids' },
  {
    name: 'Soulevé de terre jambes tendues',
    muscleGroup: 'Ischio-jambiers',
    loadType: 'Barre libre',
  },
  { name: 'Hip thrust', muscleGroup: 'Fessiers', loadType: 'Barre libre' },
  { name: 'Mollets debout', muscleGroup: 'Mollets', loadType: 'Machine à plaques' },
  // Abdominaux
  { name: 'Crunch', muscleGroup: 'Abdominaux', loadType: 'Poids du corps' },
  { name: 'Gainage (planche)', muscleGroup: 'Abdominaux', loadType: 'Poids du corps' },
  { name: 'Relevé de jambes', muscleGroup: 'Abdominaux', loadType: 'Poids du corps' },
  { name: 'Russian twist', muscleGroup: 'Abdominaux', loadType: 'Poids du corps' },
  // Autre (cardio — pas de muscle précis dans la nouvelle classification)
  { name: 'Rameur', muscleGroup: 'Autre', loadType: 'Poulie / pile de poids' },
  { name: 'Vélo', muscleGroup: 'Autre', loadType: 'Poulie / pile de poids' },
  { name: 'Tapis de course', muscleGroup: 'Autre', loadType: 'Poulie / pile de poids' },
]
