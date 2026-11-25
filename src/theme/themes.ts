/**
 * Available themes. Their colors, fonts and shapes live in ./theme.css (one
 * `[data-theme="…"]` block each); this list only gives them an id and a
 * label for the settings screen. To add a theme: add a block in theme.css
 * and an entry here.
 */
export const THEMES = [
  { id: 'iron-night', label: 'Iron Night', description: 'Noir et jaune néon' },
  { id: 'khmer-light', label: 'Khmer clair', description: 'Sable, rouge et or' },
  { id: 'khmer-dark', label: 'Khmer sombre', description: 'Brun chaud, rouge et or' },
  { id: 'fraise-chantilly', label: 'Fraise Chantilly', description: 'Rose, crème et gourmandises' },
  { id: 'title-fight', label: 'Title Fight', description: 'Soirée de boxe : nuit, rouge et or' },
] as const

export type ThemeId = (typeof THEMES)[number]['id']

export const DEFAULT_THEME: ThemeId = 'iron-night'

/** New key: everyone starts on Iron Night, the old light/dark choice is not carried over. */
export const THEME_STORAGE_KEY = 'muscu-tracker:theme-v2'

export function isThemeId(v: unknown): v is ThemeId {
  return THEMES.some((t) => t.id === v)
}
