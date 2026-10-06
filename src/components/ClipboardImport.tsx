import { useState } from 'react'
import { importFromClipboardText } from '../lib/deepLink'
import { ClipboardPasteIcon } from './Icons'

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
      setResult({ ok: false, text: 'Enregistrement impossible.' })
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
      setResult({ ok: false, text: 'Presse-papiers non lisible ici : collez le texte dans le champ ci-dessous.' })
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
        className="flex w-full items-center justify-center gap-2 rounded-xl bg-brand-600 py-3.5 text-sm font-semibold text-white active:bg-brand-700 disabled:opacity-60"
      >
        <ClipboardPasteIcon className="h-5 w-5" />
        Importer depuis le presse-papiers
      </button>

      {manual !== null && (
        <div className="mt-2 flex gap-2">
          <input
            value={manual}
            onChange={(e) => {
              setManual(e.target.value)
              setResult(null)
            }}
            placeholder="AAAA-MM-JJ;pas;poids;kcal"
            aria-label="Texte à importer"
            autoCapitalize="off"
            autoCorrect="off"
            className="min-w-0 flex-1 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm outline-none focus:border-brand-400"
          />
          <button
            type="button"
            onClick={() => run(manual)}
            disabled={busy || !manual.trim()}
            className="shrink-0 rounded-xl bg-slate-100 px-4 text-sm font-semibold text-slate-700 active:bg-slate-200 disabled:opacity-40"
          >
            Importer
          </button>
        </div>
      )}

      {result && (
        <p role="status" className={`mt-2 text-xs font-medium ${result.ok ? 'text-emerald-600' : 'text-red-600'}`}>
          {result.text}
        </p>
      )}
    </div>
  )
}
