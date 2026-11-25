import { useCallback, useSyncExternalStore } from 'react'
import { applyTheme, getCurrentTheme, setStoredTheme, subscribeTheme } from '../lib/theme'
import type { ThemeId } from '../theme/themes'

/** The theme in use; screens re-render when it changes (theme-specific wording). */
export function useThemeId(): ThemeId {
  return useSyncExternalStore(subscribeTheme, getCurrentTheme)
}

/** Current theme + setter; persists the choice and applies it to the document. */
export function useTheme() {
  const theme = useThemeId()

  const setTheme = useCallback((next: ThemeId) => {
    setStoredTheme(next)
    applyTheme(next)
  }, [])

  return { theme, setTheme }
}
