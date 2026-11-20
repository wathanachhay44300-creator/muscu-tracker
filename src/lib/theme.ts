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

/**
 * Applies a theme: the `data-theme` attribute (every color comes from it,
 * see src/theme/theme.css) and the browser/PWA chrome tint, read back from
 * the theme's own `--nav-bg` token so the color is defined in one place only.
 */
export function applyTheme(theme: ThemeId): void {
  const root = document.documentElement
  root.setAttribute('data-theme', theme)
  const chrome = getComputedStyle(root).getPropertyValue('--bg').trim()
  if (chrome) document.querySelector('meta[name="theme-color"]')?.setAttribute('content', chrome)
}
