import { useState } from 'react'
import { useRestTimer } from '../hooks/useRestTimer'
import { PauseIcon, PlayIcon, RefreshIcon, TimerIcon, XIcon } from './Icons'

const PRESETS_SEC = [30, 60, 90, 120]

function formatCountdown(ms: number): string {
  const totalSec = Math.ceil(ms / 1000)
  const m = Math.floor(totalSec / 60)
  const s = totalSec % 60
  return `${m}:${String(s).padStart(2, '0')}`
}

/**
 * A small floating button (bottom-right, above the bottom nav) that opens
 * the rest-timer sheet. Shown while editing a workout, since that's when
 * "rest between sets" is relevant. Deliberately doesn't request browser
 * Notification permission — a visible countdown + sound + vibration already
 * covers "avec notification/son" without an extra permission prompt.
 */
export function RestTimerWidget() {
  const timer = useRestTimer()
  const [open, setOpen] = useState(false)

  const badgeTone = timer.isDone
    ? 'bg-emerald-600 text-white animate-pop-in'
    : timer.isRunning
      ? 'bg-brand-600 text-white'
      : timer.isPaused
        ? 'bg-amber-500 text-white'
        : 'bg-surface text-slate-600 border border-slate-200'

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Minuteur de repos"
        className={`fixed bottom-24 right-4 z-40 flex h-14 items-center gap-2 rounded-full px-4 text-sm font-semibold shadow-lg active:scale-95 ${badgeTone}`}
      >
        <TimerIcon className="h-5 w-5 shrink-0" />
        {timer.hasTimer && <span className="tabular-nums">{formatCountdown(timer.remainingMs)}</span>}
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 animate-fade-in-backdrop sm:items-center sm:p-4"
          onClick={() => setOpen(false)}
        >
          <div
            className="w-full max-w-sm animate-slide-up rounded-t-2xl bg-surface p-5 pb-safe shadow-lg sm:rounded-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-base font-semibold text-slate-900">Minuteur de repos</h2>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="rounded-full p-1.5 text-slate-500 active:bg-slate-100"
                aria-label="Fermer"
              >
                <XIcon className="h-5 w-5" />
              </button>
            </div>

            <div className="mb-5 rounded-2xl bg-slate-50 py-8 text-center">
              <p
                className={`text-4xl font-bold tabular-nums ${
                  timer.isDone ? 'text-emerald-600' : 'text-slate-900'
                }`}
              >
                {formatCountdown(timer.remainingMs)}
              </p>
              {timer.isDone && <p className="mt-1 text-sm font-semibold text-emerald-600">Repos terminé !</p>}
              {timer.isPaused && <p className="mt-1 text-sm font-medium text-amber-600">En pause</p>}
            </div>

            {!timer.hasTimer || timer.isDone ? (
              <div className="grid grid-cols-4 gap-2">
                {PRESETS_SEC.map((sec) => (
                  <button
                    key={sec}
                    type="button"
                    onClick={() => timer.start(sec * 1000)}
                    className="rounded-xl bg-brand-600 py-3 text-sm font-semibold text-white active:bg-brand-700"
                  >
                    {sec}s
                  </button>
                ))}
              </div>
            ) : (
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => (timer.isRunning ? timer.pause() : timer.resume())}
                  className="flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-brand-600 py-3 font-semibold text-white active:bg-brand-700"
                >
                  {timer.isRunning ? <PauseIcon className="h-4 w-4" /> : <PlayIcon className="h-4 w-4" />}
                  {timer.isRunning ? 'Pause' : 'Reprendre'}
                </button>
                <button
                  type="button"
                  onClick={() => timer.addSeconds(15)}
                  className="rounded-xl bg-slate-100 px-4 py-3 font-semibold text-slate-600 active:bg-slate-200"
                >
                  +15s
                </button>
                <button
                  type="button"
                  onClick={() => timer.reset()}
                  aria-label="Réinitialiser"
                  className="rounded-xl bg-slate-100 px-4 py-3 text-slate-600 active:bg-slate-200"
                >
                  <RefreshIcon className="h-4 w-4" />
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  )
}
