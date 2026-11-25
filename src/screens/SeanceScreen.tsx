import { useCallback, useEffect, useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { db } from '../db'
import { WorkoutEditor } from '../components/WorkoutEditor'
import { DuplicateSessionSheet } from '../components/DuplicateSessionSheet'
import { AngkorSilhouette } from '../components/AngkorSilhouette'
import { PullToRefreshIndicator } from '../components/PullToRefreshIndicator'
import { StartSessionPicker } from '../components/StartSessionPicker'
import { SessionTimer } from '../components/SessionTimer'
import { SessionRestTimer } from '../components/session/SessionRestTimer'
import { RingOnly, RopeBand } from '../components/ring/Ring'
import { ChevronLeftIcon, ChevronRightIcon } from '../components/Icons'
import { useWorkoutDetail, useWorkoutIdForDate } from '../hooks/useWorkout'
import { useRestTimer } from '../hooks/useRestTimer'
import { usePreferences } from '../hooks/usePreferences'
import { useTemplates } from '../hooks/useTemplates'
import { useSwipeNav, getSlideClass, type SwipeDirection } from '../hooks/useSwipeNav'
import { usePullToRefresh } from '../hooks/usePullToRefresh'
import { finishWorkout, getOrCreateWorkout } from '../lib/workoutActions'
import { hapticSuccess } from '../lib/haptics'
import { formatVolume, totalVolume } from '../lib/stats'
import { startWorkoutFromPreviousSession, startWorkoutFromTemplate } from '../lib/sessionStart'
import { addDays, formatDateShort, relativeDateLabel, todayISO } from '../lib/date'
import { t, tn } from '../i18n'

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

/**
 * Session screen: one day at a time (‹ › or a sideways swipe on the page to
 * change day), every exercise of that day's session on one page. A day
 * without a session shows the start picker. `/seance/:workoutId` opens the
 * day of that session.
 */
export function SeanceScreen() {
  const { workoutId: workoutIdParam } = useParams()
  const [date, setDate] = useState(todayISO())
  const [enterDir, setEnterDir] = useState<SwipeDirection>(null)
  const workoutId = useWorkoutIdForDate(date)
  const templates = useTemplates()
  const [starting, setStarting] = useState(false)
  const [duplicating, setDuplicating] = useState(false)
  const pullToRefresh = usePullToRefresh()
  const navigate = useNavigate()
  const preferences = usePreferences()
  const detail = useWorkoutDetail(workoutId)
  const timer = useRestTimer()
  const [restSec, setRestSec] = useState(readRest)

  // Rest timer bar height, so the page can scroll its last content clear of it.
  const barRef = useRef<HTMLDivElement>(null)
  const [barHeight, setBarHeight] = useState(64)
  // The tab bar's real height (safe area included): the rest timer docks right on top of it.
  const [navHeight, setNavHeight] = useState(57)
  useEffect(() => {
    const el = barRef.current
    const nav = document.querySelector<HTMLElement>('nav[data-tab-bar]')
    const ro = new ResizeObserver(() => {
      if (el) setBarHeight(Math.round(el.getBoundingClientRect().height))
      if (nav) setNavHeight(Math.round(nav.getBoundingClientRect().height))
    })
    if (el) ro.observe(el)
    if (nav) ro.observe(nav)
    return () => ro.disconnect()
  }, [])

  const workout = detail?.workout
  // Chrono, summary and "Terminer" in the header: only for today's session in progress.
  const inProgress = !!workout && !workout.finishedAt && workout.date === todayISO()
  const exercises = detail?.exercises ?? []
  const setCount = exercises.reduce((n, we) => n + we.sets.length, 0)
  const volume = totalVolume(exercises.flatMap((we) => we.sets))
  const startedAt = workout ? Math.min(workout.createdAt, ...exercises.flatMap((we) => we.sets.map((s) => s.createdAt))) : 0

  // Adding a set starts the rest with the last chosen duration (stable callback: cards are memoized).
  const restRef = useRef({ restSec, start: timer.start, inProgress })
  useEffect(() => {
    restRef.current = { restSec, start: timer.start, inProgress }
  })
  const handleSetAdded = useCallback(() => {
    const { restSec, start, inProgress } = restRef.current
    if (inProgress) start(restSec * 1000)
  }, [])

  function changeRest(sec: number) {
    setRestSec(sec)
    try {
      localStorage.setItem(REST_KEY, String(sec))
    } catch {
      // ignore
    }
  }

  async function handleFinish() {
    if (!workout?.id) return
    if (!workout.finishedAt) await finishWorkout(workout.id)
    timer.reset()
    hapticSuccess(!!preferences?.hapticsEnabled)
    navigate(`/bilan/${workout.id}`)
  }

  // Opened from the calendar / a link to one session: show its day.
  useEffect(() => {
    const id = Number(workoutIdParam)
    if (!id) return
    let cancelled = false
    db.workouts.get(id).then((w) => {
      if (w && !cancelled) setDate(w.date)
    })
    return () => {
      cancelled = true
    }
  }, [workoutIdParam])

  function changeDate(newDate: string, dir: SwipeDirection) {
    setEnterDir(dir)
    setDate(newDate)
  }

  const swipe = useSwipeNav({
    onSwipeLeft: () => changeDate(addDays(date, 1), 'left'),
    onSwipeRight: () => changeDate(addDays(date, -1), 'right'),
  })

  async function start(run: () => Promise<unknown>) {
    setStarting(true)
    try {
      await run()
    } finally {
      setStarting(false)
    }
  }

  return (
    <div
      className="mx-auto max-w-md px-4 animate-fade-in"
      // Room for the docked rest timer + the tab bar under the last exercise.
      style={{ paddingBottom: barHeight + navHeight + 24 }}
      onPointerDown={pullToRefresh.handlers.onPointerDown}
      onPointerMove={pullToRefresh.handlers.onPointerMove}
      onPointerUp={pullToRefresh.handlers.onPointerUp}
      onPointerCancel={pullToRefresh.handlers.onPointerCancel}
    >
      <PullToRefreshIndicator indicatorRef={pullToRefresh.indicatorRef} refreshing={pullToRefresh.refreshing} />
      {/* Sticky header: day, then chrono · summary · Terminer for a session in progress */}
      <div className="sticky top-0 isolate z-20 -mx-4 bg-page/95 px-4 pt-safe backdrop-blur">
        <AngkorSilhouette className="inset-x-0 bottom-0 h-20 w-full" />
        <div className="flex items-center justify-between pb-2 pt-3">
          <button
            type="button"
            onClick={() => changeDate(addDays(date, -1), 'right')}
            className="flex h-11 w-11 items-center justify-center rounded-full text-muted active:bg-surface-3"
            aria-label={t('common.previousDay')}
          >
            <ChevronLeftIcon className="h-5 w-5" />
          </button>

          <div className="text-center">
            <h1 className="!text-[1.6rem] leading-none text-ink">{relativeDateLabel(date)}</h1>
            {relativeDateLabel(date) !== formatDateShort(date) && (
              <p className="mt-1 text-xs text-muted">{formatDateShort(date)}</p>
            )}
          </div>

          <button
            type="button"
            onClick={() => changeDate(addDays(date, 1), 'left')}
            className="flex h-11 w-11 items-center justify-center rounded-full text-muted active:bg-surface-3"
            aria-label={t('common.nextDay')}
          >
            <ChevronRightIcon className="h-5 w-5" />
          </button>
        </div>
        {inProgress && (
          <div className="flex items-center gap-2 pb-2.5">
            <SessionTimer startedAt={startedAt} label={t('editor.chrono')} />
            <p className="min-w-0 flex-1 truncate text-xs font-medium text-muted">
              {tn('common.exercises', exercises.length)} · {tn('common.sets', setCount)}
              {volume > 0 && ` · ${formatVolume(volume)} kg`}
            </p>
            <button
              type="button"
              onClick={handleFinish}
              className="flex min-h-10 shrink-0 items-center rounded-xl border-2 border-accent px-3.5 text-sm font-bold text-accent-ink active:bg-accent-soft"
            >
              {t('session.finish')}
            </button>
          </div>
        )}
      </div>

      <div ref={swipe.ref} {...swipe.handlers} className="touch-pan-y">
        <div key={date} className={getSlideClass(enterDir, swipe.reducedMotion)}>
          {workoutId ? (
            <WorkoutEditor workoutId={workoutId} hideSummary={inProgress} onSetAdded={handleSetAdded} />
          ) : (
            <StartSessionPicker
              templates={templates}
              starting={starting}
              onStartFromTemplate={(templateId) => start(() => startWorkoutFromTemplate(date, templateId))}
              onStartFree={() => start(() => getOrCreateWorkout(date))}
              onDuplicatePrevious={() => setDuplicating(true)}
            />
          )}
        </div>
      </div>

      {/* Rest timer docked just above the tab bar */}
      <div
        ref={barRef}
        className="fixed inset-x-0 z-30 border-t border-line bg-nav/95 backdrop-blur"
        style={{ bottom: navHeight }}
      >
        <RingOnly>
          <RopeBand thin className="opacity-85" />
        </RingOnly>
        <div className="mx-auto max-w-md px-4">
          <SessionRestTimer timer={timer} restSec={restSec} onChangeRest={changeRest} />
        </div>
      </div>

      {duplicating && (
        <DuplicateSessionSheet
          onSelect={(id) => {
            setDuplicating(false)
            start(() => startWorkoutFromPreviousSession(date, id))
          }}
          onClose={() => setDuplicating(false)}
        />
      )}
    </div>
  )
}
