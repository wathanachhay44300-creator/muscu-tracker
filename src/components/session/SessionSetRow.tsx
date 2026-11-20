import { useState } from 'react'
import type { SetEntry } from '../../types'
import { useLongPress } from '../../hooks/useLongPress'
import { useSwipeToDelete } from '../../hooks/useSwipeToDelete'
import { usePreferences } from '../../hooks/usePreferences'
import { hapticMenuOpen } from '../../lib/haptics'
import { ContextMenuSheet } from '../ContextMenuSheet'
import { DragNumberField } from '../DragNumberField'
import { CheckIcon, CopyIcon, StarIcon, TrashIcon } from '../Icons'
import { t } from '../../i18n'

export const SET_GRID = 'grid grid-cols-[2rem_1fr_1fr_2.75rem] items-center gap-1.5'

interface SessionSetRowProps {
  set: SetEntry
  index: number
  /** The next set to do: outlined in accent. */
  current: boolean
  isPR: boolean
  onChangeWeight: (weight: number) => void
  onChangeReps: (reps: number) => void
  onToggleDone: () => void
  onRemove: () => void
  onDuplicate: () => void
}

/**
 * One row of the session sets table: SÉRIE / KG / REPS / OK. Swipe left to
 * delete, long-press for duplicate/delete. Ticked sets are dimmed but stay
 * editable.
 */
export function SessionSetRow({
  set,
  index,
  current,
  isPR,
  onChangeWeight,
  onChangeReps,
  onToggleDone,
  onRemove,
  onDuplicate,
}: SessionSetRowProps) {
  const preferences = usePreferences()
  const [menuOpen, setMenuOpen] = useState(false)
  const longPress = useLongPress(() => {
    hapticMenuOpen(!!preferences?.hapticsEnabled)
    setMenuOpen(true)
  })
  const swipe = useSwipeToDelete(onRemove)
  const done = !!set.done

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
        className={`relative ${SET_GRID} rounded-xl bg-surface px-1 py-1 ${
          current ? 'ring-2 ring-inset ring-accent' : ''
        }`}
        onPointerDown={(e) => {
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
          className={`flex justify-center text-sm font-bold font-numbers ${done ? 'text-faint' : 'text-muted'}`}
          title={isPR ? t('set.pr') : undefined}
        >
          {isPR ? <StarIcon className="h-4 w-4 text-highlight" /> : index + 1}
        </span>

        <DragNumberField
          value={set.weight}
          step={preferences?.weightStep ?? 2.5}
          decimal
          dimmed={done}
          haptics={!!preferences?.hapticsEnabled}
          label={t('set.weightLabel', { n: index + 1 })}
          onCommit={onChangeWeight}
        />
        <DragNumberField
          value={set.reps}
          step={1}
          dimmed={done}
          haptics={!!preferences?.hapticsEnabled}
          label={t('set.repsLabel', { n: index + 1 })}
          onCommit={onChangeReps}
        />

        <button
          type="button"
          data-no-long-press
          data-no-swipe
          onClick={onToggleDone}
          aria-pressed={done}
          aria-label={done ? t('set.doneUndo', { n: index + 1 }) : t('set.validate', { n: index + 1 })}
          className={`flex h-11 w-11 items-center justify-center justify-self-center rounded-full ${
            done ? 'bg-accent text-on-accent' : 'border-2 border-line-strong text-faint active:bg-surface-3'
          }`}
        >
          <CheckIcon className="h-5 w-5" strokeWidth={3} />
        </button>
      </div>

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
