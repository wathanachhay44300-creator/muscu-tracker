import { useMemo, useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { Link } from 'react-router-dom'
import { db } from '../db'
import type { Exercise, MuscleGroup } from '../types'
import { CreateExerciseForm, EditExerciseForm } from '../components/ExercisePickerSheet'
import { ConfirmDialog } from '../components/ConfirmDialog'
import { countExerciseUsage, softDeleteExercise } from '../lib/exerciseActions'
import {
  ChevronRightIcon,
  PencilIcon,
  PlusIcon,
  SearchIcon,
  TrashIcon,
  XIcon,
} from '../components/Icons'

export function ExercicesScreen() {
  const [query, setQuery] = useState('')
  const [creating, setCreating] = useState(false)
  const [editing, setEditing] = useState<Exercise | null>(null)
  const [deleting, setDeleting] = useState<{ exercise: Exercise; usageCount: number } | null>(null)

  const exercises =
    useLiveQuery(() => db.exercises.orderBy('name').filter((e) => !e.deletedAt).toArray(), []) ?? []

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return q ? exercises.filter((e) => e.name.toLowerCase().includes(q)) : exercises
  }, [exercises, query])

  const grouped = useMemo(() => {
    const map = new Map<MuscleGroup, Exercise[]>()
    for (const ex of filtered) {
      if (!map.has(ex.muscleGroup)) map.set(ex.muscleGroup, [])
      map.get(ex.muscleGroup)!.push(ex)
    }
    return map
  }, [filtered])

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
    <div className="mx-auto max-w-md px-4 pt-safe pb-28 pt-4">
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

      <div className="mb-4 flex items-center gap-2 rounded-xl bg-slate-100 px-3 py-2.5">
        <SearchIcon className="h-4 w-4 shrink-0 text-slate-400" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Chercher un exercice…"
          className="w-full bg-transparent text-base outline-none placeholder:text-slate-400"
        />
      </div>

      {[...grouped.entries()].map(([group, list]) => (
        <div key={group} className="mb-5">
          <h3 className="mb-1.5 px-1 text-xs font-semibold uppercase tracking-wide text-slate-400">
            {group}
          </h3>
          <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
            {list.map((ex, i) => (
              <div
                key={ex.id}
                className={`flex items-center gap-1 pr-2 ${i > 0 ? 'border-t border-slate-100' : ''}`}
              >
                <Link to={`/exercices/${ex.id}`} className="flex flex-1 items-center justify-between py-3 pl-4 active:bg-slate-50">
                  <span className="text-base text-slate-900">{ex.name}</span>
                  <ChevronRightIcon className="h-4 w-4 shrink-0 text-slate-300" />
                </Link>
                <button
                  type="button"
                  onClick={() => setEditing(ex)}
                  className="shrink-0 p-2 text-slate-300 active:text-brand-600"
                  aria-label={`Renommer ${ex.name}`}
                >
                  <PencilIcon className="h-4 w-4" />
                </button>
                {ex.isCustom && (
                  <button
                    type="button"
                    onClick={() => handleDeleteClick(ex)}
                    className="shrink-0 p-2 text-slate-300 active:text-red-500"
                    aria-label={`Supprimer ${ex.name}`}
                  >
                    <TrashIcon className="h-4 w-4" />
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      ))}

      {filtered.length === 0 && (
        <p className="mt-8 text-center text-sm text-slate-400">
          Aucun exercice trouvé pour « {query} ».
        </p>
      )}

      {creating && (
        <div className="fixed inset-0 z-40 flex flex-col bg-white">
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
        <div className="fixed inset-0 z-40 flex flex-col bg-white">
          <div className="flex items-center justify-between border-t border-slate-200 px-4 pt-safe pt-4 pb-3">
            <h2 className="text-lg font-bold text-slate-900">Renommer l'exercice</h2>
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
