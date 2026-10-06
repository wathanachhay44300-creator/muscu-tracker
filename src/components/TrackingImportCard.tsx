import { useRef, useState } from 'react'
import { downloadBlob } from '../lib/dataExport'
import { todayISO } from '../lib/date'
import { formatInt } from '../lib/tracking'
import {
  applyMerge,
  dedupeByDate,
  parseHealthSteps,
  parseTrackingCsv,
  planMerge,
  trackingToCsv,
  type MergePlan,
} from '../lib/trackingImport'
import type { DayEntry } from '../lib/tracking'
import { DownloadIcon, UploadIcon } from './Icons'

interface Pending {
  entries: DayEntry[]
  plan: MergePlan
  source: string
}

/** Imports pas / poids / calories from a CSV or an Apple Health export, never overwriting without asking. */
export function TrackingImportCard() {
  const csvRef = useRef<HTMLInputElement>(null)
  const xmlRef = useRef<HTMLInputElement>(null)
  const [busy, setBusy] = useState(false)
  const [progress, setProgress] = useState<number | null>(null)
  const [pending, setPending] = useState<Pending | null>(null)
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null)

  async function stage(entries: DayEntry[], source: string, note = '') {
    const cleaned = dedupeByDate(entries)
    if (cleaned.length === 0) {
      setMessage({ ok: false, text: `Aucune donnée exploitable dans ${source}.${note}` })
      return
    }
    const plan = await planMerge(cleaned)
    if (plan.conflicts === 0) {
      const { written } = await applyMerge(cleaned, 'keep')
      setMessage({ ok: true, text: `${source} : ${formatInt(cleaned.length)} jours lus, ${formatInt(written)} valeurs ajoutées.${note}` })
    } else {
      setPending({ entries: cleaned, plan, source })
    }
  }

  async function handleCsv(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    setBusy(true)
    setMessage(null)
    try {
      const { entries, skipped } = parseTrackingCsv(await file.text())
      await stage(entries, file.name, skipped ? ` ${skipped} ligne(s) ignorée(s).` : '')
    } catch {
      setMessage({ ok: false, text: 'Impossible de lire ce fichier.' })
    } finally {
      setBusy(false)
    }
  }

  async function handleHealth(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    setBusy(true)
    setMessage(null)
    setProgress(0)
    try {
      const { entries, records } = await parseHealthSteps(file, setProgress)
      if (records === 0) {
        setMessage({ ok: false, text: 'Aucun pas trouvé : choisissez le fichier export.xml extrait du zip Apple Santé.' })
      } else {
        await stage(entries, 'Apple Santé')
      }
    } catch {
      setMessage({ ok: false, text: 'Impossible de lire ce fichier.' })
    } finally {
      setBusy(false)
      setProgress(null)
    }
  }

  async function resolve(policy: 'replace' | 'keep') {
    if (!pending) return
    const { entries, source } = pending
    setPending(null)
    setBusy(true)
    try {
      const { written } = await applyMerge(entries, policy)
      setMessage({
        ok: true,
        text: `${source} : ${formatInt(written)} valeurs enregistrées (${policy === 'replace' ? 'existantes remplacées' : 'existantes conservées'}).`,
      })
    } finally {
      setBusy(false)
    }
  }

  async function handleExport() {
    const csv = await trackingToCsv()
    downloadBlob(new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8' }), `muscu-tracker-suivi-${todayISO()}.csv`)
  }

  return (
    <div className="rounded-2xl border border-slate-200 bg-surface p-4 shadow-sm">
      <p className="mb-1 text-sm font-semibold text-slate-700">Pas, poids &amp; calories (CSV, Apple Santé)</p>
      <p className="mb-3 text-xs text-slate-400">
        Récupérez un historique passé. Une valeur déjà saisie n'est jamais écrasée sans votre accord.
      </p>

      <input ref={csvRef} type="file" accept=".csv,text/csv,text/plain" className="hidden" onChange={handleCsv} />
      <input ref={xmlRef} type="file" accept=".xml,text/xml,application/xml" className="hidden" onChange={handleHealth} />

      <div className="space-y-2">
        <button
          type="button"
          onClick={() => csvRef.current?.click()}
          disabled={busy}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-brand-600 py-3 text-sm font-semibold text-white active:bg-brand-700 disabled:opacity-60"
        >
          <UploadIcon className="h-4 w-4" />
          Importer un CSV (date, pas, poids, calories)
        </button>
        <button
          type="button"
          onClick={() => xmlRef.current?.click()}
          disabled={busy}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-slate-100 py-3 text-sm font-semibold text-slate-700 active:bg-slate-200 disabled:opacity-60"
        >
          <UploadIcon className="h-4 w-4" />
          Importer les pas d'Apple Santé (export.xml)
        </button>
        <button
          type="button"
          onClick={handleExport}
          disabled={busy}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-slate-100 py-3 text-sm font-semibold text-slate-700 active:bg-slate-200 disabled:opacity-60"
        >
          <DownloadIcon className="h-4 w-4" />
          Exporter le suivi en CSV
        </button>
      </div>

      {progress != null && (
        <div className="mt-3" role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(progress * 100)}>
          <div className="h-2 overflow-hidden rounded-full bg-slate-100">
            <div className="h-full rounded-full bg-brand-600 transition-[width] duration-200" style={{ width: `${Math.round(progress * 100)}%` }} />
          </div>
          <p className="mt-1 text-xs text-slate-400">Lecture du fichier… {Math.round(progress * 100)} %</p>
        </div>
      )}

      {message && (
        <p className={`mt-3 rounded-xl px-3 py-2 text-xs font-medium ${message.ok ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'}`}>
          {message.text}
        </p>
      )}

      <p className="mt-3 text-[11px] text-slate-400">
        Apple Santé : dans l'app Santé, touchez votre profil &gt; Exporter toutes les données, extrayez le zip
        puis choisissez <span className="font-mono">export.xml</span>. Les gros fichiers sont lus par morceaux (compter
        quelques minutes). Si l'iPhone et l'Apple Watch comptent les mêmes pas, la source la plus complète de
        chaque jour est retenue : le total peut différer légèrement de l'app Santé.
      </p>

      {pending && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 animate-fade-in-backdrop sm:items-center sm:p-4"
          onClick={() => setPending(null)}
        >
          <div
            className="w-full max-w-sm animate-slide-up rounded-t-2xl bg-surface p-5 pb-safe shadow-lg sm:rounded-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-base font-semibold text-slate-900">Valeurs déjà saisies</h2>
            <p className="mt-1.5 text-sm text-slate-500">
              {formatInt(pending.plan.conflicts)} valeur(s) du fichier diffèrent de ce que vous avez déjà saisi
              {pending.plan.fresh > 0 && `, et ${formatInt(pending.plan.fresh)} nouvelle(s) valeur(s) seront ajoutées dans tous les cas`}
              . Que faire des valeurs en conflit ?
            </p>
            <div className="mt-5 space-y-2">
              <button
                type="button"
                onClick={() => resolve('keep')}
                className="w-full rounded-xl bg-brand-600 py-3 font-medium text-white active:bg-brand-700"
              >
                Garder l'existant
              </button>
              <button
                type="button"
                onClick={() => resolve('replace')}
                className="w-full rounded-xl bg-slate-100 py-3 font-medium text-slate-700 active:bg-slate-200"
              >
                Remplacer par le fichier
              </button>
              <button
                type="button"
                onClick={() => setPending(null)}
                className="w-full py-2.5 text-sm font-medium text-slate-400"
              >
                Annuler l'import
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
