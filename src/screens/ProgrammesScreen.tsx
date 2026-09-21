import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useTemplates, type TemplateSummary } from '../hooks/useTemplates'
import { usePlannedDates, useUpcomingPlannedSessions } from '../hooks/usePlannedSessions'
import {
  countTemplateUsage,
  createTemplate,
  deleteTemplate,
  duplicateTemplate,
  renameTemplate,
} from '../lib/templateActions'
import { unschedulePlannedSession } from '../lib/planningActions'
import { PlanningCalendar } from '../components/PlanningCalendar'
import { ContextMenuSheet } from '../components/ContextMenuSheet'
import { RenameSheet } from '../components/RenameSheet'
import { ConfirmDialog } from '../components/ConfirmDialog'
import { PullToRefreshIndicator } from '../components/PullToRefreshIndicator'
import { useLongPress } from '../hooks/useLongPress'
import { usePreferences } from '../hooks/usePreferences'
import { usePullToRefresh } from '../hooks/usePullToRefresh'
import { hapticMenuOpen } from '../lib/haptics'
import {
  ChevronRightIcon,
  ClipboardIcon,
  CopyIcon,
  PencilIcon,
  PlusIcon,
  TrashIcon,
  XIcon,
} from '../components/Icons'
import { relativeDateLabel } from '../lib/date'

const NAME_SUGGESTIONS = ['Push', 'Pull', 'Legs', 'Full Body', 'Haut du corps', 'Bas du corps']

