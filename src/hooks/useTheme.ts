import { useCallback, useEffect, useState } from 'react'
import { applyTheme, getStoredTheme, setStoredTheme, systemPrefersDark, type ThemeChoice } from '../lib/theme'

/**
 * Resolved light/dark theme plus a setter. The actual re-theming happens
 * through CSS (see index.css) — this hook just tracks/persists the user's
 * explicit choice and keeps the document attribute + PWA chrome tint in
 * sync, including live updates when the OS preference changes and the user
 * hasn't overridden it.
 */
export function useTheme() {
  const [stored, setStored] = useState<ThemeChoice | null>(() => getStoredTheme())
  const [systemDark, setSystemDark] = useState(systemPrefersDark)

  useEffect(() => {
    const mq = window.matchMedia('(prefers-color-scheme: dark)')
    const handler = (e: MediaQueryListEvent) => setSystemDark(e.matches)
    mq.addEventListener('change', handler)
    return () => mq.removeEventListener('change', handler)
  }, [])

  useEffect(() => {
    applyTheme(stored)
    // Re-apply whenever the system preference changes too, so the browser
    // chrome tint stays correct even without an explicit user choice.
  }, [stored, systemDark])

  const theme: ThemeChoice = stored ?? (systemDark ? 'dark' : 'light')

  const setTheme = useCallback((next: ThemeChoice) => {
    setStoredTheme(next)
    setStored(next)
  }, [])

  const toggle = useCallback(() => {
    setTheme(theme === 'dark' ? 'light' : 'dark')
  }, [theme, setTheme])

  return { theme, setTheme, toggle }
}
