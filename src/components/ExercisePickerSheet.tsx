import { useEffect, useState } from 'react'
import { db } from '../db'
import { useExerciseLibrary } from '../hooks/useExerciseLibrary'
import { useExerciseBrowser } from '../hooks/useExerciseBrowser'
import { ExerciseFilters } from './ExerciseFilters'
import { ExerciseInfoButton } from './ExerciseInfoSheet'
import { renameExercise, setExerciseFavorite } from '../lib/exerciseActions'
import { guessLoadType } from '../lib/loadType'
import { secondaryGroupsOf } from '../lib/muscleGroups'
import { PrincipalPicker, SecondaryPicker } from './MuscleGroupPickers'
import { LOAD_TYPES, type Exercise, type LoadType, type MuscleGroup } from '../types'
import { SearchIcon, XIcon, PlusIcon, StarIcon, StarOutlineIcon } from './Icons'

interface ExercisePickerSheetProps {
  onSelect: (exercise: Exercise) => void
  onClose: () => void
  /** Exercise ids already in the workout, shown with a checkmark-style highlight. */
  excludeIds?: number[]
}

export function ExercisePickerSheet({ onSelect, onClose, excludeIds = [] }: ExercisePickerSheetProps) {
  const [creating, setCreating] = useState(false)
  const library = useExerciseLibrary()
  const browser = useExerciseBrowser(library, excludeIds)
  const { query, setQuery } = browser

  return (
    <div className="animate-fade-in-backdrop fixed inset-0 z-40 flex flex-col bg-surface">
      <div className="border-b border-slate-200 px-4 pt-safe pt-4 pb-2.5">
        <div className="flex items-center gap-2">
          <div className="flex flex-1 items-center gap-2 rounded-xl bg-slate-100 px-3 py-2.5">
            <SearchIcon className="h-4 w-4 shrink-0 text-slate-400" />
            <input
              autoFocus
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Chercher (ex : shoulder press)…"
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
          <button
            type="button"
            onClick={onClose}
            className="shrink-0 rounded-full p-2 text-slate-500 active:bg-slate-100"
            aria-label="Fermer"
          >
            <XIcon className="h-6 w-6" />
          </button>
        </div>
        {!creating && (
          <div className="mt-2.5">
            <ExerciseFilters
              groups={browser.groups}
              equipment={browser.equipment}
              onToggleGroup={browser.toggleGroup}
              onToggleEquipment={browser.toggleEquipment}
              onClear={browser.clearFilters}
            />
          </div>
        )}
      </div>

      <div className="flex-1 overflow-y-auto px-4 pb-8">
        {creating ? (
          <CreateExerciseForm
            initialName={query}
            onCreated={(ex) => {
              setCreating(false)
              onSelect(ex)
            }}
            onCancel={() => setCreating(false)}
          />
        ) : (
          <>
            <button
              type="button"
              onClick={() => setCreating(true)}
              className="mt-4 flex min-h-12 w-full items-center gap-2 rounded-xl border border-dashed border-brand-300 bg-brand-50 px-4 py-3 text-accent"
            >
              <PlusIcon className="h-5 w-5" />
              <span className="font-medium">
                {query.trim() ? `Créer « ${query.trim()} »` : 'Créer un exercice personnalisé'}
              </span>
            </button>

            {browser.mode === 'search' ? (
              browser.results.length > 0 ? (
                <PickerSection
                  title={`${browser.results.length} résultat${browser.results.length > 1 ? 's' : ''}`}
                  list={browser.results}
                  onSelect={onSelect}
                  secondaryOnly={browser.secondaryOnly}
                />
              ) : (
                <p className="mt-8 text-center text-sm text-slate-400">Aucun exercice trouvé pour « {query.trim()} ».</p>
              )
            ) : (
              <>
                {browser.favorites.length > 0 && <PickerSection title="Favoris" list={browser.favorites} onSelect={onSelect} />}
                {browser.recent.length > 0 && <PickerSection title="Utilisés récemment" list={browser.recent} onSelect={onSelect} />}
                {[...browser.grouped.entries()].map(([group, list]) => (
                  <PickerSection key={group} title={group} list={list} onSelect={onSelect} />
                ))}
                {browser.secondaryList.length > 0 && (
                  <PickerSection
                    title="Muscle secondaire"
                    list={browser.secondaryList}
                    onSelect={onSelect}
                    secondaryOnly={browser.secondaryOnly}
                  />
                )}
                {browser.mode === 'grouped' && browser.results.length === 0 && (
                  <p className="mt-8 text-center text-sm text-slate-400">Aucun exercice pour ces filtres.</p>
                )}
              </>
            )}
          </>
        )}
      </div>
    </div>
  )
}

