import { applyMerge } from './trackingImport'
import { todayISO } from './date'
import { describeImport, describeImports, hasDeepLinkParams, parseClipboardText, parseDeepLink } from './tracking'

const LINK_KEYS = ['steps', 'date', 'weight', 'kcal', 'calories']

/**
 * Looks for import parameters in the page URL (?steps=…&date=…), removes
 * them from the address bar so a reload doesn't import again, and returns
 * them. Must run synchronously at startup: the cleanup happens before any
 * async work, so a second call (React StrictMode) finds nothing.
 */
export function takeDeepLinkParams(): URLSearchParams | null {
  const params = new URLSearchParams(window.location.search)
  if (!hasDeepLinkParams(params)) return null
  const taken = new URLSearchParams(params)
  for (const k of LINK_KEYS) params.delete(k)
  const rest = params.toString()
  window.history.replaceState(null, '', `${window.location.pathname}${rest ? `?${rest}` : ''}${window.location.hash}`)
  return taken
}

/** Validates and saves an import link; returns the message to show the user. */
export async function importFromParams(params: URLSearchParams): Promise<{ ok: boolean; message: string }> {
  const result = parseDeepLink(params, todayISO())
  if (result.kind === 'ignored') {
    return { ok: false, message: `Lien d'import ignoré : ${result.reason}` }
  }
  // The link is the automatic source for these values: it updates the day's
  // existing row (never a duplicate), including re-runs of the same Shortcut.
  await applyMerge([result.entry], 'replace')
  return { ok: true, message: describeImport(result.entry) }
}

/**
 * Imports what an iOS Shortcut left on the clipboard (`AAAA-MM-JJ;pas;poids;kcal`,
 * or an import link). Nothing is saved unless the whole text is valid; the
 * day's existing row is updated, never duplicated.
 */
export async function importFromClipboardText(text: string): Promise<{ ok: boolean; message: string }> {
  const parsed = parseClipboardText(text, todayISO())
  if (!parsed.ok) return { ok: false, message: parsed.error }
  await applyMerge(parsed.entries, 'replace')
  return { ok: true, message: describeImports(parsed.entries) }
}
