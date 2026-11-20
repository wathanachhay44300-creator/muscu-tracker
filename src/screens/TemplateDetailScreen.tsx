import { useState } from 'react'
import { useLocation, useNavigate, useParams } from 'react-router-dom'
import { useTemplateDetail } from '../hooks/useTemplates'
import { useOptimisticOrder } from '../hooks/useOptimisticOrder'
import { useDragReorder } from '../hooks/useDragReorder'
import {
  addExerciseToTemplate,
  deleteTemplate,
  removeExerciseFromTemplate,
  renameTemplate,
  reorderTemplateExercises,
  updateTargetSets,
} from '../lib/templateActions'
import { startWorkoutFromTemplate } from '../lib/sessionStart'
import { ExercisePickerSheet } from '../components/ExercisePickerSheet'
import { MuscleGroupBreakdown } from '../components/MuscleGroupBreakdown'
import { ConfirmDialog } from '../components/ConfirmDialog'
import { ChevronLeftIcon, GripIcon, PlusIcon, TrashIcon } from '../components/Icons'
import { todayISO } from '../lib/date'
import type { Exercise } from '../types'
import type { TemplateExerciseWithDetails } from '../hooks/useTemplates'

export function TemplateDetailScreen() {
  const { templateId } = useParams()
  const id = templateId ? Number(templateId) : undefined
  const detail = useTemplateDetail(id)
  const navigate = useNavigate()
  const location = useLocation()

  const [pickerOpen, setPickerOpen] = useState(false)
  const [starting, setStarting] = useState(false)
  const [deleting, setDeleting] = useState(false)

  const exercises = detail?.exercises ?? []
  const exerciseIds = exercises.map((te) => te.id!)
  const [orderIds, setOrderIds] = useOptimisticOrder(exerciseIds)
  const byId = new Map(exercises.map((te) => [te.id!, te]))
  const orderedExercises = orderIds.map((eid) => byId.get(eid)).filter((te): te is TemplateExerciseWithDetails => !!te)

  const dragReorder = useDragReorder(orderIds, (newOrder) => {
    setOrderIds(newOrder)
    reorderTemplateExercises(newOrder)
  })

  if (!detail) {
    return (
      <div className="mx-auto max-w-md px-4 pt-safe pb-28 pt-4 animate-fade-in">
        <p className="text-muted">Programme introuvable.</p>
      </div>
    )
  }

  const { template } = detail

  async function handleSelectExercise(exercise: Exercise) {
    await addExerciseToTemplate(id!, exercise.id!)
    setPickerOpen(false)
  }

  async function handleStartToday() {
    setStarting(true)
    await startWorkoutFromTemplate(todayISO(), id!)
    navigate('/seance')
  }

  async function confirmDelete() {
    await deleteTemplate(id!)
    navigate('/programmes')
  }

  return (
    <div className="mx-auto max-w-md px-4 pt-safe pb-28 pt-4 animate-fade-in">
      <div className="mb-5 flex items-center gap-2">
        <button
          type="button"
          onClick={() => (location.key !== 'default' ? navigate(-1) : navigate('/programmes'))}
          className="-ml-2 rounded-full p-2 text-muted active:bg-surface-3"
          aria-label="Retour aux programmes"
        >
          <ChevronLeftIcon className="h-5 w-5" />
        </button>
        <input
          defaultValue={template.name}
          onBlur={(e) => {
            const trimmed = e.target.value.trim()
            if (trimmed && trimmed !== template.name) renameTemplate(id!, trimmed)
            else e.target.value = template.name
          }}
          className="flex-1 rounded-lg bg-transparent text-lg font-bold text-ink outline-none focus:bg-surface-3"
          aria-label="Nom du programme"
        />
      </div>

      {exercises.length === 0 ? (
        <div className="mb-4 rounded-2xl border border-dashed border-line-strong px-4 py-10 text-center">
          <p className="text-muted">Aucun exercice pour l'instant.</p>
        </div>
      ) : (
        <div className="mb-4 space-y-2">
          {orderedExercises.map((te) => {
            const row = dragReorder.getRowProps(te.id!)
            return (
            <div
              key={te.id}
              ref={row.containerProps.ref}
              style={row.containerProps.style}
              className={`flex items-center justify-between gap-2 rounded-xl border bg-surface px-4 py-3 ${
                row.isDragging ? 'border-accent-line shadow-lg' : 'border-line'
              }`}
            >
              <div className="flex min-w-0 items-center gap-1.5">
                <button
                  type="button"
                  aria-label="Glisser pour réordonner"
                  className="-ml-1 shrink-0 cursor-grab touch-none rounded-lg p-1.5 text-faint active:cursor-grabbing active:text-muted"
                  {...row.handleProps}
                >
                  <GripIcon className="h-5 w-5" />
                </button>
                <div className="min-w-0">
                  <p className="font-exercise truncate text-ink">{te.exercise.name}</p>
                  <p className="text-xs text-muted">{te.exercise.muscleGroup}</p>
                </div>
              </div>
              <div className="flex shrink-0 items-center gap-2">
                <div className="flex items-center overflow-hidden rounded-lg bg-surface-3">
                  <button
                    type="button"
                    onClick={() => updateTargetSets(te.id!, te.targetSets - 1)}
                    className="px-2.5 py-1.5 text-muted active:text-accent-ink"
                    aria-label="Moins de séries"
                  >
                    −
                  </button>
                  <span className="w-16 text-center text-xs font-medium text-ink-2">
                    {te.targetSets} série{te.targetSets > 1 ? 's' : ''}
                  </span>
                  <button
                    type="button"
                    onClick={() => updateTargetSets(te.id!, te.targetSets + 1)}
                    className="px-2.5 py-1.5 text-muted active:text-accent-ink"
                    aria-label="Plus de séries"
                  >
                    +
                  </button>
                </div>
                <button
                  type="button"
                  onClick={() => removeExerciseFromTemplate(te.id!)}
                  className="p-1.5 text-faint active:text-danger-ink"
                  aria-label={`Retirer ${te.exercise.name}`}
                >
                  <TrashIcon className="h-4 w-4" />
                </button>
              </div>
            </div>
            )
          })}
        </div>
      )}

      <button
        type="button"
        onClick={() => setPickerOpen(true)}
        className="flex w-full items-center justify-center gap-2 rounded-2xl bg-surface-3 py-3.5 font-semibold text-accent-ink active:bg-surface-4"
      >
        <PlusIcon className="h-5 w-5" />
        Ajouter un exercice
      </button>

      {exercises.length > 0 && (
        <div className="mt-4">
          <MuscleGroupBreakdown
            title="Répartition par muscle (prévue)"
            items={exercises.map((te) => ({ muscleGroup: te.exercise.muscleGroup, setCount: te.targetSets }))}
          />
        </div>
      )}

      {exercises.length > 0 && (
        <div className="mt-6 space-y-2.5">
          <button
            type="button"
            onClick={handleStartToday}
            disabled={starting}
            className="w-full rounded-2xl bg-accent py-4 font-semibold text-on-accent shadow-sm active:bg-accent-hover disabled:opacity-50"
          >
            Démarrer maintenant
          </button>
        </div>
      )}

      <button
        type="button"
        onClick={() => setDeleting(true)}
        className="mt-6 flex w-full items-center justify-center gap-1.5 py-3 text-sm font-medium text-danger-ink active:text-danger-ink"
      >
        <TrashIcon className="h-4 w-4" />
        Supprimer ce programme
      </button>

      {pickerOpen && (
        <ExercisePickerSheet
          excludeIds={exercises.map((e) => e.exerciseId)}
          onSelect={handleSelectExercise}
          onClose={() => setPickerOpen(false)}
        />
      )}

      {deleting && (
        <ConfirmDialog
          title={`Supprimer « ${template.name} » ?`}
          message="Cette action est définitive. Vos séances déjà réalisées ne sont pas concernées."
          confirmLabel="Supprimer"
          danger
          onConfirm={confirmDelete}
          onCancel={() => setDeleting(false)}
        />
      )}
    </div>
  )
}
