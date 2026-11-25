import { useState } from 'react'
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom'
import { useTemplates, type TemplateSummary } from '../hooks/useTemplates'
import {
  createTemplate,
  deleteTemplate,
  duplicateTemplate,
  renameTemplate,
} from '../lib/templateActions'
import { ContextMenuSheet } from '../components/ContextMenuSheet'
import { t, tn } from '../i18n'
import { ConfirmDialog } from '../components/ConfirmDialog'
import { PullToRefreshIndicator } from '../components/PullToRefreshIndicator'
import { useLongPress } from '../hooks/useLongPress'
import { useInlineRename } from '../hooks/useInlineRename'
import { usePreferences } from '../hooks/usePreferences'
import { usePullToRefresh } from '../hooks/usePullToRefresh'
import { hapticMenuOpen } from '../lib/haptics'
import {
  CheckIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  ClipboardIcon,
  CopyIcon,
  PencilIcon,
  PlusIcon,
  TrashIcon,
  XIcon,
} from '../components/Icons'
import { PlainOnly } from '../components/kawaii/Kawaii'
import { EmptyMochi } from '../components/kawaii/Mochi'

const nameSuggestions = () => ['Push', 'Pull', 'Legs', 'Full Body', t('programs.upper'), t('programs.lower')]

export function ProgrammesScreen() {
  const templates = useTemplates()
  // "Nouveau" on the home screen opens this list with the creation sheet open.
  const [params] = useSearchParams()
  const [creating, setCreating] = useState(() => params.get('nouveau') === '1')
  const location = useLocation()
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
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => (location.key !== 'default' ? navigate(-1) : navigate('/'))}
            aria-label={t('common.back')}
            className="-ml-2 flex h-11 w-11 items-center justify-center rounded-full text-muted active:bg-surface-3"
          >
            <ChevronLeftIcon className="h-5 w-5" />
          </button>
          <h1 className="text-ink">{t('screens.programs')}</h1>
        </div>
        <button
          type="button"
          onClick={() => setCreating(true)}
          className="flex items-center gap-1 rounded-full bg-accent py-2 pl-2.5 pr-3 text-sm font-semibold text-on-accent active:bg-accent-hover"
        >
          <PlusIcon className="h-4 w-4" />
          {t('common.create')}
        </button>
      </div>

      {templates && templates.length === 0 ? (
        <div className="mb-6 flex flex-col items-center gap-2 rounded-2xl border border-dashed border-line-strong px-4 py-10 text-center">
          <PlainOnly>
            <ClipboardIcon className="h-9 w-9 text-faint" />
          </PlainOnly>
          <EmptyMochi />
          <p className="font-medium text-ink-2">{t('programs.none')}</p>
          <p className="text-sm text-muted">
            {t('programs.noneHint')}
          </p>
        </div>
      ) : (
        <div className="space-y-2.5">
          {templates?.map((summary) => (
            <TemplateListItem key={summary.template.id} summary={summary} />
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
  const [deleting, setDeleting] = useState(false)
  const rename = useInlineRename(template.name, (name) => renameTemplate(template.id!, name))

  const longPress = useLongPress(() => {
    hapticMenuOpen(!!preferences?.hapticsEnabled)
    setMenuOpen(true)
  })

  return (
    <>
      {rename.editing ? (
        <div className="flex items-center gap-1.5 rounded-2xl border-2 border-accent-line bg-surface px-3 py-2.5 shadow-sm">
          <input
            autoFocus
            data-no-long-press
            data-no-swipe
            value={rename.value}
            onChange={(e) => rename.setValue(e.target.value)}
            onFocus={(e) => e.target.select()}
            onKeyDown={rename.onKeyDown}
            onBlur={rename.onBlur}
            className="min-w-0 flex-1 bg-transparent px-1 text-base font-semibold text-ink outline-none"
          />
          {/* onMouseDown (not onClick) fires before the input's blur, so these
           * read as an explicit choice rather than losing to the blur-commit. */}
          <button
            type="button"
            onMouseDown={(e) => e.preventDefault()}
            onClick={rename.commit}
            aria-label={t('programs.confirmRename')}
            className="shrink-0 rounded-full p-1.5 text-accent-ink active:bg-surface-3"
          >
            <CheckIcon className="h-5 w-5" />
          </button>
          <button
            type="button"
            onMouseDown={(e) => e.preventDefault()}
            onClick={rename.cancel}
            aria-label={t('programs.cancelRename')}
            className="shrink-0 rounded-full p-1.5 text-muted active:bg-surface-3"
          >
            <XIcon className="h-5 w-5" />
          </button>
        </div>
      ) : (
        // A div (not <a>): Safari would show its link-preview menu on long-press.
        <div
          role="link"
          tabIndex={0}
          onClick={() => navigate(`/programmes/${template.id}`)}
          onKeyDown={(e) => e.key === 'Enter' && navigate(`/programmes/${template.id}`)}
          onContextMenu={longPress.onContextMenu}
          className="flex cursor-pointer items-center justify-between rounded-2xl border border-line bg-surface px-4 py-3.5 shadow-sm active:bg-surface-2"
          onPointerDown={longPress.onPointerDown}
          onPointerMove={longPress.onPointerMove}
          onPointerUp={longPress.onPointerUp}
          onPointerCancel={longPress.onPointerCancel}
          onClickCapture={longPress.onClickCapture}
        >
          <div className="min-w-0">
            <p className="truncate font-semibold text-ink">{template.name}</p>
            <p className="text-xs text-muted">
              {tn('common.exercises', exerciseCount)}
            </p>
          </div>
          <div className="flex shrink-0 items-center gap-0.5">
            <button
              type="button"
              data-no-long-press
              data-no-swipe
              onClick={(e) => {
                e.stopPropagation()
                rename.start()
              }}
              aria-label={t('programs.renameNamed', { name: template.name })}
              className="rounded-full p-1.5 text-faint active:bg-surface-3 active:text-accent-ink"
            >
              <PencilIcon className="h-4 w-4" />
            </button>
            <ChevronRightIcon className="h-5 w-5 text-faint" />
          </div>
        </div>
      )}

      {menuOpen && (
        <ContextMenuSheet
          title={template.name}
          actions={[
            { label: t('common.rename'), icon: PencilIcon, onSelect: rename.start },
            { label: t('common.duplicate'), icon: CopyIcon, onSelect: () => duplicateTemplate(template.id!) },
            { label: t('common.delete'), icon: TrashIcon, onSelect: () => setDeleting(true), danger: true },
          ]}
          onClose={() => setMenuOpen(false)}
        />
      )}

      {deleting && (
        <ConfirmDialog
          title={t('programs.deleteTitle', { name: template.name })}
          message={t('programs.deleteMessage')}
          confirmLabel={t('common.delete')}
          danger
          onConfirm={() => {
            deleteTemplate(template.id!)
            setDeleting(false)
          }}
          onCancel={() => setDeleting(false)}
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
      <div className="flex items-center justify-between border-b border-line px-4 pt-safe pt-4 pb-3">
        <h2 className="text-lg font-bold text-ink">{t('screens.newProgram')}</h2>
        <button
          type="button"
          onClick={onCancel}
          className="rounded-full p-2 text-muted active:bg-surface-3"
          aria-label={t('common.close')}
        >
          <XIcon className="h-6 w-6" />
        </button>
      </div>
      <div className="flex-1 overflow-y-auto px-4 pb-8">
        <div className="mt-4">
          <label className="mb-1 block text-sm font-medium text-ink-2">{t('programs.name')}</label>
          <input
            autoFocus
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder={t('programs.namePlaceholder')}
            className="w-full rounded-xl border border-line bg-surface-2 px-4 py-3 text-base outline-none focus:border-accent-line"
          />
          <div className="mt-3 flex flex-wrap gap-2">
            {nameSuggestions().map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => setName(s)}
                className="rounded-full bg-surface-3 px-3.5 py-2 text-sm font-medium text-ink-2 active:bg-surface-4"
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
            className="flex-1 rounded-xl bg-surface-3 py-3 font-medium text-ink-2 active:bg-surface-4"
          >
            {t('common.cancel')}
          </button>
          <button
            type="button"
            onClick={() => name.trim() && onCreate(name.trim())}
            disabled={!name.trim()}
            className="flex-1 rounded-xl bg-accent py-3 font-medium text-on-accent disabled:opacity-40 active:bg-accent-hover"
          >
            {t('common.create')}
          </button>
        </div>
      </div>
    </div>
  )
}
