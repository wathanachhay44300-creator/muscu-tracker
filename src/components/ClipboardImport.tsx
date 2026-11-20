import { useState } from 'react'
import { importFromClipboardText } from '../lib/deepLink'
import { ClipboardPasteIcon } from './Icons'
import { t } from '../i18n'

/**
 * "Importer depuis le presse-papiers": the import path that works in the
 * installed home-screen app, where a Shortcut can't hand data over by link.
 * Reading the clipboard needs a tap (iOS then asks to allow the paste); when
 * it isn't readable, a manual paste field takes over.
 */
export function ClipboardImport() {
  const [busy, setBusy] = useState(false)
  const [result, setResult] = useState<{ ok: boolean; text: string } | null>(null)
  const [manual, setManual] = useState<string | null>(null)

  async function run(text: string) {
    setBusy(true)
    try {
      const r = await importFromClipboardText(text)
      setResult({ ok: r.ok, text: r.message })
      if (r.ok) setManual(null)
    } catch {
      setResult({ ok: false, text: t('clipboard.saveError') })
    } finally {
      setBusy(false)
    }
  }

  async function handleClipboard() {
    setResult(null)
    let text: string
    try {
      text = await navigator.clipboard.readText()
    } catch {
      setManual('')
      setResult({ ok: false, text: t('clipboard.unreadable') })
      return
    }
    await run(text)
  }

  return (
    <div>
      <button
        type="button"
        onClick={handleClipboard}
        disabled={busy}
        className="flex w-full items-center justify-center gap-2 rounded-xl bg-accent py-3.5 text-sm font-semibold text-on-accent active:bg-accent-hover disabled:opacity-60"
      >
        <ClipboardPasteIcon className="h-5 w-5" />
        {t('clipboard.importButton')}
      </button>

      {manual !== null && (
        <div className="mt-2 flex gap-2">
          <input
            value={manual}
            onChange={(e) => {
              setManual(e.target.value)
              setResult(null)
            }}
            placeholder={t('clipboard.placeholder')}
            aria-label={t('clipboard.fieldLabel')}
            autoCapitalize="off"
            autoCorrect="off"
            className="min-w-0 flex-1 rounded-xl border border-line bg-surface-2 px-3 py-2.5 text-sm outline-none focus:border-accent-line"
          />
          <button
            type="button"
            onClick={() => run(manual)}
            disabled={busy || !manual.trim()}
            className="shrink-0 rounded-xl bg-surface-3 px-4 text-sm font-semibold text-ink-2 active:bg-surface-4 disabled:opacity-40"
          >
            {t('common.import')}
          </button>
        </div>
      )}

      {result && (
        <p role="status" className={`mt-2 text-xs font-medium ${result.ok ? 'text-good-ink' : 'text-danger-ink'}`}>
          {result.text}
        </p>
      )}
    </div>
  )
}
