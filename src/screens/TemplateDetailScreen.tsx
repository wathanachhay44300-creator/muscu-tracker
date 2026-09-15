import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useTemplateDetail } from '../hooks/useTemplates'
import {
  addExerciseToTemplate,
  countTemplateUsage,
  deleteTemplate,
  removeExerciseFromTemplate,
  renameTemplate,
  updateTargetSets,
} from '../lib/templateActions'
import { schedulePlannedSession, startWorkoutFromTemplate } from '../lib/planningActions'
import { ExercisePickerSheet } from '../components/ExercisePickerSheet'
import { MuscleGroupBreakdown } from '../components/MuscleGroupBreakdown'
import { ConfirmDialog } from '../components/ConfirmDialog'
import { ChevronLeftIcon, PlusIcon, TrashIcon } from '../components/Icons'
import { todayISO } from '../lib/date'
import type { Exercise } from '../types'

export function TemplateDetailScreen() {
  const { templateId } = useParams()
  const id = templateId ? Number(templateId) : undefined
  const detail = useTemplateDetail(id)
  const navigate = useNavigate()

  const [pickerOpen, setPickerOpen] = useState(false)
  const [scheduling, setScheduling] = useState(false)
  const [starting, setStarting] = useState(false)
  const [deleting, setDeleting] = useState<{ usageCount: number } | null>(null)

  if (!detail) {
    return (
      <div className="mx-auto max-w-md px-4 pt-safe pb-28 pt-4 animate-fade-in">
        <p className="text-slate-400">Programme introuvable.</p>
      </div>
    )
  }

  const { template, exercises } = detail

  async function handleSelectExercise(exercise: Exercise) {
    await addExerciseToTemplate(id!, exercise.id!)
    setPickerOpen(false)
  }

  async function handleStartToday() {
    setStarting(true)
    await startWorkoutFromTemplate(todayISO(), id!)
    navigate('/')
  }

  async function handleDeleteClick() {
    const usageCount = await countTemplateUsage(id!)
    setDeleting({ usageCount })
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
          onClick={() => navigate('/programmes')}
          className="-ml-2 rounded-full p-2 text-slate-400 active:bg-slate-100"
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
          className="flex-1 rounded-lg bg-transparent text-lg font-bold text-slate-900 outline-none focus:bg-slate-100"
          aria-label="Nom du programme"
        />
      </div>

      {exercises.length === 0 ? (
        <div className="mb-4 rounded-2xl border border-dashed border-slate-300 px-4 py-10 text-center">
          <p className="text-slate-500">Aucun exercice pour l'instant.</p>
        </div>
      ) : (
        <div className="mb-4 space-y-2">
          {exercises.map((te) => (
            <div
              key={te.id}
              className="flex items-center justify-between gap-2 rounded-xl border border-slate-200 bg-surface px-4 py-3"
            >
              <div className="min-w-0">
                <p className="truncate font-medium text-slate-900">{te.exercise.name}</p>
                <p className="text-xs text-slate-400">{te.exercise.muscleGroup}</p>
              </div>
              <div className="flex shrink-0 items-center gap-2">
                <div className="flex items-center overflow-hidden rounded-lg bg-slate-100">
                  <button
                    type="button"
                    onClick={() => updateTargetSets(te.id!, te.targetSets - 1)}
                    className="px-2.5 py-1.5 text-slate-500 active:text-brand-600"
                    aria-label="Moins de séries"
                  >
                    −
                  </button>
                  <span className="w-16 text-center text-xs font-medium text-slate-600">
                    {te.targetSets} série{te.targetSets > 1 ? 's' : ''}
                  </span>
                  <button
                    type="button"
                    onClick={() => updateTargetSets(te.id!, te.targetSets + 1)}
                    className="px-2.5 py-1.5 text-slate-500 active:text-brand-600"
                    aria-label="Plus de séries"
                  >
                    +
                  </button>
                </div>
                <button
                  type="button"
                  onClick={() => removeExerciseFromTemplate(te.id!)}
                  className="p-1.5 text-slate-300 active:text-red-500"
                  aria-label={`Retirer ${te.exercise.name}`}
                >
                  <TrashIcon className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <button
        type="button"
        onClick={() => setPickerOpen(true)}
        className="flex w-full items-center justify-center gap-2 rounded-2xl bg-slate-100 py-3.5 font-semibold text-brand-600 active:bg-slate-200"
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
            className="w-full rounded-2xl bg-brand-600 py-4 font-semibold text-white shadow-sm active:bg-brand-700 disabled:opacity-50"
          >
            Démarrer maintenant
          </button>
          <button
            type="button"
            onClick={() => setScheduling(true)}
            className="w-full rounded-2xl bg-slate-100 py-3.5 font-semibold text-slate-700 active:bg-slate-200"
          >
            Planifier pour plus tard
          </button>
        </div>
      )}

      <button
        type="button"
        onClick={handleDeleteClick}
        className="mt-6 flex w-full items-center justify-center gap-1.5 py-3 text-sm font-medium text-red-500 active:text-red-700"
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

      {scheduling && (
        <ScheduleSheet
          onSchedule={async (date) => {
            await schedulePlannedSession(date, id!)
            setScheduling(false)
          }}
          onCancel={() => setScheduling(false)}
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
          onConfirm={confirmDelete}
          onCancel={() => setDeleting(null)}
        />
      )}
    </div>
  )
}

function ScheduleSheet({
  onSchedule,
  onCancel,
}: {
  onSchedule: (date: string) => void
  onCancel: () => void
}) {
  const [date, setDate] = useState(todayISO())

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 animate-fade-in-backdrop sm:items-center sm:p-4"
      onClick={onCancel}
    >
      <div
        className="w-full max-w-sm animate-slide-up rounded-t-2xl bg-surface p-5 pb-safe shadow-lg sm:rounded-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-base font-semibold text-slate-900">Planifier cette séance</h2>
        <input
          type="date"
          min={todayISO()}
          value={date}
          onChange={(e) => setDate(e.target.value)}
          className="mt-3 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-base outline-none focus:border-brand-400"
        />
        <div className="mt-5 flex gap-2">
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 rounded-xl bg-slate-100 py-3 font-medium text-slate-600 active:bg-slate-200"
          >
            Annuler
          </button>
          <button
            type="button"
            onClick={() => onSchedule(date)}
            className="flex-1 rounded-xl bg-brand-600 py-3 font-medium text-white active:bg-brand-700"
          >
            Planifier
          </button>
        </div>
      </div>
    </div>
  )
}
