const STORAGE_KEY = 'muscu-tracker:theme'
const LIGHT_THEME_COLOR = '#8b1e1e'
const DARK_THEME_COLOR = '#241712'

export type ThemeChoice = 'light' | 'dark'

/** The user's explicit choice, if any — `null` means "follow the OS". */
export function getStoredTheme(): ThemeChoice | null {
  try {
    const v = localStorage.getItem(STORAGE_KEY)
    return v === 'light' || v === 'dark' ? v : null
  } catch {
    return null
  }
}

export function setStoredTheme(theme: ThemeChoice): void {
  try {
    localStorage.setItem(STORAGE_KEY, theme)
  } catch {
    // Storage unavailable (private mode, quota) — theme just won't persist.
  }
}

export function systemPrefersDark(): boolean {
  return typeof window !== 'undefined' && window.matchMedia('(prefers-color-scheme: dark)').matches
}

export function resolveTheme(stored: ThemeChoice | null): ThemeChoice {
  return stored ?? (systemPrefersDark() ? 'dark' : 'light')
}

/**
 * Applies the theme to the document: the `data-theme` attribute (only when
 * the user made an explicit choice — otherwise CSS alone follows the OS via
 * `prefers-color-scheme`) and the PWA/browser-chrome tint, which can't
 * follow our own attribute on its own.
 */
export function applyTheme(stored: ThemeChoice | null): void {
  const root = document.documentElement
  if (stored) root.setAttribute('data-theme', stored)
  else root.removeAttribute('data-theme')

  const resolved = resolveTheme(stored)
  document
    .querySelector('meta[name="theme-color"]')
    ?.setAttribute('content', resolved === 'dark' ? DARK_THEME_COLOR : LIGHT_THEME_COLOR)
}
