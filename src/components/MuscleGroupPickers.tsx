import { SECONDARY_CHOICES } from '../lib/muscleGroups'
import { MUSCLE_GROUPS, type MuscleGroup } from '../types'

const CHIP = 'min-h-11 rounded-full px-4 text-sm font-medium'

/** Main muscle group: exactly one (required). */
export function PrincipalPicker({ value, onChange }: { value: MuscleGroup; onChange: (g: MuscleGroup) => void }) {
  return (
    <div role="radiogroup" aria-label="Muscle principal" className="flex flex-wrap gap-2">
      {MUSCLE_GROUPS.map((g) => (
        <button
          key={g}
          type="button"
          role="radio"
          aria-checked={value === g}
          onClick={() => onChange(g)}
          className={`${CHIP} ${value === g ? 'bg-brand-600 text-white' : 'bg-slate-100 text-slate-600 active:bg-slate-200'}`}
        >
          {g}
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
    <div className="flex flex-wrap gap-2" role="group" aria-label="Muscles secondaires">
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
                ? 'bg-brand-50 text-accent ring-2 ring-brand-300'
                : isMain
                  ? 'bg-slate-50 text-slate-300'
                  : 'border border-slate-200 text-slate-600 active:bg-slate-100'
            }`}
          >
            {g}
          </button>
        )
      })}
    </div>
  )
}
