import { applyMerge } from './trackingImport'
import { describeImport, hasDeepLinkParams, parseDeepLink, todayEntryDate } from './tracking'

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
  const result = parseDeepLink(params, todayEntryDate())
  if (result.kind === 'ignored') {
    return { ok: false, message: `Lien d'import ignoré : ${result.reason}` }
  }
  // The link is the automatic source for these values: it updates the day's
  // existing row (never a duplicate), including re-runs of the same Shortcut.
  await applyMerge([result.entry], 'replace')
  return { ok: true, message: describeImport(result.entry) }
}
