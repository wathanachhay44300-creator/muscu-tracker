import { EQUIPMENT, EQUIPMENT_LABEL, MUSCLE_GROUPS, type Equipment, type MuscleGroup } from '../types'
import { XIcon } from './Icons'
import { equipmentLabel, groupLabel, t } from '../i18n'

interface ExerciseFiltersProps {
  groups: MuscleGroup[]
  equipment: Equipment[]
  onToggleGroup: (g: MuscleGroup) => void
  onToggleEquipment: (e: Equipment) => void
  onClear: () => void
}

const SCROLL_ROW = 'flex gap-1.5 overflow-x-auto pb-0.5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden'

/** Two scrollable chip rows (muscle group, equipment), cumulative and one tap to remove. */
export function ExerciseFilters({ groups, equipment, onToggleGroup, onToggleEquipment, onClear }: ExerciseFiltersProps) {
  const active = groups.length + equipment.length > 0
  return (
    <div className="space-y-1.5">
      <div className={SCROLL_ROW} role="group" aria-label={t('exerciseFilters.byMuscle')}>
        {MUSCLE_GROUPS.filter((g) => g !== 'Autre').map((g) => (
          <Chip key={g} label={groupLabel(g)} on={groups.includes(g)} onClick={() => onToggleGroup(g)} />
        ))}
      </div>
      <div className={SCROLL_ROW} role="group" aria-label={t('exerciseFilters.byEquipment')}>
        {EQUIPMENT.map((e) => (
          <Chip key={e} label={equipmentLabel(EQUIPMENT_LABEL[e])} on={equipment.includes(e)} onClick={() => onToggleEquipment(e)} />
        ))}
        {active && (
          <button
            type="button"
            onClick={onClear}
            className="flex min-h-9 shrink-0 items-center gap-1 rounded-full px-3 text-xs font-semibold text-muted active:bg-surface-3"
          >
            <XIcon className="h-3.5 w-3.5" />
            {t('common.clear')}
          </button>
        )}
      </div>
    </div>
  )
}

function Chip({ label, on, onClick }: { label: string; on: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={on}
      className={`min-h-9 shrink-0 rounded-full px-3.5 text-xs font-semibold ${
        on ? 'bg-accent text-on-accent' : 'border border-line bg-surface text-ink-2 active:bg-surface-3'
      }`}
    >
      {label}
    </button>
  )
}
