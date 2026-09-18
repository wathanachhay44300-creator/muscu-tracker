import { CheckIcon, CopyIcon, DumbbellIcon } from './Icons'
import type { TemplateSummary } from '../hooks/useTemplates'

interface StartSessionPickerProps {
  templates: TemplateSummary[] | undefined
  plannedTemplateId: number | undefined
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
  plannedTemplateId,
  starting,
  onStartFromTemplate,
  onStartFree,
  onDuplicatePrevious,
}: StartSessionPickerProps) {
  const hasTemplates = templates && templates.length > 0

  return (
    <div className="flex flex-col items-center gap-4 rounded-2xl border border-dashed border-slate-300 px-4 py-10 text-center">
      <DumbbellIcon className="h-10 w-10 text-slate-300" />
      <div>
        <p className="font-medium text-slate-600">Aucune séance ce jour-là</p>
        <p className="mt-1 text-sm text-slate-400">
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
              className="flex w-full items-center justify-between rounded-2xl border border-slate-200 bg-surface px-4 py-3.5 shadow-sm active:bg-slate-50 disabled:opacity-50"
            >
              <div>
                <p className="font-semibold text-slate-900">{template.name}</p>
                <p className="text-xs text-slate-400">
                  {exerciseCount} exercice{exerciseCount > 1 ? 's' : ''}
                </p>
              </div>
              {plannedTemplateId === template.id && (
                <span className="flex items-center gap-1 rounded-full bg-brand-50 px-2.5 py-1 text-xs font-semibold text-brand-600">
                  <CheckIcon className="h-3.5 w-3.5" />
                  Planifiée
                </span>
              )}
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
            ? 'mt-1 w-full rounded-2xl bg-slate-100 px-6 py-3 font-medium text-slate-600 active:bg-slate-200 disabled:opacity-50'
            : 'mt-2 rounded-2xl bg-brand-600 px-6 py-3.5 font-semibold text-white shadow-sm active:bg-brand-700 disabled:opacity-50'
        }
      >
        Séance libre
      </button>

      <button
        type="button"
        onClick={onDuplicatePrevious}
        disabled={starting}
        className="flex w-full items-center justify-center gap-1.5 rounded-2xl bg-slate-100 px-6 py-3 font-medium text-slate-600 active:bg-slate-200 disabled:opacity-50"
      >
        <CopyIcon className="h-4 w-4" />
        Dupliquer une séance précédente
      </button>
    </div>
  )
}
