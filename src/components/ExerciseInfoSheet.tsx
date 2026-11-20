import { useEffect, useRef, useState, type PointerEvent as ReactPointerEvent } from 'react'
import { createPortal } from 'react-dom'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '../db'
import { MUSCLES } from '../data/muscles'
import { updateExerciseDetails } from '../lib/exerciseActions'
import { demoSearchUrl, getExerciseInfo, normalizeVideoUrl } from '../lib/exerciseInfo'
import { EQUIPMENT_LABEL, type Exercise, type MuscleId } from '../types'
import { secondaryGroupsOf } from '../lib/muscleGroups'
import { BodyDiagram } from './BodyDiagram'
import { PrincipalPicker, SecondaryPicker } from './MuscleGroupPickers'
import { ExerciseImages } from './ExerciseImages'
import { InfoIcon, PlayCircleIcon, XIcon } from './Icons'

/** The little "i" that opens an exercise's sheet; usable anywhere an exercise is listed. */
export function ExerciseInfoButton({ exercise, className = '' }: { exercise: Exercise; className?: string }) {
  const [open, setOpen] = useState(false)
  return (
    <>
      <button
        type="button"
        data-no-long-press
        data-no-swipe
        onClick={(e) => {
          e.stopPropagation()
          setOpen(true)
        }}
        aria-label={`Voir la fiche de ${exercise.name}`}
        className={`shrink-0 rounded-full p-2 text-muted active:bg-surface-3 active:text-accent-ink ${className}`}
      >
        <InfoIcon className="h-5 w-5" />
      </button>
      {open && <ExerciseInfoSheet exerciseId={exercise.id!} fallback={exercise} onClose={() => setOpen(false)} />}
    </>
  )
}

const CLOSE_DRAG_PX = 90

interface ExerciseInfoSheetProps {
  exerciseId: number
  /** Shown until the live copy loads. */
  fallback: Exercise
  onClose: () => void
}

/**
 * Bottom sheet with an exercise's muscles, body diagram, instructions, demo
 * images and video link. Closes with the X, a tap outside, Escape, or by
 * dragging the header down. Rendered in a portal so it isn't affected by the
 * transforms/gestures of the card it was opened from.
 */
