import { CopyIcon, DumbbellIcon } from './Icons'
import type { TemplateSummary } from '../hooks/useTemplates'

interface StartSessionPickerProps {
  templates: TemplateSummary[] | undefined
  starting: boolean
  onStartFromTemplate: (templateId: number) => void
  onStartFree: () => void
  onDuplicatePrevious: () => void
}

/**
 * Shown when there's no workout yet for the selected day: lets the user
 * quick-start from one of their programs (prefilled from its last run) or
 * start a completely empty session instead.
 */
export function StartSessionPicker({
  templates,
  starting,
  onStartFromTemplate,
  onStartFree,
  onDuplicatePrevious,
}: StartSessionPickerProps) {
  const hasTemplates = templates && templates.length > 0

  return (
    <div className="flex flex-col items-center gap-4 rounded-2xl border border-dashed border-line-strong px-4 py-10 text-center">
      <DumbbellIcon className="h-10 w-10 text-faint" />
      <div>
        <p className="font-medium text-ink-2">Aucune séance ce jour-là</p>
        <p className="mt-1 text-sm text-muted">
          {hasTemplates
            ? 'Choisissez un programme pour démarrer, avec vos dernières performances déjà remplies.'
            : 'Démarrez une séance pour commencer à noter vos exercices.'}
        </p>
      </div>

      {hasTemplates && (
        <div className="mt-1 w-full space-y-2 text-left">
          {templates!.map(({ template, exerciseCount }) => (
            <button
              key={template.id}
              type="button"
              onClick={() => onStartFromTemplate(template.id!)}
              disabled={starting}
              className="flex w-full items-center justify-between rounded-2xl border border-line bg-surface px-4 py-3.5 shadow-sm active:bg-surface-2 disabled:opacity-50"
            >
              <div>
                <p className="font-semibold text-ink">{template.name}</p>
                <p className="text-xs text-muted">
                  {exerciseCount} exercice{exerciseCount > 1 ? 's' : ''}
                </p>
              </div>
            </button>
          ))}
        </div>
      )}

      <button
        type="button"
        onClick={onStartFree}
        disabled={starting}
        className={
          hasTemplates
            ? 'mt-1 w-full rounded-2xl bg-surface-3 px-6 py-3 font-medium text-ink-2 active:bg-surface-4 disabled:opacity-50'
            : 'mt-2 rounded-2xl bg-accent px-6 py-3.5 font-semibold text-on-accent shadow-sm active:bg-accent-hover disabled:opacity-50'
        }
      >
        Séance libre
      </button>

      <button
        type="button"
        onClick={onDuplicatePrevious}
        disabled={starting}
        className="flex w-full items-center justify-center gap-1.5 rounded-2xl bg-surface-3 px-6 py-3 font-medium text-ink-2 active:bg-surface-4 disabled:opacity-50"
      >
        <CopyIcon className="h-4 w-4" />
        Dupliquer une séance précédente
      </button>
    </div>
  )
}
