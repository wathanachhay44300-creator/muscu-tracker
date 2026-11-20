import { useCallback, useEffect, useState } from 'react'
import { applyTheme, getStoredTheme, setStoredTheme } from '../lib/theme'
import type { ThemeId } from '../theme/themes'

/** Current theme + setter; persists the choice and applies it to the document. */
export function useTheme() {
  const [theme, setThemeState] = useState<ThemeId>(() => getStoredTheme())

  useEffect(() => {
    applyTheme(theme)
  }, [theme])

  const setTheme = useCallback((next: ThemeId) => {
    setStoredTheme(next)
    setThemeState(next)
  }, [])

  return { theme, setTheme }
}
