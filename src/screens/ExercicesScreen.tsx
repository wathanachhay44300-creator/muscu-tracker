import { useState } from 'react'
import { Link } from 'react-router-dom'
import type { Exercise } from '../types'
import { CreateExerciseForm, EditExerciseForm } from '../components/ExercisePickerSheet'
import { ConfirmDialog } from '../components/ConfirmDialog'
import { ContextMenuSheet } from '../components/ContextMenuSheet'
import { PullToRefreshIndicator } from '../components/PullToRefreshIndicator'
import { useExerciseLibrary } from '../hooks/useExerciseLibrary'
import { useExerciseBrowser } from '../hooks/useExerciseBrowser'
import { ExerciseFilters } from '../components/ExerciseFilters'
import { ExerciseInfoButton } from '../components/ExerciseInfoSheet'
import { useInlineRename } from '../hooks/useInlineRename'
import { useLongPress } from '../hooks/useLongPress'
import { usePreferences } from '../hooks/usePreferences'
import { usePullToRefresh } from '../hooks/usePullToRefresh'
import { hapticMenuOpen } from '../lib/haptics'
import { countExerciseUsage, renameExerciseName, setExerciseFavorite, softDeleteExercise } from '../lib/exerciseActions'
import {
  CheckIcon,
  ChevronRightIcon,
  PencilIcon,
  PlusIcon,
  SearchIcon,
  SettingsIcon,
  StarIcon,
  StarOutlineIcon,
  TrashIcon,
  XIcon,
} from '../components/Icons'

export function ExercicesScreen() {
  const [creating, setCreating] = useState(false)
  const [editing, setEditing] = useState<Exercise | null>(null)
  const [deleting, setDeleting] = useState<{ exercise: Exercise; usageCount: number } | null>(null)
  const pullToRefresh = usePullToRefresh()
  const library = useExerciseLibrary()
  const browser = useExerciseBrowser(library)
  const { query, setQuery } = browser

  async function handleDeleteClick(ex: Exercise) {
    const usageCount = await countExerciseUsage(ex.id!)
    setDeleting({ exercise: ex, usageCount })
  }

  async function confirmDelete() {
    if (!deleting) return
    await softDeleteExercise(deleting.exercise.id!)
    setDeleting(null)
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
        <h1 className="text-lg font-bold text-slate-900">Exercices</h1>
        <button
          type="button"
          onClick={() => setCreating(true)}
          className="flex items-center gap-1 rounded-full bg-brand-600 py-2 pl-2.5 pr-3 text-sm font-semibold text-white active:bg-brand-700"
        >
          <PlusIcon className="h-4 w-4" />
          Ajouter
        </button>
      </div>

      <div className="mb-2 flex items-center gap-2 rounded-xl bg-slate-100 px-3 py-2.5">
        <SearchIcon className="h-4 w-4 shrink-0 text-slate-400" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Chercher (ex : shoulder press, dev incliné)…"
          enterKeyHint="search"
          autoCapitalize="off"
          autoCorrect="off"
          className="w-full bg-transparent text-base outline-none placeholder:text-slate-400"
        />
        {query && (
          <button type="button" onClick={() => setQuery('')} aria-label="Effacer la recherche" className="shrink-0 rounded-full p-1 text-slate-400 active:bg-slate-200">
            <XIcon className="h-4 w-4" />
          </button>
        )}
      </div>

      <div className="mb-4">
        <ExerciseFilters
          groups={browser.groups}
          equipment={browser.equipment}
          onToggleGroup={browser.toggleGroup}
          onToggleEquipment={browser.toggleEquipment}
          onClear={browser.clearFilters}
        />
      </div>

      {browser.mode === 'search' ? (
        browser.results.length > 0 ? (
          <>
            <p className="mb-1.5 px-1 text-xs font-medium text-slate-400">
              {browser.results.length} résultat{browser.results.length > 1 ? 's' : ''}
            </p>
            <ExerciseSection title={null} exercises={browser.results} onEdit={setEditing} onDelete={handleDeleteClick} />
          </>
        ) : (
          <NoResults query={query} onCreate={() => setCreating(true)} />
        )
      ) : (
        <>
          {browser.favorites.length > 0 && (
            <ExerciseSection title="Favoris" exercises={browser.favorites} onEdit={setEditing} onDelete={handleDeleteClick} />
          )}
          {browser.recent.length > 0 && (
            <ExerciseSection title="Utilisés récemment" exercises={browser.recent} onEdit={setEditing} onDelete={handleDeleteClick} />
          )}
          {[...browser.grouped.entries()].map(([group, list]) => (
            <ExerciseSection key={group} title={group} exercises={list} onEdit={setEditing} onDelete={handleDeleteClick} />
          ))}
          {browser.mode === 'grouped' && browser.results.length === 0 && (
            <p className="mt-8 text-center text-sm text-slate-400">Aucun exercice pour ces filtres.</p>
          )}
        </>
      )}

      {creating && (
        <div className="animate-fade-in-backdrop fixed inset-0 z-40 flex flex-col bg-surface">
          <div className="flex items-center justify-between border-t border-slate-200 px-4 pt-safe pt-4 pb-3">
            <h2 className="text-lg font-bold text-slate-900">Nouvel exercice</h2>
            <button
              type="button"
              onClick={() => setCreating(false)}
              className="rounded-full p-2 text-slate-500 active:bg-slate-100"
              aria-label="Fermer"
            >
              <XIcon className="h-6 w-6" />
            </button>
          </div>
          <div className="flex-1 overflow-y-auto px-4 pb-8">
            <CreateExerciseForm
              initialName={query}
              onCreated={() => setCreating(false)}
              onCancel={() => setCreating(false)}
            />
          </div>
        </div>
      )}

      {editing && (
        <div className="animate-fade-in-backdrop fixed inset-0 z-40 flex flex-col bg-surface">
          <div className="flex items-center justify-between border-t border-slate-200 px-4 pt-safe pt-4 pb-3">
            <h2 className="text-lg font-bold text-slate-900">Modifier l'exercice</h2>
            <button
              type="button"
              onClick={() => setEditing(null)}
              className="rounded-full p-2 text-slate-500 active:bg-slate-100"
              aria-label="Fermer"
            >
              <XIcon className="h-6 w-6" />
            </button>
          </div>
          <div className="flex-1 overflow-y-auto px-4 pb-8">
            <EditExerciseForm
              exercise={editing}
              onSaved={() => setEditing(null)}
              onCancel={() => setEditing(null)}
            />
          </div>
        </div>
      )}

      {deleting && (
        <ConfirmDialog
          title={`Supprimer « ${deleting.exercise.name} » ?`}
          message={
            deleting.usageCount > 0
              ? `Cet exercice a été utilisé dans ${deleting.usageCount} séance${deleting.usageCount > 1 ? 's' : ''}. Son historique sera conservé, mais il ne sera plus proposé pour vos prochaines séances.`
              : 'Cette action est définitive.'
          }
          confirmLabel="Supprimer"
          danger
          onConfirm={confirmDelete}
          onCancel={() => setDeleting(null)}
        />
      )}
    </div>
  )
}

