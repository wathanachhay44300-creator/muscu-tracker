import { DEFAULT_THEME, THEME_STORAGE_KEY, isThemeId, type ThemeId } from '../theme/themes'

export function getStoredTheme(): ThemeId {
  try {
    const v = localStorage.getItem(THEME_STORAGE_KEY)
    return isThemeId(v) ? v : DEFAULT_THEME
  } catch {
    return DEFAULT_THEME
  }
}

export function setStoredTheme(theme: ThemeId): void {
  try {
    localStorage.setItem(THEME_STORAGE_KEY, theme)
  } catch {
    // Storage unavailable (private mode, quota) — theme just won't persist.
  }
}

/* The applied theme, shared with the screens that read it while rendering
 * (theme-specific wording, see useThemeId). */
let currentTheme: ThemeId | null = null
const listeners = new Set<() => void>()

export function getCurrentTheme(): ThemeId {
  return currentTheme ?? getStoredTheme()
}

export function subscribeTheme(listener: () => void): () => void {
  listeners.add(listener)
  return () => {
    listeners.delete(listener)
  }
}

/**
 * Applies a theme: the `data-theme` attribute (every color comes from it,
 * see src/theme/theme.css) and the browser/PWA chrome tint, read back from
 * the theme's own `--nav-bg` token so the color is defined in one place only.
 */
export function applyTheme(theme: ThemeId): void {
  const root = document.documentElement
  root.setAttribute('data-theme', theme)
  if (currentTheme !== theme) {
    currentTheme = theme
    listeners.forEach((l) => l())
  }
  const chrome = getComputedStyle(root).getPropertyValue('--bg').trim()
  if (chrome) document.querySelector('meta[name="theme-color"]')?.setAttribute('content', chrome)
  // Home-screen app on iPhone: status bar style, read again when the app is reopened.
  const statusBar = getComputedStyle(root).getPropertyValue('--status-bar').trim()
  if (statusBar) document.querySelector('meta[name="apple-mobile-web-app-status-bar-style"]')?.setAttribute('content', statusBar)
}