export function ProgrammesScreen() {
  const templates = useTemplates()
  const plannedDates = usePlannedDates()
  const upcoming = useUpcomingPlannedSessions()
  const [creating, setCreating] = useState(false)
  const navigate = useNavigate()
  const pullToRefresh = usePullToRefresh()

  async function handleCreate(name: string) {
    const id = await createTemplate(name)
    setCreating(false)
    navigate(`/programmes/${id}`)
  }

  return (
    <div
      className="mx-auto max-w-md px-4 pt-safe pb-28 pt-4 animate-fade-in"
      onPointerDown={pullToRefresh.handlers.onPointerDown}
      onPointerMove={pullToRefresh.handlers.onPointerMove}
      onPointerUp={pullToRefresh.handlers.onPointerUp}
      onPointerCancel={pullToRefresh.handlers.onPointerCancel}
    >
      <PullToRefreshIndicator indicatorRef={pullToRefresh.indicatorRef} refreshing={pullToRefresh.refreshing} />
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-lg font-bold text-slate-900">Programmes</h1>
        <button
          type="button"
          onClick={() => setCreating(true)}
          className="flex items-center gap-1 rounded-full bg-brand-600 py-2 pl-2.5 pr-3 text-sm font-semibold text-white active:bg-brand-700"
        >
          <PlusIcon className="h-4 w-4" />
          Créer
        </button>
      </div>

      {templates && templates.length === 0 ? (
        <div className="mb-6 flex flex-col items-center gap-2 rounded-2xl border border-dashed border-slate-300 px-4 py-10 text-center">
          <ClipboardIcon className="h-9 w-9 text-slate-300" />
          <p className="font-medium text-slate-600">Aucun programme</p>
          <p className="text-sm text-slate-400">
            Créez un modèle de séance (Push, Full Body…) pour démarrer plus vite la prochaine fois.
          </p>
        </div>
      ) : (
        <div className="mb-6 space-y-2.5">
          {templates?.map((summary) => (
            <TemplateListItem key={summary.template.id} summary={summary} />
          ))}
        </div>
      )}

      <h2 className="mb-2 px-1 text-sm font-semibold text-slate-700">Planification</h2>
      <PlanningCalendar
        plannedDates={plannedDates ?? new Map()}
        onSelectDate={(date) => navigate(`/jour/${date}`)}
      />

      {upcoming && upcoming.length > 0 && (
        <div className="mt-3 space-y-2">
          {upcoming.map(({ session, templateName }) => (
            <div
              key={session.id}
              className="flex items-center justify-between rounded-xl border border-slate-200 bg-surface px-4 py-3"
            >
              <Link to={`/jour/${session.date}`} className="flex-1 active:opacity-60">
                <p className="text-sm font-semibold text-slate-800">{relativeDateLabel(session.date)}</p>
                <p className="text-xs text-slate-400">{templateName}</p>
              </Link>
              <button
                type="button"
                onClick={() => unschedulePlannedSession(session.id!)}
                className="shrink-0 p-2 text-slate-300 active:text-red-500"
                aria-label="Déplanifier"
              >
                <TrashIcon className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>
      )}

      {creating && (
        <CreateTemplateSheet onCreate={handleCreate} onCancel={() => setCreating(false)} />
      )}
    </div>
  )
}

function TemplateListItem({ summary }: { summary: TemplateSummary }) {
  const { template, exerciseCount } = summary
  const preferences = usePreferences()
  const navigate = useNavigate()
  const [menuOpen, setMenuOpen] = useState(false)
  const [renaming, setRenaming] = useState(false)
  const [deleting, setDeleting] = useState<{ usageCount: number } | null>(null)

  const longPress = useLongPress(() => {
    hapticMenuOpen(!!preferences?.hapticsEnabled)
    setMenuOpen(true)
  })

  async function handleDeleteClick() {
    const usageCount = await countTemplateUsage(template.id!)
    setDeleting({ usageCount })
  }

  return (
    <>
      {/* A div (not <a>): Safari would show its link-preview menu on long-press. */}
      <div
        role="link"
        tabIndex={0}
        onClick={() => navigate(`/programmes/${template.id}`)}
        onKeyDown={(e) => e.key === 'Enter' && navigate(`/programmes/${template.id}`)}
        onContextMenu={longPress.onContextMenu}
        className="flex cursor-pointer items-center justify-between rounded-2xl border border-slate-200 bg-surface px-4 py-3.5 shadow-sm active:bg-slate-50"
        onPointerDown={longPress.onPointerDown}
        onPointerMove={longPress.onPointerMove}
        onPointerUp={longPress.onPointerUp}
        onPointerCancel={longPress.onPointerCancel}
        onClickCapture={longPress.onClickCapture}
      >
        <div>
          <p className="font-semibold text-slate-900">{template.name}</p>
          <p className="text-xs text-slate-400">
            {exerciseCount} exercice{exerciseCount > 1 ? 's' : ''}
          </p>
        </div>
        <ChevronRightIcon className="h-5 w-5 shrink-0 text-slate-300" />
      </div>

      {menuOpen && (
        <ContextMenuSheet
          title={template.name}
          actions={[
            { label: 'Renommer', icon: PencilIcon, onSelect: () => setRenaming(true) },
            { label: 'Dupliquer', icon: CopyIcon, onSelect: () => duplicateTemplate(template.id!) },
            { label: 'Supprimer', icon: TrashIcon, onSelect: handleDeleteClick, danger: true },
          ]}
          onClose={() => setMenuOpen(false)}
        />
      )}

      {renaming && (
        <RenameSheet
          title="Renommer le programme"
          initialName={template.name}
          onRename={(name) => {
            renameTemplate(template.id!, name)
            setRenaming(false)
          }}
          onCancel={() => setRenaming(false)}
        />
      )}

      {deleting && (
        <ConfirmDialog
          title={`Supprimer « ${template.name} » ?`}
          message={
            deleting.usageCount > 0
              ? `Ce programme a ${deleting.usageCount} séance${deleting.usageCount > 1 ? 's' : ''} planifiée${deleting.usageCount > 1 ? 's' : ''} à venir : elle${deleting.usageCount > 1 ? 's seront' : ' sera'} annulée${deleting.usageCount > 1 ? 's' : ''}. Vos séances déjà réalisées ne sont pas concernées.`
              : 'Cette action est définitive.'
          }
          confirmLabel="Supprimer"
          danger
          onConfirm={() => {
            deleteTemplate(template.id!)
            setDeleting(null)
          }}
          onCancel={() => setDeleting(null)}
        />
      )}
    </>
  )
}

function CreateTemplateSheet({
  onCreate,
  onCancel,
}: {
  onCreate: (name: string) => void
  onCancel: () => void
}) {
  const [name, setName] = useState('')

  return (
    <div className="fixed inset-0 z-40 flex flex-col bg-surface">
      <div className="flex items-center justify-between border-b border-slate-200 px-4 pt-safe pt-4 pb-3">
        <h2 className="text-lg font-bold text-slate-900">Nouveau programme</h2>
        <button
          type="button"
          onClick={onCancel}
          className="rounded-full p-2 text-slate-500 active:bg-slate-100"
          aria-label="Fermer"
        >
          <XIcon className="h-6 w-6" />
        </button>
      </div>
      <div className="flex-1 overflow-y-auto px-4 pb-8">
        <div className="mt-4">
          <label className="mb-1 block text-sm font-medium text-slate-600">Nom du programme</label>
          <input
            autoFocus
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Ex : Push"
            className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-base outline-none focus:border-brand-400"
          />
          <div className="mt-3 flex flex-wrap gap-2">
            {NAME_SUGGESTIONS.map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => setName(s)}
                className="rounded-full bg-slate-100 px-3.5 py-2 text-sm font-medium text-slate-600 active:bg-slate-200"
              >
                {s}
              </button>
            ))}
          </div>
        </div>
        <div className="mt-6 flex gap-2">
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 rounded-xl bg-slate-100 py-3 font-medium text-slate-600 active:bg-slate-200"
          >
            Annuler
          </button>
          <button
            type="button"
            onClick={() => name.trim() && onCreate(name.trim())}
            disabled={!name.trim()}
            className="flex-1 rounded-xl bg-brand-600 py-3 font-medium text-white disabled:opacity-40 active:bg-brand-700"
          >
            Créer
          </button>
        </div>
      </div>
    </div>
  )
}