export function ExerciseInfoSheet({ exerciseId, fallback, onClose }: ExerciseInfoSheetProps) {
  const live = useLiveQuery(() => db.exercises.get(exerciseId), [exerciseId])
  const exercise = live ?? fallback
  const info = getExerciseInfo(exercise)
  const panelRef = useRef<HTMLDivElement>(null)
  const drag = useRef<{ startY: number; dy: number } | null>(null)

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKey)
    // Keep the page behind from scrolling while the sheet is open.
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      window.removeEventListener('keydown', onKey)
      document.body.style.overflow = prev
    }
  }, [onClose])

  function onDragStart(e: ReactPointerEvent<HTMLElement>) {
    drag.current = { startY: e.clientY, dy: 0 }
    try {
      e.currentTarget.setPointerCapture(e.pointerId)
    } catch {
      // synthetic / unsupported: dragging still works through bubbling
    }
    if (panelRef.current) panelRef.current.style.transition = 'none'
  }
  function onDragMove(e: ReactPointerEvent<HTMLElement>) {
    const d = drag.current
    if (!d) return
    d.dy = Math.max(0, e.clientY - d.startY)
    if (panelRef.current) panelRef.current.style.transform = `translate3d(0, ${d.dy}px, 0)`
  }
  function onDragEnd() {
    const d = drag.current
    drag.current = null
    const panel = panelRef.current
    if (!d || !panel) return
    panel.style.transition = 'transform 220ms cubic-bezier(0.22, 1, 0.36, 1)'
    if (d.dy > CLOSE_DRAG_PX) {
      panel.style.transform = 'translate3d(0, 100%, 0)'
      setTimeout(onClose, 180)
    } else {
      panel.style.transform = ''
    }
  }

  const stop = (e: React.SyntheticEvent) => e.stopPropagation()
  const entry = info.entry

  return createPortal(
    <div
      className="fixed inset-0 z-[60] flex items-end justify-center bg-scrim/40 animate-fade-in-backdrop sm:items-center sm:p-4"
      onClick={onClose}
      // Portals bubble through React ancestors: keep the opening card's gestures out of it.
      onPointerDown={stop}
      onPointerMove={stop}
      onPointerUp={stop}
      onContextMenu={(e) => e.preventDefault()}
    >
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-label={`Fiche : ${exercise.name}`}
        className="flex max-h-[92dvh] w-full max-w-md animate-slide-up flex-col rounded-t-2xl bg-surface shadow-lg sm:rounded-2xl"
        onClick={stop}
      >
        <div
          className="shrink-0 cursor-grab touch-none select-none px-5 pb-2 pt-2.5"
          onPointerDown={onDragStart}
          onPointerMove={onDragMove}
          onPointerUp={onDragEnd}
          onPointerCancel={onDragEnd}
        >
          <div className="mx-auto mb-2.5 h-1.5 w-10 rounded-full bg-surface-4" />
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <h2 className="font-exercise !text-lg leading-tight text-ink">{exercise.name}</h2>
              <div className="mt-1.5 flex flex-wrap gap-1.5">
                {info.equipment && <Badge>{EQUIPMENT_LABEL[info.equipment]}</Badge>}
                <Badge>{exercise.muscleGroup}</Badge>
                {!entry && <Badge tone="accent">Perso</Badge>}
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              onPointerDown={stop}
              aria-label="Fermer la fiche"
              className="-mr-2 -mt-1 shrink-0 rounded-full p-2.5 text-muted active:bg-surface-3"
            >
              <XIcon className="h-6 w-6" />
            </button>
          </div>
        </div>

        <div className="space-y-5 overflow-y-auto px-5 pb-8 pt-2" style={{ overscrollBehavior: 'contain' }}>
          <section>
            <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted">Muscles travaillés</h3>
            {info.primary.length + info.secondary.length === 0 ? (
              <p className="text-sm text-muted">Aucun muscle renseigné.</p>
            ) : (
              <div className="space-y-2">
                {info.primary.length > 0 && (
                  <MuscleList label="Principaux" muscles={info.primary} strong />
                )}
                {info.secondary.length > 0 && <MuscleList label="Secondaires" muscles={info.secondary} />}
              </div>
            )}
            <div className="mt-3">
              <BodyDiagram primary={info.primary} secondary={info.secondary} />
            </div>
            {!entry && <MuscleEditor exercise={exercise} />}
          </section>

          {info.steps.length > 0 && (
            <section>
              <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted">Comment faire</h3>
              <ol className="space-y-2.5">
                {info.steps.map((s, i) => (
                  <li key={i} className="flex gap-2.5 text-sm text-ink-2">
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-accent-soft text-xs font-bold text-accent-ink">
                      {i + 1}
                    </span>
                    <span>{s}</span>
                  </li>
                ))}
              </ol>
              {info.tips.length > 0 && (
                <div className="mt-4 rounded-xl bg-highlight-soft px-3.5 py-3">
                  <p className="mb-1 text-xs font-semibold text-highlight-ink">Conseils et erreurs fréquentes</p>
                  <ul className="list-disc space-y-1 pl-4 text-sm text-highlight-ink">
                    {info.tips.map((t, i) => (
                      <li key={i}>{t}</li>
                    ))}
                  </ul>
                </div>
              )}
              {info.equipmentNote && <p className="mt-3 text-xs text-muted">{info.equipmentNote}</p>}
            </section>
          )}

          {entry && <ExerciseImages seedId={entry.seedId} name={exercise.name} />}

          <section>
            <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted">Vidéo</h3>
            <a
              href={demoSearchUrl(exercise.name)}
              target="_blank"
              rel="noopener noreferrer"
              className="flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-accent text-sm font-semibold text-on-accent active:bg-accent-hover"
            >
              <PlayCircleIcon className="h-5 w-5" />
              Voir une démonstration
            </a>
            <p className="mt-1.5 text-center text-[11px] text-muted">
              Ouvre une recherche vidéo « comment faire {exercise.name} » dans un nouvel onglet.
            </p>
          </section>

          <PersonalFields exercise={exercise} />
        </div>
      </div>
    </div>,
    document.body,
  )
}

function Badge({ children, tone = 'neutral' }: { children: React.ReactNode; tone?: 'neutral' | 'accent' }) {
  return (
    <span
      className={`rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${
        tone === 'accent' ? 'bg-accent-soft text-accent-ink' : 'bg-surface-3 text-ink-2'
      }`}
    >
      {children}
    </span>
  )
}