function ExerciseSection({
  title,
  exercises,
  onEdit,
  onDelete,
}: {
  title: string | null
  exercises: Exercise[]
  onEdit: (ex: Exercise) => void
  onDelete: (ex: Exercise) => void
}) {
  return (
    <div className="mb-5">
      {title && <h3 className="mb-1.5 px-1 text-xs font-semibold uppercase tracking-wide text-slate-400">{title}</h3>}
      <div className="overflow-hidden rounded-xl border border-slate-200 bg-surface">
        {exercises.map((ex, i) => (
          <ExerciseRow key={ex.id} exercise={ex} bordered={i > 0} onEdit={() => onEdit(ex)} onDelete={() => onDelete(ex)} />
        ))}
      </div>
    </div>
  )
}

function ExerciseRow({
  exercise,
  bordered,
  onEdit,
  onDelete,
}: {
  exercise: Exercise
  bordered: boolean
  onEdit: () => void
  onDelete: () => void
}) {
  const preferences = usePreferences()
  const [menuOpen, setMenuOpen] = useState(false)
  const rename = useInlineRename(exercise.name, (name) => renameExerciseName(exercise.id!, name))

  const longPress = useLongPress(() => {
    hapticMenuOpen(!!preferences?.hapticsEnabled)
    setMenuOpen(true)
  })

  if (rename.editing) {
    return (
      <div className={`flex items-center gap-1 pl-4 pr-2 ${bordered ? 'border-t border-slate-100' : ''}`}>
        <input
          autoFocus
          data-no-long-press
          data-no-swipe
          value={rename.value}
          onChange={(e) => rename.setValue(e.target.value)}
          onFocus={(e) => e.target.select()}
          onKeyDown={rename.onKeyDown}
          onBlur={rename.onBlur}
          className="font-exercise min-w-0 flex-1 bg-transparent py-3 text-[0.95rem] text-slate-900 outline-none"
        />
        <button
          type="button"
          onMouseDown={(e) => e.preventDefault()}
          onClick={rename.commit}
          aria-label="Valider le renommage"
          className="shrink-0 rounded-full p-2 text-accent active:bg-slate-100"
        >
          <CheckIcon className="h-4 w-4" />
        </button>
        <button
          type="button"
          onMouseDown={(e) => e.preventDefault()}
          onClick={rename.cancel}
          aria-label="Annuler le renommage"
          className="shrink-0 rounded-full p-2 text-slate-400 active:bg-slate-100"
        >
          <XIcon className="h-4 w-4" />
        </button>
      </div>
    )
  }

  return (
    <div
      className={`flex items-center gap-1 pr-2 ${bordered ? 'border-t border-slate-100' : ''}`}
      onContextMenu={longPress.onContextMenu}
      onPointerDown={longPress.onPointerDown}
      onPointerMove={longPress.onPointerMove}
      onPointerUp={longPress.onPointerUp}
      onPointerCancel={longPress.onPointerCancel}
      onClickCapture={longPress.onClickCapture}
    >
      <button
        type="button"
        data-no-long-press
        data-no-swipe
        onClick={() => setExerciseFavorite(exercise.id!, !exercise.favoritedAt)}
        aria-label={exercise.favoritedAt ? `Retirer ${exercise.name} des favoris` : `Ajouter ${exercise.name} aux favoris`}
        className="shrink-0 p-2 active:opacity-70"
      >
        {exercise.favoritedAt ? (
          <StarIcon className="h-4 w-4 text-amber-500" />
        ) : (
          <StarOutlineIcon className="h-4 w-4 text-slate-300" />
        )}
      </button>
      <Link to={`/exercices/${exercise.id}`} className="flex flex-1 items-center justify-between py-3 pl-1 active:bg-slate-50">
        <span className="font-exercise text-[0.95rem] text-slate-900">{exercise.name}</span>
        <ChevronRightIcon className="h-4 w-4 shrink-0 text-slate-300" />
      </Link>
      <ExerciseInfoButton exercise={exercise} className="!p-1.5" />
      <button
        type="button"
        data-no-long-press
        data-no-swipe
        onClick={rename.start}
        className="shrink-0 p-2 text-slate-300 active:text-accent"
        aria-label={`Renommer ${exercise.name}`}
      >
        <PencilIcon className="h-4 w-4" />
      </button>
      {exercise.isCustom && (
        <button
          type="button"
          data-no-long-press
          data-no-swipe
          onClick={onDelete}
          className="shrink-0 p-2 text-slate-300 active:text-red-500"
          aria-label={`Supprimer ${exercise.name}`}
        >
          <TrashIcon className="h-4 w-4" />
        </button>
      )}

      {menuOpen && (
        <ContextMenuSheet
          title={exercise.name}
          actions={[
            { label: 'Renommer', icon: PencilIcon, onSelect: rename.start },
            { label: 'Modifier les détails', icon: SettingsIcon, onSelect: onEdit },
            ...(exercise.isCustom
              ? [{ label: 'Supprimer', icon: TrashIcon, onSelect: onDelete, danger: true }]
              : []),
          ]}
          onClose={() => setMenuOpen(false)}
        />
      )}
    </div>
  )
}

/** Shown when a search finds nothing: offers to create the exercise with the typed text. */
export function NoResults({ query, onCreate }: { query: string; onCreate: () => void }) {
  return (
    <div className="mt-6 rounded-2xl border border-dashed border-slate-300 px-4 py-8 text-center">
      <p className="text-sm text-slate-500">Aucun exercice trouvé pour « {query.trim()} ».</p>
      <button
        type="button"
        onClick={onCreate}
        className="mt-3 inline-flex min-h-12 items-center gap-2 rounded-xl bg-brand-600 px-5 text-sm font-semibold text-white active:bg-brand-700"
      >
        <PlusIcon className="h-4 w-4" />
        Créer « {query.trim()} »
      </button>
    </div>
  )
}
