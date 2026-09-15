import type { LoadType, MuscleGroup } from '../types'

/**
 * Best-effort guess at how an exercise is loaded, from its name (and
 * optionally its muscle group as a weak secondary signal). Used to suggest a
 * sensible default when creating a new exercise, and to backfill exercises
 * that predate this field.
 */
export function guessLoadType(name: string, muscleGroup?: MuscleGroup): LoadType {
  const n = name.toLowerCase()

  if (/machine|presse/.test(n)) return 'Machine à plaques'
  if (/poulie|tirage|c[aâ]ble|cable/.test(n)) return 'Poulie / pile de poids'
  if (/halt[eè]re|dumbbell/.test(n)) return 'Haltères'
  if (/pompe|traction|dips?|gainage|planche|crunch|relev[ée] de jambes|russian twist/.test(n)) {
    return 'Poids du corps'
  }
  if (muscleGroup === 'Abdominaux') return 'Poids du corps'

  return 'Barre libre'
}
