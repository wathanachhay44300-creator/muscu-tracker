import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { db } from '../db'
import { WorkoutEditor } from '../components/WorkoutEditor'
import { DuplicateSessionSheet } from '../components/DuplicateSessionSheet'
import { AngkorSilhouette } from '../components/AngkorSilhouette'
import { PullToRefreshIndicator } from '../components/PullToRefreshIndicator'
import { StartSessionPicker } from '../components/StartSessionPicker'
import { ChevronLeftIcon, ChevronRightIcon } from '../components/Icons'
import { useWorkoutIdForDate } from '../hooks/useWorkout'
import { useTemplates } from '../hooks/useTemplates'
import { useSwipeNav, getSlideClass, type SwipeDirection } from '../hooks/useSwipeNav'
import { usePullToRefresh } from '../hooks/usePullToRefresh'
import { getOrCreateWorkout } from '../lib/workoutActions'
import { startWorkoutFromPreviousSession, startWorkoutFromTemplate } from '../lib/sessionStart'
import { addDays, formatDateShort, relativeDateLabel, todayISO } from '../lib/date'
import { t } from '../i18n'

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
      className="mx-auto max-w-md px-4 pt-safe pb-28 pt-4 animate-fade-in"
      onPointerDown={pullToRefresh.handlers.onPointerDown}
      onPointerMove={pullToRefresh.handlers.onPointerMove}
      onPointerUp={pullToRefresh.handlers.onPointerUp}
      onPointerCancel={pullToRefresh.handlers.onPointerCancel}
    >
      <PullToRefreshIndicator indicatorRef={pullToRefresh.indicatorRef} refreshing={pullToRefresh.refreshing} />
      <div className="relative isolate">
        <AngkorSilhouette className="inset-x-0 bottom-0 h-20 w-full" />
        <div className="mb-3 flex items-center justify-between pt-2">
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
      </div>

      <div ref={swipe.ref} {...swipe.handlers} className="touch-pan-y">
        <div key={date} className={getSlideClass(enterDir, swipe.reducedMotion)}>
          {workoutId ? (
            <WorkoutEditor workoutId={workoutId} />
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
