import { EQUIPMENT, EQUIPMENT_LABEL, MUSCLE_GROUPS, type Equipment, type MuscleGroup } from '../types'
import { XIcon } from './Icons'

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
      <div className={SCROLL_ROW} role="group" aria-label="Filtrer par muscle">
        {MUSCLE_GROUPS.filter((g) => g !== 'Autre').map((g) => (
          <Chip key={g} label={g} on={groups.includes(g)} onClick={() => onToggleGroup(g)} />
        ))}
      </div>
      <div className={SCROLL_ROW} role="group" aria-label="Filtrer par matériel">
        {EQUIPMENT.map((e) => (
          <Chip key={e} label={EQUIPMENT_LABEL[e]} on={equipment.includes(e)} onClick={() => onToggleEquipment(e)} />
        ))}
        {active && (
          <button
            type="button"
            onClick={onClear}
            className="flex min-h-9 shrink-0 items-center gap-1 rounded-full px-3 text-xs font-semibold text-slate-500 active:bg-slate-100"
          >
            <XIcon className="h-3.5 w-3.5" />
            Effacer
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
        on ? 'bg-brand-600 text-white' : 'border border-slate-200 bg-surface text-slate-600 active:bg-slate-100'
      }`}
    >
      {label}
    </button>
  )
}
