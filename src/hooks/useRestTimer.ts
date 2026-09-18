import { useEffect, useRef, useState } from 'react'
import { usePreferences } from './usePreferences'
import { playTimerDoneChime } from '../lib/sound'
import { hapticSuccess } from '../lib/haptics'
import { requestNotificationPermission, showRestOverNotification } from '../lib/notifications'

const STORAGE_KEY = 'muscu-tracker:restTimer'
/** A timer that expired longer ago than this while the app was away isn't announced on return. */
const STALE_DONE_MS = 15_000

type TimerState =
  | { status: 'running'; endTime: number; totalMs: number }
  | { status: 'paused'; remainingMs: number; totalMs: number }
  | null

function readStored(): TimerState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? (JSON.parse(raw) as TimerState) : null
  } catch {
    return null
  }
}

function persist(state: TimerState): void {
  try {
    if (state) localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
    else localStorage.removeItem(STORAGE_KEY)
  } catch {
    // Storage unavailable — the timer just won't survive a reload.
  }
}

/**
 * Rest countdown that survives backgrounding: it stores an absolute
 * `endTime` and recomputes from the wall clock. Completion (sound, haptics,
 * native notification) is driven by a dedicated timeout scheduled for
 * `endTime` — not by the UI tick — so it still fires when the tab is
 * hidden, and once more on return if the timeout was throttled.
 */
export function useRestTimer() {
  const [state, setState] = useState<TimerState>(() => readStored())
  const [now, setNow] = useState(() => Date.now())
  const announcedRef = useRef<number | null>(null)
  const preferences = usePreferences()
  const prefsRef = useRef(preferences)
  useEffect(() => {
    prefsRef.current = preferences
  }, [preferences])

  useEffect(() => {
    if (state?.status !== 'running') return
    const interval = setInterval(() => setNow(Date.now()), 250)
    return () => clearInterval(interval)
  }, [state])

  useEffect(() => {
    function announce(endTime: number) {
      if (announcedRef.current === endTime) return
      announcedRef.current = endTime
      if (Date.now() - endTime > STALE_DONE_MS) return
      const prefs = prefsRef.current
      if (prefs?.soundEnabled) playTimerDoneChime()
      hapticSuccess(!!prefs?.hapticsEnabled)
      void showRestOverNotification(!!prefs?.hapticsEnabled)
    }

    if (state?.status !== 'running') return
    const { endTime } = state
    const timeout = setTimeout(() => announce(endTime), Math.max(0, endTime - Date.now()))
    function onVisible() {
      if (document.visibilityState !== 'visible') return
      setNow(Date.now())
      if (Date.now() >= endTime) announce(endTime)
    }
    document.addEventListener('visibilitychange', onVisible)
    return () => {
      clearTimeout(timeout)
      document.removeEventListener('visibilitychange', onVisible)
    }
  }, [state])

  const remainingMs =
    state == null ? 0 : state.status === 'running' ? Math.max(0, state.endTime - now) : state.remainingMs
  const totalMs = state?.totalMs ?? 0
  const isRunning = state?.status === 'running' && remainingMs > 0
  const isPaused = state?.status === 'paused'
  const isDone = state?.status === 'running' && remainingMs === 0

  function start(durationMs: number) {
    void requestNotificationPermission()
    const t = Date.now()
    const next: TimerState = { status: 'running', endTime: t + durationMs, totalMs: durationMs }
    setState(next)
    setNow(t)
    persist(next)
  }

  function pause() {
    setState((s) => {
      if (s?.status !== 'running') return s
      const next: TimerState = { status: 'paused', remainingMs: Math.max(0, s.endTime - Date.now()), totalMs: s.totalMs }
      persist(next)
      return next
    })
  }

  function resume() {
    setState((s) => {
      if (s?.status !== 'paused') return s
      const t = Date.now()
      const next: TimerState = { status: 'running', endTime: t + s.remainingMs, totalMs: s.totalMs }
      setNow(t)
      persist(next)
      return next
    })
  }

  function addSeconds(sec: number) {
    setState((s) => {
      if (!s) return s
      const next: TimerState =
        s.status === 'running'
          ? { ...s, endTime: s.endTime + sec * 1000 }
          : { ...s, remainingMs: Math.max(0, s.remainingMs + sec * 1000) }
      persist(next)
      return next
    })
    setNow(Date.now())
  }

  function reset() {
    setState(null)
    persist(null)
  }

  return { remainingMs, totalMs, isRunning, isPaused, isDone, hasTimer: state != null, start, pause, resume, addSeconds, reset }
}
