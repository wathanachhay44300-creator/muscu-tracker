import { useState } from 'react'
import type { LoadType, SetEntry } from '../types'
import { useLongPress } from '../hooks/useLongPress'
import { useSwipeToDelete } from '../hooks/useSwipeToDelete'
import { usePreferences } from '../hooks/usePreferences'
import { hapticMenuOpen } from '../lib/haptics'
import { DumbbellIcon, StarIcon, TrashIcon, CopyIcon } from './Icons'
import { PlateCalculatorSheet } from './PlateCalculatorSheet'
import { ContextMenuSheet } from './ContextMenuSheet'
import { NumberField } from './NumberField'
import { t } from '../i18n'

/** The plate calculator only makes sense for these — the rest have no plates to pick. */
const PLATE_CALC_LOAD_TYPES: LoadType[] = ['Barre libre', 'Machine à plaques']

interface SetRowProps {
  set: SetEntry
  index: number
  loadType: LoadType
  /** True when this set ties or holds the all-time PR (weight or volume) for its exercise. */
  isPR?: boolean
  onChangeWeight: (weight: number) => void
  onChangeReps: (reps: number) => void
  onRemove: () => void
  onDuplicate: () => void
}

export function SetRow({ set, index, loadType, isPR, onChangeWeight, onChangeReps, onRemove, onDuplicate }: SetRowProps) {
  const [calculatorOpen, setCalculatorOpen] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const preferences = usePreferences()

  const longPress = useLongPress(() => {
    hapticMenuOpen(!!preferences?.hapticsEnabled)
    setMenuOpen(true)
  })
  const swipe = useSwipeToDelete(onRemove)

  return (
    <div className="relative overflow-hidden rounded-xl">
      <div
        ref={swipe.revealRef}
        className="absolute inset-0 flex items-center justify-end bg-danger pr-4 opacity-0"
        aria-hidden="true"
      >
        <TrashIcon className="h-5 w-5 text-on-danger" />
      </div>

      <div
        data-swipe-to-delete
        ref={swipe.contentRef}
        className="animate-fade-in relative flex flex-wrap items-center gap-1 rounded-xl bg-surface"
        onPointerDown={(e) => {
          // Stop here so the exercise card's own long-press (for its context
          // menu) never also sees this gesture — whichever level the press
          // actually started at should be the only one reacting to it.
          e.stopPropagation()
          longPress.onPointerDown(e)
          swipe.handlers.onPointerDown(e)
        }}
        onPointerMove={(e) => {
          longPress.onPointerMove(e)
          swipe.handlers.onPointerMove(e)
        }}
        onPointerUp={(e) => {
          longPress.onPointerUp(e)
          swipe.handlers.onPointerUp(e)
        }}
        onPointerCancel={(e) => {
          longPress.onPointerCancel(e)
          swipe.handlers.onPointerCancel(e)
        }}
        onClickCapture={longPress.onClickCapture}
        onContextMenu={longPress.onContextMenu}
      >
        <span
          className={`flex h-6 w-5 shrink-0 items-center justify-center rounded-full text-xs font-semibold ${
            isPR ? 'bg-highlight-soft text-highlight' : 'text-muted'
          }`}
          title={isPR ? t('set.newPr') : undefined}
        >
          {isPR ? <StarIcon className="animate-pop-in h-3.5 w-3.5" /> : index + 1}
        </span>

        <NumberField
          value={set.weight}
          step={preferences?.weightStep ?? 2.5}
          decimal
          label={t('set.weightLabel', { n: index + 1 })}
          onCommit={onChangeWeight}
          className="min-w-[6.5rem] flex-1"
        />
        {PLATE_CALC_LOAD_TYPES.includes(loadType) ? (
          <button
            type="button"
            data-no-long-press
            data-no-swipe
            onClick={() => setCalculatorOpen(true)}
            className="flex shrink-0 items-center gap-0.5 rounded-md px-0.5 py-0.5 text-[10px] font-medium text-muted active:text-accent-ink"
            aria-label={t('set.plateCalc')}
            title={t('set.plateCalc')}
          >
            <DumbbellIcon className="h-2.5 w-2.5" />
            kg
          </button>
        ) : (
          <span className="shrink-0 text-[10px] font-medium text-muted">kg</span>
        )}

        <NumberField
          value={set.reps}
          step={1}
          label={t('set.repsLabel', { n: index + 1 })}
          onCommit={onChangeReps}
          className="min-w-[5.5rem] flex-1"
        />
        <span className="shrink-0 text-[10px] font-medium text-muted">reps</span>

        <button
          type="button"
          data-no-long-press
          data-no-swipe
          onClick={onRemove}
          className="shrink-0 p-1 text-faint active:text-danger-ink"
          aria-label={t('set.delete')}
        >
          <TrashIcon className="h-4 w-4" />
        </button>
      </div>

      {calculatorOpen && PLATE_CALC_LOAD_TYPES.includes(loadType) && (
        <PlateCalculatorSheet
          initialWeight={set.weight}
          loadType={loadType}
          onClose={() => setCalculatorOpen(false)}
        />
      )}

      {menuOpen && (
        <ContextMenuSheet
          title={t('set.title', { n: index + 1 })}
          actions={[
            { label: t('set.duplicate'), icon: CopyIcon, onSelect: onDuplicate },
            { label: t('set.delete'), icon: TrashIcon, onSelect: onRemove, danger: true },
          ]}
          onClose={() => setMenuOpen(false)}
        />
      )}
    </div>
  )
}
