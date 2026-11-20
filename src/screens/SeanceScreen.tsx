import { useState } from "react";
import { WorkoutEditor } from "../components/WorkoutEditor";
import { Link } from "react-router-dom";
import { DuplicateSessionSheet } from "../components/DuplicateSessionSheet";
import { AngkorSilhouette } from "../components/AngkorSilhouette";
import { PullToRefreshIndicator } from "../components/PullToRefreshIndicator";
import { ChevronLeftIcon, ChevronRightIcon, SettingsIcon } from "../components/Icons";
import { useWorkoutIdForDate } from "../hooks/useWorkout";
import { useTemplates } from "../hooks/useTemplates";
import {
  useSwipeNav,
  getSlideClass,
  type SwipeDirection,
} from "../hooks/useSwipeNav";
import { usePullToRefresh } from "../hooks/usePullToRefresh";
import { getOrCreateWorkout } from "../lib/workoutActions";
import {
  startWorkoutFromPreviousSession,
  startWorkoutFromTemplate,
} from "../lib/sessionStart";
import {
  addDays,
  formatDateFr,
  relativeDateLabel,
  todayISO,
} from "../lib/date";
import { StartSessionPicker } from "../components/StartSessionPicker";

export function SeanceScreen() {
  const [date, setDate] = useState(todayISO());
  const [enterDir, setEnterDir] = useState<SwipeDirection>(null);
  const workoutId = useWorkoutIdForDate(date);
  const templates = useTemplates();
  const [starting, setStarting] = useState(false);
  const [duplicating, setDuplicating] = useState(false);
  const pullToRefresh = usePullToRefresh();

  function changeDate(newDate: string, dir: SwipeDirection) {
    setEnterDir(dir);
    setDate(newDate);
  }

  const swipe = useSwipeNav({
    onSwipeLeft: () => changeDate(addDays(date, 1), "left"),
    onSwipeRight: () => changeDate(addDays(date, -1), "right"),
  });

  async function handleStart() {
    setStarting(true);
    await getOrCreateWorkout(date);
    setStarting(false);
  }

  async function handleStartFromTemplate(templateId: number) {
    setStarting(true);
    await startWorkoutFromTemplate(date, templateId);
    setStarting(false);
  }

  async function handleDuplicatePrevious(sourceWorkoutId: number) {
    setDuplicating(false);
    setStarting(true);
    await startWorkoutFromPreviousSession(date, sourceWorkoutId);
    setStarting(false);
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
        <AngkorSilhouette className="inset-x-0 bottom-0 h-24 w-full" />
        <div className="mb-2 flex justify-end">
          <Link
            to="/reglages"
            aria-label="Réglages"
            className="flex h-11 w-11 items-center justify-center rounded-full bg-surface-3 text-muted active:bg-surface-4"
          >
            <SettingsIcon className="h-5 w-5" />
          </Link>
        </div>
        <div className="mb-5 flex items-center justify-between">
          <button
            type="button"
            onClick={() => changeDate(addDays(date, -1), "right")}
            className="rounded-full p-2 text-muted active:bg-surface-3"
            aria-label="Jour précédent"
          >
            <ChevronLeftIcon className="h-5 w-5" />
          </button>

          <div className="text-center">
            <h1 className="text-lg font-bold text-ink">
              {relativeDateLabel(date)}
            </h1>
            {relativeDateLabel(date) !== formatDateFr(date) && (
              <p className="text-xs text-muted">{formatDateFr(date)}</p>
            )}
          </div>

          <button
            type="button"
            onClick={() => changeDate(addDays(date, 1), "left")}
            className="rounded-full p-2 text-muted active:bg-surface-3"
            aria-label="Jour suivant"
          >
            <ChevronRightIcon className="h-5 w-5" />
          </button>
        </div>
      </div>

      <div ref={swipe.ref} {...swipe.handlers} className="touch-pan-y">
        <div
          key={date}
          className={getSlideClass(enterDir, swipe.reducedMotion)}
        >
          {workoutId ? (
            <WorkoutEditor workoutId={workoutId} />
          ) : (
            <StartSessionPicker
              templates={templates}
              starting={starting}
              onStartFromTemplate={handleStartFromTemplate}
              onStartFree={handleStart}
              onDuplicatePrevious={() => setDuplicating(true)}
            />
          )}
        </div>
      </div>

      {duplicating && (
        <DuplicateSessionSheet
          onSelect={handleDuplicatePrevious}
          onClose={() => setDuplicating(false)}
        />
      )}
    </div>
  );
}
