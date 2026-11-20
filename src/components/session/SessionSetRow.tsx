import { useState } from 'react'
import { useLongPress } from '../../hooks/useLongPress'
import { useSwipeToDelete } from '../../hooks/useSwipeToDelete'
import { usePreferences } from '../../hooks/usePreferences'
import { hapticMenuOpen } from '../../lib/haptics'
import { ContextMenuSheet, type ContextMenuAction } from '../ContextMenuSheet'
import { ArrowUturnLeftIcon, CheckIcon, CopyIcon, StarIcon, TrashIcon } from '../Icons'
import { t } from '../../i18n'

interface SessionSetRowProps {
  index: number
  /** "60 kg × 8" */
  text: string
  done: boolean
  /** Loaded in the editor: outlined in accent. */
  selected: boolean
  isPR: boolean
  /** The next set, not saved yet (shown dashed, no menu). */
  draft?: boolean
  onSelect: () => void
  onRemove?: () => void
  onDuplicate?: () => void
  onUndo?: () => void
}

/**
 * One compact line of the session sets list: number, "60 kg × 8", state.
 * Tap loads the set in the editor; swipe left deletes; long-press for
 * duplicate / mark as not done / delete.
 */
export function SessionSetRow({ index, text, done, selected, isPR, draft = false, onSelect, onRemove, onDuplicate, onUndo }: SessionSetRowProps) {
  const preferences = usePreferences()
  const [menuOpen, setMenuOpen] = useState(false)
  const longPress = useLongPress(() => {
    if (draft) return
    hapticMenuOpen(!!preferences?.hapticsEnabled)
    setMenuOpen(true)
  })
  const swipe = useSwipeToDelete(() => onRemove?.())

  const actions: ContextMenuAction[] = [
    ...(onDuplicate ? [{ label: t('set.duplicate'), icon: CopyIcon, onSelect: onDuplicate }] : []),
    ...(done && onUndo ? [{ label: t('editor.markNotDone'), icon: ArrowUturnLeftIcon, onSelect: onUndo }] : []),
    ...(onRemove ? [{ label: t('set.delete'), icon: TrashIcon, onSelect: onRemove, danger: true }] : []),
  ]

  return (
    <div className="relative overflow-hidden rounded-xl">
      {!draft && (
        <div ref={swipe.revealRef} className="absolute inset-0 flex items-center justify-end bg-danger pr-4 opacity-0" aria-hidden="true">
          <TrashIcon className="h-5 w-5 text-on-danger" />
        </div>
      )}
      <div
        data-swipe-to-delete={draft ? undefined : true}
        ref={draft ? undefined : swipe.contentRef}
        className="relative"
        onPointerDown={(e) => {
          if (draft) return
          longPress.onPointerDown(e)
          swipe.handlers.onPointerDown(e)
        }}
        onPointerMove={(e) => {
          if (draft) return
          longPress.onPointerMove(e)
          swipe.handlers.onPointerMove(e)
        }}
        onPointerUp={(e) => {
          if (draft) return
          longPress.onPointerUp(e)
          swipe.handlers.onPointerUp(e)
        }}
        onPointerCancel={(e) => {
          if (draft) return
          longPress.onPointerCancel(e)
          swipe.handlers.onPointerCancel(e)
        }}
        onClickCapture={draft ? undefined : longPress.onClickCapture}
        onContextMenu={draft ? undefined : longPress.onContextMenu}
      >
        <button
          type="button"
          onClick={onSelect}
          aria-pressed={selected}
          aria-label={`${t('editor.rowLabel', { set: t('set.title', { n: index + 1 }), text })}${done ? ` · ${t('editor.done')}` : ''}`}
          className={`flex min-h-12 w-full items-center gap-3 rounded-xl px-3 text-left ${
            selected ? 'ring-2 ring-inset ring-accent' : ''
          } ${draft ? 'border border-dashed border-line-strong bg-transparent' : 'bg-surface active:bg-surface-2'}`}
        >
          <span className={`font-numbers w-5 shrink-0 text-center text-sm font-bold ${done ? 'text-faint' : 'text-muted'}`}>
            {isPR ? <StarIcon className="mx-auto h-4 w-4 text-highlight" /> : index + 1}
          </span>
          <span className={`font-numbers flex-1 text-lg font-bold ${done ? 'text-muted' : draft ? 'text-ink-2' : 'text-ink'}`}>{text}</span>
          {done ? (
            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-accent text-on-accent">
              <CheckIcon className="h-4 w-4" strokeWidth={3} />
            </span>
          ) : (
            <span className="h-7 w-7 shrink-0 rounded-full border-2 border-line-strong" aria-hidden="true" />
          )}
        </button>
      </div>

      {menuOpen && <ContextMenuSheet title={t('set.title', { n: index + 1 })} actions={actions} onClose={() => setMenuOpen(false)} />}
    </div>
  )
}
