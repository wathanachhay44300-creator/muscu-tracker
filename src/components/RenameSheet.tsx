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
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 animate-fade-in-backdrop sm:items-center sm:p-4"
      onClick={onCancel}
    >
      <div
        className="w-full max-w-sm animate-slide-up rounded-t-2xl bg-surface p-5 pb-safe shadow-lg sm:rounded-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="mb-3 text-base font-semibold text-slate-900">{title}</h2>
        <input
          autoFocus
          value={name}
          placeholder={placeholder}
          onChange={(e) => setName(e.target.value)}
          onFocus={(e) => e.target.select()}
          onKeyDown={(e) => e.key === 'Enter' && canSubmit && onRename(name.trim())}
          className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-base outline-none focus:border-brand-400"
        />
        <div className="mt-5 flex gap-2">
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 rounded-xl bg-slate-100 py-3 font-medium text-slate-600 active:bg-slate-200"
          >
            Annuler
          </button>
          <button
            type="button"
            onClick={() => canSubmit && onRename(name.trim())}
            disabled={!canSubmit}
            className="flex-1 rounded-xl bg-brand-600 py-3 font-medium text-white disabled:opacity-40 active:bg-brand-700"
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  )
}