function MuscleList({ label, muscles, strong = false }: { label: string; muscles: MuscleId[]; strong?: boolean }) {
  return (
    <div className="flex flex-wrap items-center gap-1.5">
      <span className="mr-0.5 text-xs font-medium text-muted">{label}</span>
      {muscles.map((m) => (
        <span
          key={m}
          className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
            strong ? 'bg-accent text-on-accent' : 'bg-accent-soft text-accent-ink'
          }`}
        >
          {MUSCLES[m].label}
        </span>
      ))}
    </div>
  )
}

/** For the user's own exercises: the same main / secondary pickers as the edit form, saved on the spot. */
function MuscleEditor({ exercise }: { exercise: Exercise }) {
  const secondary = secondaryGroupsOf(exercise)
  return (
    <div className="mt-4 space-y-3">
      <div>
        <p className="mb-1.5 text-xs font-medium text-muted">Muscle principal</p>
        <PrincipalPicker
          value={exercise.muscleGroup}
          onChange={(g) =>
            // The main muscle can't also be secondary; stale fine-grained muscles no longer apply.
            updateExerciseDetails(exercise.id!, {
              muscleGroup: g,
              secondaryGroups: secondary.filter((x) => x !== g),
              primaryMuscles: undefined,
              secondaryMuscles: undefined,
            })
          }
        />
      </div>
      <div>
        <p className="mb-1.5 text-xs font-medium text-muted">Muscles secondaires (optionnel)</p>
        <SecondaryPicker
          principal={exercise.muscleGroup}
          value={secondary}
          onChange={(groups) =>
            updateExerciseDetails(exercise.id!, { secondaryGroups: groups, primaryMuscles: undefined, secondaryMuscles: undefined })
          }
        />
      </div>
    </div>
  )
}

/** Personal notes and an optional video link, for any exercise. */
function PersonalFields({ exercise }: { exercise: Exercise }) {
  const [notes, setNotes] = useState(exercise.notes ?? '')
  const [video, setVideo] = useState(exercise.videoUrl ?? '')
  const [videoError, setVideoError] = useState(false)
  const timers = useRef<{ notes?: ReturnType<typeof setTimeout>; video?: ReturnType<typeof setTimeout> }>({})
  useEffect(() => {
    const t = timers.current
    return () => {
      clearTimeout(t.notes)
      clearTimeout(t.video)
    }
  }, [])

  function changeNotes(value: string) {
    setNotes(value)
    clearTimeout(timers.current.notes)
    timers.current.notes = setTimeout(
      () => updateExerciseDetails(exercise.id!, { notes: value.trim() ? value : undefined }),
      400,
    )
  }
  function changeVideo(value: string) {
    setVideo(value)
    clearTimeout(timers.current.video)
    timers.current.video = setTimeout(() => {
      if (!value.trim()) {
        setVideoError(false)
        updateExerciseDetails(exercise.id!, { videoUrl: undefined })
        return
      }
      const url = normalizeVideoUrl(value)
      setVideoError(url == null)
      if (url) updateExerciseDetails(exercise.id!, { videoUrl: url })
    }, 500)
  }

  const savedVideo = exercise.videoUrl

  return (
    <section>
      <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted">Mes notes et ma vidéo</h3>
      <textarea
        value={notes}
        onChange={(e) => changeNotes(e.target.value)}
        rows={3}
        placeholder="Réglages de la machine, sensations, astuces…"
        className="w-full resize-none rounded-xl border border-line bg-surface-2 px-3 py-2.5 text-sm outline-none focus:border-accent-line"
      />
      <label className="mt-3 block">
        <span className="mb-1 block text-xs font-medium text-muted">Lien vidéo (optionnel)</span>
        <input
          value={video}
          onChange={(e) => changeVideo(e.target.value)}
          inputMode="url"
          autoCapitalize="off"
          autoCorrect="off"
          placeholder="https://youtube.com/…"
          aria-invalid={videoError || undefined}
          className={`h-12 w-full rounded-xl border bg-surface-2 px-3 text-sm outline-none focus:border-accent-line ${
            videoError ? 'border-danger' : 'border-line'
          }`}
        />
      </label>
      {videoError && <p className="mt-1 text-xs font-medium text-danger-ink">Ce lien n’est pas valide.</p>}
      {savedVideo && !videoError && (
        <a
          href={savedVideo}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-2 flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-surface-3 text-sm font-semibold text-ink-2 active:bg-surface-4"
        >
          <PlayCircleIcon className="h-5 w-5" />
          Ouvrir ma vidéo
        </a>
      )}
    </section>
  )
}
