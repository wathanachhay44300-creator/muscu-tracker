import type { MuscleGroup } from '../types'

/** Default exercise library, seeded once on first launch. */
export const DEFAULT_EXERCISES: { name: string; muscleGroup: MuscleGroup }[] = [
  // Pectoraux
  { name: 'Développé couché', muscleGroup: 'Pectoraux' },
  { name: 'Développé incliné', muscleGroup: 'Pectoraux' },
  { name: 'Développé couché haltères', muscleGroup: 'Pectoraux' },
  { name: 'Écarté couché haltères', muscleGroup: 'Pectoraux' },
  { name: 'Dips', muscleGroup: 'Pectoraux' },
  { name: 'Pompes', muscleGroup: 'Pectoraux' },
  // Dos
  { name: 'Tractions', muscleGroup: 'Dos' },
  { name: 'Rowing barre', muscleGroup: 'Dos' },
  { name: 'Rowing haltère', muscleGroup: 'Dos' },
  { name: 'Tirage vertical', muscleGroup: 'Dos' },
  { name: 'Tirage horizontal', muscleGroup: 'Dos' },
  { name: 'Soulevé de terre', muscleGroup: 'Dos' },
  // Épaules
  { name: 'Développé militaire', muscleGroup: 'Épaules' },
  { name: 'Développé haltères épaules', muscleGroup: 'Épaules' },
  { name: 'Élévations latérales', muscleGroup: 'Épaules' },
  { name: 'Élévations frontales', muscleGroup: 'Épaules' },
  { name: 'Oiseau (élévations arrière)', muscleGroup: 'Épaules' },
  // Biceps
  { name: 'Curl barre', muscleGroup: 'Biceps' },
  { name: 'Curl haltères', muscleGroup: 'Biceps' },
  { name: 'Curl marteau', muscleGroup: 'Biceps' },
  { name: 'Curl pupitre', muscleGroup: 'Biceps' },
  // Triceps
  { name: 'Extension triceps poulie', muscleGroup: 'Triceps' },
  { name: 'Barre au front', muscleGroup: 'Triceps' },
  { name: 'Dips triceps', muscleGroup: 'Triceps' },
  { name: 'Extension nuque haltère', muscleGroup: 'Triceps' },
  // Jambes
  { name: 'Squat', muscleGroup: 'Jambes' },
  { name: 'Presse à cuisses', muscleGroup: 'Jambes' },
  { name: 'Fentes', muscleGroup: 'Jambes' },
  { name: 'Leg curl', muscleGroup: 'Jambes' },
  { name: 'Leg extension', muscleGroup: 'Jambes' },
  { name: 'Soulevé de terre jambes tendues', muscleGroup: 'Jambes' },
  { name: 'Hip thrust', muscleGroup: 'Jambes' },
  { name: 'Mollets debout', muscleGroup: 'Jambes' },
  // Abdominaux
  { name: 'Crunch', muscleGroup: 'Abdominaux' },
  { name: 'Gainage (planche)', muscleGroup: 'Abdominaux' },
  { name: 'Relevé de jambes', muscleGroup: 'Abdominaux' },
  { name: 'Russian twist', muscleGroup: 'Abdominaux' },
  // Cardio
  { name: 'Rameur', muscleGroup: 'Cardio' },
  { name: 'Vélo', muscleGroup: 'Cardio' },
  { name: 'Tapis de course', muscleGroup: 'Cardio' },
]
