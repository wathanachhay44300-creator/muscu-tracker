import type { ComponentType, SVGProps } from 'react'

export interface ContextMenuAction {
  label: string
  icon: ComponentType<SVGProps<SVGSVGElement>>
  onSelect: () => void
  danger?: boolean
}

interface ContextMenuSheetProps {
  title?: string
  actions: ContextMenuAction[]
  onClose: () => void
}

/** Quick-actions bottom sheet opened by a long-press, e.g. on an exercise
 * card, a set row, or a program in the list. */
export function ContextMenuSheet({ title, actions, onClose }: ContextMenuSheetProps) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 animate-fade-in-backdrop sm:items-center sm:p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-sm animate-slide-up rounded-t-2xl bg-surface p-2 pb-safe shadow-lg sm:rounded-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {title && (
          <p className="truncate px-3 pb-1 pt-3 text-xs font-semibold uppercase tracking-wide text-slate-400">
            {title}
          </p>
        )}
        <div className="py-1">
          {actions.map((action, i) => (
            <button
              key={i}
              type="button"
              onClick={() => {
                onClose()
                action.onSelect()
              }}
              className={`flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left text-base font-medium active:bg-slate-100 ${
                action.danger ? 'text-red-600' : 'text-slate-800'
              }`}
            >
              <action.icon className="h-5 w-5 shrink-0" />
              {action.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
