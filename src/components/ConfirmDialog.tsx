import { t } from '../i18n'
interface ConfirmDialogProps {
  title: string
  message: string
  confirmLabel?: string
  cancelLabel?: string
  danger?: boolean
  onConfirm: () => void
  onCancel: () => void
}

/** Centered (bottom-sheet on narrow screens) confirmation modal for destructive or important actions. */
export function ConfirmDialog({
  title,
  message,
  confirmLabel = t('common.confirm'),
  cancelLabel = t('common.cancel'),
  danger = false,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-scrim/40 animate-fade-in-backdrop sm:items-center sm:p-4"
      onClick={onCancel}
    >
      <div
        className="w-full max-w-sm animate-slide-up rounded-t-2xl bg-surface p-5 pb-safe shadow-lg sm:rounded-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-base font-semibold text-ink">{title}</h2>
        <p className="mt-1.5 text-sm text-muted">{message}</p>
        <div className="mt-5 flex gap-2">
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 rounded-xl bg-surface-3 py-3 font-medium text-ink-2 active:bg-surface-4"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className={`flex-1 rounded-xl py-3 font-medium ${
              danger ? 'bg-danger text-on-danger' : 'bg-accent text-on-accent active:bg-accent-hover'
            }`}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  )
}
