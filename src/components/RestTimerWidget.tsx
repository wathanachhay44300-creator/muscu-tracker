import { useState } from 'react'
import { useLocation } from 'react-router-dom'
import { useRestTimer } from '../hooks/useRestTimer'
import { PauseIcon, PlayIcon, RefreshIcon, TimerIcon, XIcon } from './Icons'
import { t } from '../i18n'

const PRESETS = [
  { sec: 30, label: '30s' },
  { sec: 60, label: '60s' },
  { sec: 90, label: '90s' },
  { sec: 120, label: '2 min' },
  { sec: 180, label: '3 min' },
]

function formatCountdown(ms: number): string {
  const totalSec = Math.ceil(ms / 1000)
  return `${Math.floor(totalSec / 60)}:${String(totalSec % 60).padStart(2, '0')}`
}

/**
 * Floating rest timer, mounted once at the app root so it stays on screen
 * across every screen while a timer is running. The wrapper ignores pointer
 * events; only the pill / card themselves are interactive, so the content
 * underneath stays fully usable. Tap the pill to expand (±15s, pause,
 * reset, presets) or collapse. With no timer it only offers itself on the
 * session screens, where starting a rest makes sense.
 */
export function RestTimerWidget() {
  const timer = useRestTimer()
  const [expanded, setExpanded] = useState(false)
  const { pathname } = useLocation()
  // The session screen docks its own timer; a past session being edited can start one here.
  const onSessionScreen = /^\/historique\/\d+$/.test(pathname)
  if (pathname.startsWith('/seance')) return null

  if (!timer.hasTimer && !onSessionScreen) return null

  const tone = timer.isDone
    ? 'bg-good text-on-good animate-pop-in'
    : timer.isRunning
      ? 'bg-accent text-on-accent'
      : timer.isPaused
        ? 'bg-highlight text-on-highlight'
        : 'bg-surface text-ink-2 border border-line'
  const showPresets = !timer.hasTimer || timer.isDone

  return (
    <div className="pointer-events-none fixed bottom-24 right-4 z-40 flex flex-col items-end gap-2">
      {expanded && (
        <div className="animate-slide-up pointer-events-auto w-64 rounded-2xl border border-line bg-surface p-3 shadow-lg">
          <div className="mb-2 flex items-center justify-between">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted">{t('rest.timer')}</p>
            <button
              type="button"
              onClick={() => setExpanded(false)}
              className="rounded-full p-1 text-muted active:bg-surface-3"
              aria-label={t('rest.collapse')}
            >
              <XIcon className="h-4 w-4" />
            </button>
          </div>
          <p
            className={`mb-3 text-center text-4xl font-bold font-numbers tabular-nums ${
              timer.isDone ? 'text-good-ink' : 'text-timer-ink'
            }`}
          >
            {formatCountdown(timer.remainingMs)}
          </p>
          {timer.isDone && <p className="mb-2 text-center text-sm font-semibold text-good-ink">{t('rest.done')}</p>}
          {timer.isPaused && <p className="mb-2 text-center text-sm font-medium text-highlight-ink">{t('rest.paused')}</p>}

          {showPresets ? (
            <div className="grid grid-cols-3 gap-1.5">
              {PRESETS.map((p) => (
                <button
                  key={p.sec}
                  type="button"
                  onClick={() => timer.start(p.sec * 1000)}
                  className="rounded-xl bg-accent py-2.5 text-sm font-semibold text-on-accent active:bg-accent-hover"
                >
                  {p.label}
                </button>
              ))}
            </div>
          ) : (
            <div className="flex gap-1.5">
              <button
                type="button"
                onClick={() => timer.addSeconds(-15)}
                className="rounded-xl bg-surface-3 px-3 py-2.5 text-sm font-semibold text-ink-2 active:bg-surface-4"
              >
                −15s
              </button>
              <button
                type="button"
                onClick={() => (timer.isRunning ? timer.pause() : timer.resume())}
                className="flex flex-1 items-center justify-center rounded-xl bg-accent py-2.5 text-on-accent active:bg-accent-hover"
                aria-label={timer.isRunning ? t('rest.pause') : t('rest.resume')}
              >
                {timer.isRunning ? <PauseIcon className="h-4 w-4" /> : <PlayIcon className="h-4 w-4" />}
              </button>
              <button
                type="button"
                onClick={() => timer.addSeconds(15)}
                className="rounded-xl bg-surface-3 px-3 py-2.5 text-sm font-semibold text-ink-2 active:bg-surface-4"
              >
                +15s
              </button>
              <button
                type="button"
                onClick={() => {
                  timer.reset()
                  setExpanded(false)
                }}
                className="rounded-xl bg-surface-3 px-3 py-2.5 text-ink-2 active:bg-surface-4"
                aria-label={t('rest.stop')}
              >
                <RefreshIcon className="h-4 w-4" />
              </button>
            </div>
          )}
        </div>
      )}

      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        aria-label={t('rest.timer')}
        aria-expanded={expanded}
        className={`pointer-events-auto flex h-12 items-center gap-2 rounded-full px-4 text-sm font-semibold shadow-lg active:scale-95 ${tone}`}
      >
        <TimerIcon className="h-5 w-5 shrink-0" />
        {timer.hasTimer && <span className="font-numbers tabular-nums">{formatCountdown(timer.remainingMs)}</span>}
      </button>
    </div>
  )
}
