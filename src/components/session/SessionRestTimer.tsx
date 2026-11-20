import type { useRestTimer } from '../../hooks/useRestTimer'
import { PauseIcon, PlayIcon, XIcon } from '../Icons'
import { t } from '../../i18n'

type RestTimer = ReturnType<typeof useRestTimer>

const PRESETS = [60, 90, 120, 180]

function formatCountdown(ms: number): string {
  const totalSec = Math.ceil(ms / 1000)
  return `${Math.floor(totalSec / 60)}:${String(totalSec % 60).padStart(2, '0')}`
}

function presetLabel(sec: number): string {
  return sec % 60 === 0 ? `${sec / 60} min` : `${Math.floor(sec / 60)}:${String(sec % 60).padStart(2, '0')}`
}

/**
 * Rest timer docked above the tab bar on the session screen (same timer as
 * the floating one elsewhere: it keeps running across screens and
 * backgrounding). Starts on its own when a set is added, with the last
 * chosen duration; the duration buttons start it by hand.
 */
export function SessionRestTimer({
  timer,
  restSec,
  onChangeRest,
}: {
  timer: RestTimer
  restSec: number
  onChangeRest: (sec: number) => void
}) {
  const active = timer.hasTimer && !timer.isDone
  const progress = timer.totalMs > 0 ? 1 - timer.remainingMs / timer.totalMs : 0

  if (!active) {
    return (
      <div className="flex items-center gap-1.5 py-2">
        <span className={`mr-1 text-xs font-semibold uppercase tracking-wide ${timer.isDone ? 'text-good-ink' : 'text-muted'}`}>
          {timer.isDone ? t('session.restDone') : t('session.rest')}
        </span>
        {PRESETS.map((sec) => (
          <button
            key={sec}
            type="button"
            onClick={() => {
              onChangeRest(sec)
              timer.start(sec * 1000)
            }}
            aria-label={t('session.startRest', { d: presetLabel(sec) })}
            className={`min-h-11 flex-1 rounded-xl text-sm font-semibold ${
              sec === restSec ? 'bg-accent-soft text-accent-ink ring-1 ring-accent-line' : 'bg-surface-3 text-ink-2 active:bg-surface-4'
            }`}
          >
            {presetLabel(sec)}
          </button>
        ))}
      </div>
    )
  }

  return (
    <div className="py-2">
      <div className="flex items-center gap-2">
        <p
          className={`font-numbers min-w-[5.5rem] text-[2.4rem] font-bold leading-none ${timer.isPaused ? 'text-muted' : 'text-ink'}`}
          aria-live="off"
        >
          {formatCountdown(timer.remainingMs)}
        </p>
        <div className="ml-auto flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => timer.addSeconds(15)}
            className="min-h-11 rounded-xl bg-surface-3 px-3.5 text-sm font-bold text-ink active:bg-surface-4"
          >
            +15 s
          </button>
          <button
            type="button"
            onClick={() => (timer.isRunning ? timer.pause() : timer.resume())}
            aria-label={timer.isRunning ? t('session.pauseRest') : t('session.resumeRest')}
            className="flex h-11 w-11 items-center justify-center rounded-xl bg-surface-3 text-ink active:bg-surface-4"
          >
            {timer.isRunning ? <PauseIcon className="h-4 w-4" /> : <PlayIcon className="h-4 w-4" />}
          </button>
          <button
            type="button"
            onClick={timer.reset}
            aria-label={t('session.stopRest')}
            className="flex h-11 w-11 items-center justify-center rounded-xl bg-surface-3 text-muted active:bg-surface-4"
          >
            <XIcon className="h-4 w-4" />
          </button>
        </div>
      </div>
      <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-surface-3" role="progressbar" aria-label={t('session.rest')} aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(progress * 100)}>
        <div className="h-full rounded-full bg-accent" style={{ width: `${Math.min(100, progress * 100)}%`, transition: 'width 250ms linear' }} />
      </div>
    </div>
  )
}
