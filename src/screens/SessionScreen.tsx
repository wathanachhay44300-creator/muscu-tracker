import { useEffect, useState } from 'react'
import { Navigate, useNavigate, useParams } from 'react-router-dom'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '../db'
import { useActiveSession } from '../hooks/useActiveSession'
import { useWorkoutDetail } from '../hooks/useWorkout'
import { useElapsedTime } from '../hooks/useElapsedTime'
import { useRestTimer } from '../hooks/useRestTimer'
import { usePreferences } from '../hooks/usePreferences'
import { useSnackbar } from '../contexts/SnackbarContext'
import { getSlideClass, type SwipeDirection } from '../hooks/useSwipeNav'
import { hapticSuccess } from '../lib/haptics'
import { addExerciseToWorkout, deleteWorkoutWithUndo, finishWorkout, restoreWorkoutSnapshot } from '../lib/workoutActions'
import { relativeDateLabel, todayISO } from '../lib/date'
import { dismissDragHint, takeDragHint } from '../lib/dragHint'
import { ExercisePickerSheet } from '../components/ExercisePickerSheet'
import { ConfirmDialog } from '../components/ConfirmDialog'
import { SessionExercisePanel } from '../components/session/SessionExercisePanel'
import { SessionOverviewSheet } from '../components/session/SessionOverviewSheet'
import { SessionRestTimer } from '../components/session/SessionRestTimer'
import { ChevronLeftIcon, ChevronRightIcon, PlusIcon } from '../components/Icons'
import type { Exercise } from '../types'

const REST_KEY = 'muscu-tracker:restSec'
const DEFAULT_REST = 90

function readRest(): number {
  try {
    const n = Number(localStorage.getItem(REST_KEY))
    return n > 0 ? n : DEFAULT_REST
  } catch {
    return DEFAULT_REST
  }
}

function currentKey(workoutId: number): string {
  return `muscu-tracker:session-current:${workoutId}`
}

function formatChrono(ms: number): string {
  const s = Math.floor(ms / 1000)
  const h = Math.floor(s / 3600)
  const m = Math.floor((s % 3600) / 60)
  const sec = String(s % 60).padStart(2, '0')
  return h > 0 ? `${h}:${String(m).padStart(2, '0')}:${sec}` : `${m}:${sec}`
}

/**
 * Session mode: full screen, no tab bar, one exercise at a time with
 * previous/next buttons and the rest timer docked above them. `/seance`
 * resumes today's session; `/seance/:workoutId` opens a given one (e.g. a
 * past day added from the calendar).
 */
export function SessionScreen() {
  const { workoutId: param } = useParams()
  const active = useActiveSession()
  // Latched: once "Terminer" finishes today's session it is no longer
  // "active", but we stay on it until the navigation to the summary happens.
  const [latched, setLatched] = useState<number | undefined>(undefined)
  const activeId = active?.workout.id
  useEffect(() => {
    if (activeId != null) setLatched(activeId)
  }, [activeId])
  const workoutId = param ? Number(param) : (activeId ?? latched)

  if (!param && active === null && latched == null) return <Navigate to="/" replace />
  if (workoutId == null) return null
  return <SessionView key={workoutId} workoutId={workoutId} />
}

