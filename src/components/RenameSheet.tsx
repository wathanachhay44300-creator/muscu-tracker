import { useState } from 'react'

interface RenameSheetProps {
  title: string
  initialName: string
  confirmLabel?: string
  /** Allow validating an empty value (used to revert a custom title). */
  allowEmpty?: boolean
  placeholder?: string
  onRename: (name: string) => void
  onCancel: () => void
}

/** Small bottom sheet with a pre-filled text field, for renaming something. */
export function RenameSheet({
  title,
  initialName,
  confirmLabel = 'Renommer',
  allowEmpty = false,
  placeholder,
  onRename,
  onCancel,
}: RenameSheetProps) {
  const [name, setName] = useState(initialName)
  const canSubmit = allowEmpty || !!name.trim()

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-scrim/40 animate-fade-in-backdrop sm:items-center sm:p-4"
      onClick={onCancel}
    >
      <div
        className="w-full max-w-sm animate-slide-up rounded-t-2xl bg-surface p-5 pb-safe shadow-lg sm:rounded-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="mb-3 text-base font-semibold text-ink">{title}</h2>
        <input
          autoFocus
          value={name}
          placeholder={placeholder}
          onChange={(e) => setName(e.target.value)}
          onFocus={(e) => e.target.select()}
          onKeyDown={(e) => e.key === 'Enter' && canSubmit && onRename(name.trim())}
          className="w-full rounded-xl border border-line bg-surface-2 px-4 py-3 text-base outline-none focus:border-accent-line"
        />
        <div className="mt-5 flex gap-2">
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 rounded-xl bg-surface-3 py-3 font-medium text-ink-2 active:bg-surface-4"
          >
            Annuler
          </button>
          <button
            type="button"
            onClick={() => canSubmit && onRename(name.trim())}
            disabled={!canSubmit}
            className="flex-1 rounded-xl bg-accent py-3 font-medium text-on-accent disabled:opacity-40 active:bg-accent-hover"
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  )
}
