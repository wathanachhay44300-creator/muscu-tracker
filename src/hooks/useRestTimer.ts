import { useEffect, useRef, useState } from 'react'
import { usePreferences } from './usePreferences'
import { playTimerDoneChime } from '../lib/sound'

const STORAGE_KEY = 'muscu-tracker:restTimer'

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
    // Storage unavailable (private mode, quota) — timer just won't survive a reload.
  }
}

/**
 * A rest-timer countdown that survives the tab being backgrounded: it stores
 * an absolute `endTime` (not a running interval, which mobile browsers can
 * throttle or pause) and recomputes the remaining time from the wall clock
 * whenever the tab becomes visible again.
 */
export function useRestTimer() {
  const [state, setState] = useState<TimerState>(() => readStored())
  const [now, setNow] = useState(() => Date.now())
  const donePlayedRef = useRef(false)
  const preferences = usePreferences()

  useEffect(() => {
    if (state?.status !== 'running') return
    const interval = setInterval(() => setNow(Date.now()), 250)
    return () => clearInterval(interval)
  }, [state])

  useEffect(() => {
    function onVisible() {
      if (document.visibilityState === 'visible') setNow(Date.now())
    }
    document.addEventListener('visibilitychange', onVisible)
    return () => document.removeEventListener('visibilitychange', onVisible)
  }, [])

  const remainingMs =
    state == null ? 0 : state.status === 'running' ? Math.max(0, state.endTime - now) : state.remainingMs
  const totalMs = state?.totalMs ?? 0
  const isRunning = state?.status === 'running' && remainingMs > 0
  const isPaused = state?.status === 'paused'
  const isDone = state?.status === 'running' && remainingMs === 0

  useEffect(() => {
    if (isDone && !donePlayedRef.current) {
      donePlayedRef.current = true
      if (preferences?.soundEnabled) playTimerDoneChime()
      navigator.vibrate?.([200, 100, 200])
    }
    if (!isDone) donePlayedRef.current = false
  }, [isDone, preferences])

  function start(durationMs: number) {
    const start = Date.now()
    const next: TimerState = { status: 'running', endTime: start + durationMs, totalMs: durationMs }
    setState(next)
    setNow(start)
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
      const start = Date.now()
      const next: TimerState = { status: 'running', endTime: start + s.remainingMs, totalMs: s.totalMs }
      setNow(start)
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
  }

  function reset() {
    setState(null)
    persist(null)
  }

  return { remainingMs, totalMs, isRunning, isPaused, isDone, hasTimer: state != null, start, pause, resume, addSeconds, reset }
}
