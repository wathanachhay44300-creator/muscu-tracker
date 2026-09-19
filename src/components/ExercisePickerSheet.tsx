import { useEffect, useMemo, useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '../db'
import { renameExercise } from '../lib/exerciseActions'
import { guessLoadType } from '../lib/loadType'
import { LOAD_TYPES, MUSCLE_GROUPS, type Exercise, type LoadType, type MuscleGroup } from '../types'
import { SearchIcon, XIcon, PlusIcon } from './Icons'

interface ExercisePickerSheetProps {
  onSelect: (exercise: Exercise) => void
  onClose: () => void
  /** Exercise ids already in the workout, shown with a checkmark-style highlight. */
  excludeIds?: number[]
}

export function ExercisePickerSheet({ onSelect, onClose, excludeIds = [] }: ExercisePickerSheetProps) {
  const [query, setQuery] = useState('')
  const [creating, setCreating] = useState(false)

  const exercises =
    useLiveQuery(() => db.exercises.orderBy('name').filter((e) => !e.deletedAt).toArray(), []) ?? []

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    const list = q ? exercises.filter((e) => e.name.toLowerCase().includes(q)) : exercises
    const excluded = new Set(excludeIds)
    return list.filter((e) => !excluded.has(e.id!))
  }, [exercises, query, excludeIds])

  const grouped = useMemo(() => {
    const map = new Map<MuscleGroup, Exercise[]>()
    for (const ex of filtered) {
      if (!map.has(ex.muscleGroup)) map.set(ex.muscleGroup, [])
      map.get(ex.muscleGroup)!.push(ex)
    }
    return map
  }, [filtered])

  return (
    <div className="animate-fade-in-backdrop fixed inset-0 z-40 flex flex-col bg-surface">
      <div className="flex items-center gap-2 border-b border-slate-200 px-4 pt-safe pt-4 pb-3">
        <div className="flex flex-1 items-center gap-2 rounded-xl bg-slate-100 px-3 py-2.5">
          <SearchIcon className="h-4 w-4 shrink-0 text-slate-400" />
          <input
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Chercher un exercice…"
            className="w-full bg-transparent text-base outline-none placeholder:text-slate-400"
          />
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
              className="mt-4 flex w-full items-center gap-2 rounded-xl border border-dashed border-brand-300 bg-brand-50 px-4 py-3 text-accent"
            >
              <PlusIcon className="h-5 w-5" />
              <span className="font-medium">Créer un exercice personnalisé</span>
            </button>

            {[...grouped.entries()].map(([group, list]) => (
              <div key={group} className="mt-5">
                <h3 className="mb-1.5 px-1 text-xs font-semibold uppercase tracking-wide text-slate-400">
                  {group}
                </h3>
                <div className="overflow-hidden rounded-xl border border-slate-200">
                  {list.map((ex, i) => (
                    <button
                      key={ex.id}
                      type="button"
                      onClick={() => onSelect(ex)}
                      className={`font-exercise block w-full px-4 py-3 text-left text-base text-slate-900 active:bg-slate-50 ${
                        i > 0 ? 'border-t border-slate-100' : ''
                      }`}
                    >
                      {ex.name}
                    </button>
                  ))}
                </div>
              </div>
            ))}

            {filtered.length === 0 && (
              <p className="mt-8 text-center text-sm text-slate-400">
                Aucun exercice trouvé pour « {query} ».
              </p>
            )}
          </>
        )}
      </div>
    </div>
  )
}

interface ExerciseFormProps {
  initialName: string
  initialGroup: MuscleGroup
  initialLoadType: LoadType
  /** True for create: the load type re-suggests itself as the name changes, until the user picks one manually. */
  autoSuggestLoadType?: boolean
  submitLabel: string
  onSubmit: (values: { name: string; muscleGroup: MuscleGroup; loadType: LoadType }) => Promise<void>
  onCancel: () => void
}

/** Shared name + muscle-group + load-type fields, used for both creating and renaming an exercise. */
function ExerciseForm({
  initialName,
  initialGroup,
  initialLoadType,
  autoSuggestLoadType = false,
  submitLabel,
  onSubmit,
  onCancel,
}: ExerciseFormProps) {
  const [name, setName] = useState(initialName)
  const [group, setGroup] = useState<MuscleGroup>(initialGroup)
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
    await onSubmit({ name: trimmed, muscleGroup: group, loadType })
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
        <label className="mb-1 block text-sm font-medium text-slate-600">Groupe musculaire</label>
        <div className="flex flex-wrap gap-2">
          {MUSCLE_GROUPS.map((g) => (
            <button
              key={g}
              type="button"
              onClick={() => setGroup(g)}
              className={`rounded-full px-3.5 py-2 text-sm font-medium ${
                group === g
                  ? 'bg-brand-600 text-white'
                  : 'bg-slate-100 text-slate-600 active:bg-slate-200'
              }`}
            >
              {g}
            </button>
          ))}
        </div>
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
      onSubmit={async ({ name, muscleGroup, loadType }) => {
        const createdAt = Date.now()
        const id = await db.exercises.add({ name, muscleGroup, loadType, isCustom: true, createdAt })
        onCreated({ id, name, muscleGroup, loadType, isCustom: true, createdAt })
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
      initialLoadType={exercise.loadType}
      submitLabel="Enregistrer"
      onCancel={onCancel}
      onSubmit={async ({ name, muscleGroup, loadType }) => {
        await renameExercise(exercise.id!, { name, muscleGroup, loadType })
        onSaved()
      }}
    />
  )
}
