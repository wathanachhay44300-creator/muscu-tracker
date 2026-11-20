import { SECONDARY_CHOICES } from '../lib/muscleGroups'
import { MUSCLE_GROUPS, type MuscleGroup } from '../types'
import { groupLabel, t } from '../i18n'

const CHIP = 'min-h-11 rounded-full px-4 text-sm font-medium'

/** Main muscle group: exactly one (required). */
export function PrincipalPicker({ value, onChange }: { value: MuscleGroup; onChange: (g: MuscleGroup) => void }) {
  return (
    <div role="radiogroup" aria-label={t('exerciseInfo.mainMuscle')} className="flex flex-wrap gap-2">
      {MUSCLE_GROUPS.map((g) => (
        <button
          key={g}
          type="button"
          role="radio"
          aria-checked={value === g}
          onClick={() => onChange(g)}
          className={`${CHIP} ${value === g ? 'bg-accent text-on-accent' : 'bg-surface-3 text-ink-2 active:bg-surface-4'}`}
        >
          {groupLabel(g)}
        </button>
      ))}
    </div>
  )
}

/**
 * Secondary muscle groups: any number (optional). The main group can't also
 * be secondary, so its chip is disabled.
 */
export function SecondaryPicker({
  principal,
  value,
  onChange,
}: {
  principal: MuscleGroup
  value: MuscleGroup[]
  onChange: (groups: MuscleGroup[]) => void
}) {
  return (
    <div className="flex flex-wrap gap-2" role="group" aria-label={t('exerciseInfo.secondaryOptional')}>
      {SECONDARY_CHOICES.map((g) => {
        const isMain = g === principal
        const on = value.includes(g) && !isMain
        return (
          <button
            key={g}
            type="button"
            disabled={isMain}
            aria-pressed={on}
            onClick={() => onChange(on ? value.filter((x) => x !== g) : [...value, g])}
            className={`${CHIP} ${
              on
                ? 'bg-accent-soft text-accent-ink ring-2 ring-accent-line'
                : isMain
                  ? 'bg-surface-2 text-faint'
                  : 'border border-line text-ink-2 active:bg-surface-3'
            }`}
          >
            {groupLabel(g)}
          </button>
        )
      })}
    </div>
  )
}