function SessionView({ workoutId }: { workoutId: number }) {
  const navigate = useNavigate()
  const detail = useWorkoutDetail(workoutId)
  const exists = useLiveQuery(async () => !!(await db.workouts.get(workoutId)), [workoutId])
  const template = useLiveQuery(
    () => (detail?.workout.templateId ? db.workoutTemplates.get(detail.workout.templateId) : undefined),
    [detail?.workout.templateId],
  )
  const preferences = usePreferences()
  const { showSnackbar } = useSnackbar()
  const timer = useRestTimer()
  const [restSec, setRestSec] = useState(readRest)
  const [currentId, setCurrentId] = useState<number | null>(() => {
    try {
      const v = Number(sessionStorage.getItem(currentKey(workoutId)))
      return v > 0 ? v : null
    } catch {
      return null
    }
  })
  const [enterDir, setEnterDir] = useState<SwipeDirection>(null)
  const [overviewOpen, setOverviewOpen] = useState(false)
  const [pickerOpen, setPickerOpen] = useState(false)
  const [confirmEmpty, setConfirmEmpty] = useState(false)
  const [showHint, setShowHint] = useState(takeDragHint)
  const reducedMotion = typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches

  const exercises = detail?.exercises ?? []
  const startedAt = (() => {
    const times = exercises.flatMap((we) => we.sets.map((s) => s.createdAt))
    return times.length ? Math.min(...times) : (detail?.workout.createdAt ?? null)
  })()
  const elapsed = useElapsedTime(startedAt, 1000)

  // Default to the first exercise that still has sets to do.
  const fallbackIndex = Math.max(0, exercises.findIndex((we) => we.sets.length === 0 || we.sets.some((s) => !s.done)))
  const index = (() => {
    const i = exercises.findIndex((we) => we.id === currentId)
    return i >= 0 ? i : Math.min(fallbackIndex, Math.max(0, exercises.length - 1))
  })()
  const current = exercises[index]

  useEffect(() => {
    try {
      if (current?.id) sessionStorage.setItem(currentKey(workoutId), String(current.id))
    } catch {
      // ignore
    }
  }, [current?.id, workoutId])

  if (exists === false) return <Navigate to="/" replace />
  if (!detail) return null
  const { workout } = detail
  const title = workout.title ?? template?.name ?? 'Séance libre'
  const setCount = exercises.reduce((n, we) => n + we.sets.length, 0)
  const isToday = workout.date === todayISO()

  function go(delta: 1 | -1) {
    const next = exercises[index + delta]
    if (!next) return
    setEnterDir(delta > 0 ? 'left' : 'right')
    setCurrentId(next.id!)
    window.scrollTo({ top: 0 })
  }

  function jump(id: number) {
    const target = exercises.findIndex((we) => we.id === id)
    setEnterDir(target >= index ? 'left' : 'right')
    setCurrentId(id)
    setOverviewOpen(false)
    window.scrollTo({ top: 0 })
  }

  async function handleSelectExercise(exercise: Exercise) {
    const linkId = await addExerciseToWorkout(workoutId, exercise.id!)
    setPickerOpen(false)
    setOverviewOpen(false)
    setEnterDir('left')
    setCurrentId(linkId)
  }

  function startRest() {
    timer.start(restSec * 1000)
  }

  function changeRest(sec: number) {
    setRestSec(sec)
    try {
      localStorage.setItem(REST_KEY, String(sec))
    } catch {
      // ignore
    }
  }

  async function handleFinish() {
    if (setCount === 0) {
      setConfirmEmpty(true)
      return
    }
    if (!workout.finishedAt) await finishWorkout(workoutId)
    timer.reset()
    hapticSuccess(!!preferences?.hapticsEnabled)
    navigate(`/bilan/${workoutId}`, { replace: true })
  }

  async function abandonEmpty() {
    setConfirmEmpty(false)
    const snapshot = await deleteWorkoutWithUndo(workoutId)
    navigate('/', { replace: true })
    showSnackbar('Séance vide abandonnée', () => restoreWorkoutSnapshot(snapshot))
  }

  const isLast = index >= exercises.length - 1

  return (
    <div className="mx-auto max-w-md px-4 pb-64 animate-fade-in">
      {/* Top bar */}
      <div className="sticky top-0 z-20 -mx-4 bg-page/95 px-4 pt-safe backdrop-blur">
        <div className="flex items-center gap-2 py-2">
          <button
            type="button"
            onClick={() => navigate('/')}
            aria-label="Quitter le mode séance (la séance continue)"
            className="-ml-2 flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-muted active:bg-surface-3"
          >
            <ChevronLeftIcon className="h-6 w-6" />
          </button>
          <div className="min-w-0 flex-1">
            <p className="truncate text-xs font-bold uppercase tracking-wide text-muted">{title}</p>
            {!isToday && <p className="truncate text-[11px] text-faint">{relativeDateLabel(workout.date)}</p>}
          </div>
          <span className="flex h-9 shrink-0 items-center gap-1.5 rounded-full bg-surface-3 px-3">
            <span className="h-2 w-2 rounded-full bg-accent" aria-hidden="true" />
            <span className="font-numbers text-base font-bold text-ink">{formatChrono(elapsed)}</span>
          </span>
          <button
            type="button"
            onClick={handleFinish}
            className="flex min-h-11 shrink-0 items-center rounded-xl border-2 border-accent px-3.5 text-sm font-bold text-accent-ink active:bg-accent-soft"
          >
            Terminer
          </button>
        </div>

        {exercises.length > 0 && (
          <div className="flex gap-1 pb-2.5" aria-hidden="true">
            {exercises.map((we, i) => {
              const complete = we.sets.length > 0 && we.sets.every((s) => s.done)
              return (
                <span
                  key={we.id}
                  className={`h-1.5 flex-1 rounded-full ${
                    i === index ? 'bg-accent/45' : complete ? 'bg-accent' : 'bg-surface-4'
                  }`}
                />
              )
            })}
          </div>
        )}
      </div>

      <div className="pt-2">
        {current ? (
          <div key={current.id} className={getSlideClass(enterDir, reducedMotion)}>
            <SessionExercisePanel
              we={current}
              workoutId={workoutId}
              position={index + 1}
              total={exercises.length}
              onOpenOverview={() => setOverviewOpen(true)}
              onRemoved={() => {
                const neighbor = exercises[index + 1] ?? exercises[index - 1]
                setCurrentId(neighbor?.id ?? null)
              }}
              onSetDone={startRest}
              showHint={showHint}
              onDismissHint={() => {
                dismissDragHint()
                setShowHint(false)
              }}
            />
          </div>
        ) : (
          <div className="mt-8 rounded-3xl border-2 border-dashed border-line-strong px-5 py-12 text-center">
            <p className="font-display text-ink">Séance vide</p>
            <p className="mt-1 text-sm text-muted">Ajoute ton premier exercice pour commencer.</p>
            <button
              type="button"
              onClick={() => setPickerOpen(true)}
              className="mx-auto mt-5 flex min-h-12 items-center gap-2 rounded-2xl bg-accent px-6 font-bold text-on-accent active:bg-accent-hover"
            >
              <PlusIcon className="h-5 w-5" />
              Ajouter un exercice
            </button>
          </div>
        )}
      </div>

      {/* Bottom: rest timer + previous / next */}
      <div className="fixed inset-x-0 bottom-0 z-30 border-t border-line bg-nav/95 pb-safe backdrop-blur">
        <div className="mx-auto max-w-md px-4">
          <SessionRestTimer timer={timer} restSec={restSec} onChangeRest={changeRest} />
          <div className="flex gap-2 pb-1 pt-1">
            <button
              type="button"
              onClick={() => go(-1)}
              disabled={index <= 0}
              className="flex min-h-14 flex-1 items-center justify-center gap-1 rounded-2xl bg-surface-3 text-sm font-bold text-ink-2 active:bg-surface-4 disabled:opacity-40"
            >
              <ChevronLeftIcon className="h-5 w-5" />
              Exercice préc.
            </button>
            {isLast ? (
              <button
                type="button"
                onClick={() => setPickerOpen(true)}
                className="flex min-h-14 flex-1 items-center justify-center gap-1.5 rounded-2xl bg-accent text-sm font-bold text-on-accent active:bg-accent-hover"
              >
                <PlusIcon className="h-5 w-5" />
                Ajouter un exercice
              </button>
            ) : (
              <button
                type="button"
                onClick={() => go(1)}
                className="flex min-h-14 flex-1 items-center justify-center gap-1 rounded-2xl bg-accent text-sm font-bold text-on-accent active:bg-accent-hover"
              >
                Exercice suivant
                <ChevronRightIcon className="h-5 w-5" />
              </button>
            )}
          </div>
        </div>
      </div>

      {overviewOpen && (
        <SessionOverviewSheet
          detail={detail}
          currentId={current?.id ?? null}
          onJump={jump}
          onAddExercise={() => {
            setOverviewOpen(false)
            setPickerOpen(true)
          }}
          onClose={() => setOverviewOpen(false)}
        />
      )}
      {pickerOpen && (
        <ExercisePickerSheet
          excludeIds={exercises.map((e) => e.exerciseId)}
          onSelect={handleSelectExercise}
          onClose={() => setPickerOpen(false)}
        />
      )}
      {confirmEmpty && (
        <ConfirmDialog
          title="Abandonner cette séance ?"
          message="Aucune série n'a été enregistrée. La séance vide sera supprimée (tu pourras annuler juste après)."
          confirmLabel="Abandonner"
          danger
          onConfirm={abandonEmpty}
          onCancel={() => setConfirmEmpty(false)}
        />
      )}
    </div>
  )
}