function PickerSection({
  title,
  list,
  onSelect,
  secondaryOnly,
}: {
  title: string
  list: Exercise[]
  onSelect: (exercise: Exercise) => void
  /** Ids to mark "secondaire" (matched the muscle filter only as a secondary muscle). */
  secondaryOnly?: Set<number>
}) {
  return (
    <div className="mt-5">
      <h3 className="mb-1.5 px-1 text-xs font-semibold uppercase tracking-wide text-slate-400">{title}</h3>
      <div className="overflow-hidden rounded-xl border border-slate-200">
        {list.map((ex, i) => (
          <div key={ex.id} className={`flex items-center ${i > 0 ? 'border-t border-slate-100' : ''}`}>
            <button
              type="button"
              onClick={() => onSelect(ex)}
              className="font-exercise flex-1 px-4 py-3 text-left text-base text-slate-900 active:bg-slate-50"
            >
              {ex.name}
              {secondaryOnly?.has(ex.id!) && (
                <span className="block font-sans text-[11px] font-medium text-slate-400">
                  secondaire · {ex.muscleGroup}
                </span>
              )}
            </button>
            <ExerciseInfoButton exercise={ex} className="!p-2" />
            <button
              type="button"
              onClick={() => setExerciseFavorite(ex.id!, !ex.favoritedAt)}
              aria-label={ex.favoritedAt ? `Retirer ${ex.name} des favoris` : `Ajouter ${ex.name} aux favoris`}
              className="shrink-0 p-2 pr-3 active:opacity-70"
            >
              {ex.favoritedAt ? (
                <StarIcon className="h-4 w-4 text-amber-500" />
              ) : (
                <StarOutlineIcon className="h-4 w-4 text-slate-300" />
              )}
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}

interface ExerciseFormProps {
  initialName: string
  initialGroup: MuscleGroup
  initialSecondary?: MuscleGroup[]
  initialLoadType: LoadType
  /** True for create: the load type re-suggests itself as the name changes, until the user picks one manually. */
  autoSuggestLoadType?: boolean
  submitLabel: string
  onSubmit: (values: {
    name: string
    muscleGroup: MuscleGroup
    secondaryGroups: MuscleGroup[]
    loadType: LoadType
  }) => Promise<void>
  onCancel: () => void
}

/** Shared name + muscle-group + load-type fields, used for both creating and renaming an exercise. */
function ExerciseForm({
  initialName,
  initialGroup,
  initialSecondary = [],
  initialLoadType,
  autoSuggestLoadType = false,
  submitLabel,
  onSubmit,
  onCancel,
}: ExerciseFormProps) {
  const [name, setName] = useState(initialName)
  const [group, setGroup] = useState<MuscleGroup>(initialGroup)
  const [secondary, setSecondary] = useState<MuscleGroup[]>(initialSecondary.filter((g) => g !== initialGroup))
  const [loadType, setLoadType] = useState<LoadType>(initialLoadType)
  const [loadTypeTouched, setLoadTypeTouched] = useState(false)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (autoSuggestLoadType && !loadTypeTouched) {
      setLoadType(guessLoadType(name, group))
    }
    // Re-suggest only while the user hasn't picked a load type themselves.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [name, group, autoSuggestLoadType, loadTypeTouched])

  async function handleSubmit() {
    const trimmed = name.trim()
    if (!trimmed || saving) return
    setSaving(true)
    await onSubmit({ name: trimmed, muscleGroup: group, secondaryGroups: secondary.filter((g) => g !== group), loadType })
  }

  return (
    <div className="mt-4 space-y-4">
      <div>
        <label className="mb-1 block text-sm font-medium text-slate-600">Nom de l'exercice</label>
        <input
          autoFocus
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Ex : Développé Smith machine"
          className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-base outline-none focus:border-brand-400"
        />
      </div>
      <div>
        <label className="mb-1 block text-sm font-medium text-slate-600">Muscle principal</label>
        <PrincipalPicker
          value={group}
          onChange={(g) => {
            setGroup(g)
            // The main muscle can't also be a secondary one.
            setSecondary((list) => list.filter((x) => x !== g))
          }}
        />
      </div>
      <div>
        <label className="mb-1 block text-sm font-medium text-slate-600">
          Muscles secondaires <span className="font-normal text-slate-400">(optionnel)</span>
        </label>
        <SecondaryPicker principal={group} value={secondary} onChange={setSecondary} />
      </div>
      <div>
        <label className="mb-1 block text-sm font-medium text-slate-600">Type de chargement</label>
        <div className="flex flex-wrap gap-2">
          {LOAD_TYPES.map((lt) => (
            <button
              key={lt}
              type="button"
              onClick={() => {
                setLoadType(lt)
                setLoadTypeTouched(true)
              }}
              className={`rounded-full px-3.5 py-2 text-sm font-medium ${
                loadType === lt
                  ? 'bg-brand-600 text-white'
                  : 'bg-slate-100 text-slate-600 active:bg-slate-200'
              }`}
            >
              {lt}
            </button>
          ))}
        </div>
      </div>
      <div className="flex gap-2 pt-2">
        <button
          type="button"
          onClick={onCancel}
          className="flex-1 rounded-xl bg-slate-100 py-3 font-medium text-slate-600 active:bg-slate-200"
        >
          Annuler
        </button>
        <button
          type="button"
          onClick={handleSubmit}
          disabled={!name.trim() || saving}
          className="flex-1 rounded-xl bg-brand-600 py-3 font-medium text-white disabled:opacity-40 active:bg-brand-700"
        >
          {submitLabel}
        </button>
      </div>
    </div>
  )
}

export function CreateExerciseForm({
  initialName,
  onCreated,
  onCancel,
}: {
  initialName: string
  onCreated: (exercise: Exercise) => void
  onCancel: () => void
}) {
  return (
    <ExerciseForm
      initialName={initialName}
      initialGroup="Autre"
      initialLoadType={guessLoadType(initialName)}
      autoSuggestLoadType
      submitLabel="Ajouter"
      onCancel={onCancel}
      onSubmit={async ({ name, muscleGroup, secondaryGroups, loadType }) => {
        const createdAt = Date.now()
        const row = {
          name,
          muscleGroup,
          loadType,
          isCustom: true,
          createdAt,
          ...(secondaryGroups.length > 0 ? { secondaryGroups } : {}),
        }
        const id = await db.exercises.add(row)
        onCreated({ id, ...row })
      }}
    />
  )
}

export function EditExerciseForm({
  exercise,
  onSaved,
  onCancel,
}: {
  exercise: Exercise
  onSaved: () => void
  onCancel: () => void
}) {
  return (
    <ExerciseForm
      initialName={exercise.name}
      initialGroup={exercise.muscleGroup}
      initialSecondary={secondaryGroupsOf(exercise)}
      initialLoadType={exercise.loadType}
      submitLabel="Enregistrer"
      onCancel={onCancel}
      onSubmit={async ({ name, muscleGroup, secondaryGroups, loadType }) => {
        await renameExercise(exercise.id!, { name, muscleGroup, secondaryGroups, loadType })
        onSaved()
      }}
    />
  )
}
