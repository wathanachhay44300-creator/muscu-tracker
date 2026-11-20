import type { MuscleId } from '../types'
import { getLocale, muscleLabel, t } from '../i18n'

/** Which view of the body diagram an exercise is shown with, and how it's framed. */
export type BodySide = 'front' | 'back'
/** `upper`: head to hips, for upper-body exercises; `full`: head to feet. */
export type BodyCrop = 'upper' | 'full'

/** Muscles seen from the front / from the back; the others (side delts) don't vote. */
const FRONT_MUSCLES = new Set<MuscleId>(['pectoraux', 'delt_ant', 'biceps', 'avant_bras', 'abdominaux', 'obliques', 'quadriceps', 'adducteurs'])
const BACK_MUSCLES = new Set<MuscleId>([
  'trapezes',
  'delt_post',
  'grand_dorsal',
  'milieu_dos',
  'lombaires',
  'triceps',
  'fessiers',
  'moyen_fessier',
  'ischios',
  'mollets',
])
const LOWER_MUSCLES = new Set<MuscleId>(['quadriceps', 'adducteurs', 'ischios', 'fessiers', 'moyen_fessier', 'mollets'])

function score(muscles: MuscleId[]): number {
  return muscles.reduce((n, m) => n + (FRONT_MUSCLES.has(m) ? 1 : BACK_MUSCLES.has(m) ? -1 : 0), 0)
}

/** The view that shows most of the main muscles (then the secondary ones); front on a tie. */
export function bestSide(primary: MuscleId[], secondary: MuscleId[]): BodySide {
  const s = score(primary) || score(secondary)
  return s < 0 ? 'back' : 'front'
}

/** Whole body when a main muscle is in the legs (or nothing is known), upper body otherwise. */
export function bestCrop(primary: MuscleId[]): BodyCrop {
  return primary.length === 0 || primary.some((m) => LOWER_MUSCLES.has(m)) ? 'full' : 'upper'
}

function listOf(names: string[]): string {
  try {
    return new Intl.ListFormat(getLocale(), { type: 'conjunction' }).format(names)
  } catch {
    return names.join(', ')
  }
}

/** "Muscles travaillés : pectoraux (principal), épaules avant et triceps (secondaires)". */
export function musclesAriaLabel(primary: MuscleId[], secondary: MuscleId[]): string {
  if (primary.length + secondary.length === 0) return t('diagram.noneLabel')
  const parts: string[] = []
  const names = (list: MuscleId[]) => listOf(list.map((m) => muscleLabel(m).toLocaleLowerCase(getLocale())))
  if (primary.length) parts.push(t(primary.length > 1 ? 'diagram.primaryMany' : 'diagram.primaryOne', { names: names(primary) }))
  if (secondary.length) {
    parts.push(t(secondary.length > 1 ? 'diagram.secondaryMany' : 'diagram.secondaryOne', { names: names(secondary) }))
  }
  return t('diagram.workedLabel', { list: parts.join(', ') })
}

