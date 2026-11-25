/**
 * Translation system.
 *
 * - One dictionary per language: ./fr.ts (reference) and ./en.ts. English is
 *   type-checked against French, so dictionary keys stay aligned. New UI copy
 *   should use `t()` / `tn()` and add matching entries to both files.
 * - Exercise names are not translated (they are English in both languages).
 * - The language is saved on the device (localStorage) and applied without a
 *   reload: <I18nProvider> re-renders the whole app when it changes.
 */
import { useSyncExternalStore } from 'react'
import { fr } from './fr'
import { en } from './en'

export type Lang = 'fr' | 'en'

export const LANGUAGES: { id: Lang; label: string }[] = [
  { id: 'fr', label: 'Français' },
  { id: 'en', label: 'English' },
]

/** Same shape as the French dictionary, with plain strings as values. */
export type Dictionary = Widen<typeof fr>
type Widen<T> = { [K in keyof T]: T[K] extends string ? string : Widen<T[K]> }

type Leaves<T, P extends string = ''> = {
  [K in keyof T & string]: T[K] extends string ? `${P}${K}` : Leaves<T[K], `${P}${K}.`>
}[keyof T & string]

export type TKey = Leaves<Dictionary>

/** Keys that have `_one` / `_other` variants, for `tn()`. */
type PluralBase<K> = K extends `${infer B}_one` ? B : never
export type TPluralKey = PluralBase<TKey>

const DICTIONARIES: Record<Lang, Dictionary> = { fr, en }
const STORAGE_KEY = 'muscu-tracker:lang'

function readStored(): Lang {
  try {
    const v = localStorage.getItem(STORAGE_KEY)
    return v === 'en' || v === 'fr' ? v : 'fr'
  } catch {
    return 'fr'
  }
}

let current: Lang = typeof window !== 'undefined' ? readStored() : 'fr'
const listeners = new Set<(lang: Lang) => void>()

export function getLang(): Lang {
  return current
}

/** BCP 47 locale for number/date formatting. */
export function getLocale(): string {
  return current === 'en' ? 'en-GB' : 'fr-FR'
}

export function setLang(lang: Lang): void {
  if (lang === current) return
  current = lang
  try {
    localStorage.setItem(STORAGE_KEY, lang)
  } catch {
    // Storage unavailable: the choice lasts for this visit only.
  }
  document.documentElement.lang = lang
  listeners.forEach((l) => l(lang))
}

export function subscribeLang(listener: (lang: Lang) => void): () => void {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

/** React hook: re-render subscribers immediately when the language changes. */
export function useLang(): Lang {
  return useSyncExternalStore(subscribeLang, getLang, () => 'fr')
}

/** Keep the document language and accessible date/voice-over locale in sync. */
if (typeof document !== 'undefined') document.documentElement.lang = current

function lookup(dict: Dictionary, key: string): string | undefined {
  let node: unknown = dict
  for (const part of key.split('.')) {
    if (node == null || typeof node !== 'object') return undefined
    node = (node as Record<string, unknown>)[part]
  }
  return typeof node === 'string' ? node : undefined
}

function interpolate(text: string, params?: Record<string, string | number>): string {
  if (!params) return text
  return text.replace(/\{(\w+)\}/g, (m, name: string) => (name in params ? String(params[name]) : m))
}

/** Translated text for a key, with `{name}` placeholders filled from `params`. */
export function t(key: TKey, params?: Record<string, string | number>): string {
  const text = lookup(DICTIONARIES[current], key) ?? lookup(fr, key) ?? key
  return interpolate(text, params)
}

/** Plural-aware text: picks `key_one` or `key_other`; `{n}` is the count. */
export function tn(key: TPluralKey, n: number, params?: Record<string, string | number>): string {
  // French uses the singular for 0 and 1; English only for exactly 1.
  const one = current === 'fr' ? Math.abs(n) < 2 : n === 1
  return t(`${key}_${one ? 'one' : 'other'}` as TKey, { n: formatNumber(n), ...params })
}

/**
 * Wording specific to a theme (e.g. boxing words in Title Fight), from
 * `themeWords.<theme>.<key>`; any other theme gets the usual text for `key`.
 */
export function tThemed(theme: string, key: TKey, params?: Record<string, string | number>): string {
  const themed = lookup(DICTIONARIES[current], `themeWords.${theme}.${key}`)
  return themed != null ? interpolate(themed, params) : t(key, params)
}

/** `tn` with the theme's own wording when it has one. */
export function tnThemed(theme: string, key: TPluralKey, n: number, params?: Record<string, string | number>): string {
  const one = current === 'fr' ? Math.abs(n) < 2 : n === 1
  return tThemed(theme, `${key}_${one ? 'one' : 'other'}` as TKey, { n: formatNumber(n), ...params })
}

/** Like `t`, for keys built at runtime from data (e.g. a muscle group stored in the database). */
export function tDynamic(key: string, params?: Record<string, string | number>): string {
  const text = lookup(DICTIONARIES[current], key) ?? lookup(fr, key)
  return text != null ? interpolate(text, params) : key.slice(key.lastIndexOf('.') + 1)
}

/* ------------------------------- numbers ------------------------------- */

/** Number in the current language: "1 940" / "1,940", "62,5" / "62.5". */
export function formatNumber(n: number, maxDecimals = 2): string {
  return n.toLocaleString(getLocale(), { maximumFractionDigits: maxDecimals })
}

/** Decimal number without thousands grouping, for editable fields ("62,5" / "62.5"). */
export function formatDecimal(n: number, maxDecimals = 2): string {
  return n.toLocaleString(getLocale(), { maximumFractionDigits: maxDecimals, useGrouping: false })
}

/** Reads "62,5" or "62.5" whatever the language. */
export function parseDecimal(raw: string): number {
  return parseFloat(raw.replace(/[\s  ]/g, '').replace(',', '.'))
}

/* ------------------------- data-backed labels ------------------------- */
// Muscle groups and load types are stored in the database as French
// strings; these turn them into the current language for display.

export function groupLabel(group: string): string {
  return tDynamic(`muscleGroup.${group}`)
}

export function loadTypeLabel(loadType: string): string {
  return tDynamic(`loadType.${loadType}`)
}

export function equipmentLabel(equipment: string): string {
  const ids: Record<string, string> = {
    Barre: 'barre', Haltères: 'halteres', 'Barre EZ': 'ez', Machine: 'machine', Smith: 'smith',
    Poulie: 'poulie', 'Poids du corps': 'poids_du_corps',
  }
  return tDynamic(`equipment.${ids[equipment] ?? equipment}`)
}

export function muscleLabel(muscle: string): string {
  return tDynamic(`muscle.${muscle}`)
}

/** Short muscle name for the pills on exercise cards ("Épaules avant", "Front delts"). */
export function muscleShortLabel(muscle: string): string {
  return tDynamic(`muscleShort.${muscle}`)
}
