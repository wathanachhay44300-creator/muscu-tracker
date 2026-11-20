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
import { t } from '../i18n'

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
      setMessage({ ok: false, text: t('trackImport.noData', { source, note }) })
      return
    }
    const plan = await planMerge(cleaned)
    if (plan.conflicts === 0) {
      const { written } = await applyMerge(cleaned, 'keep')
      setMessage({ ok: true, text: t('trackImport.done', { source, days: formatInt(cleaned.length), written: formatInt(written), note }) })
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
      await stage(entries, file.name, skipped ? t('trackImport.skipped', { n: skipped }) : '')
    } catch {
      setMessage({ ok: false, text: t('trackImport.unreadable') })
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
        setMessage({ ok: false, text: t('trackImport.noSteps') })
      } else {
        await stage(entries, t('trackImport.appleHealth'))
      }
    } catch {
      setMessage({ ok: false, text: t('trackImport.unreadable') })
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
        text: t('trackImport.saved', { source, n: formatInt(written), policy: policy === 'replace' ? t('trackImport.replaced') : t('trackImport.kept') }),
      })
    } finally {
      setBusy(false)
    }
  }

  async function handleExport() {
    const csv = await trackingToCsv()
    downloadBlob(new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8' }), t('trackImport.fileName', { date: todayISO() }))
  }

  return (
    <div className="rounded-2xl border border-line bg-surface p-4 shadow-sm">
      <p className="mb-1 text-sm font-semibold text-ink-2">{t('trackImport.title')}</p>
      <p className="mb-3 text-xs text-muted">
        {t('trackImport.hint')}
      </p>

      <input ref={csvRef} type="file" accept=".csv,text/csv,text/plain" className="hidden" onChange={handleCsv} />
      <input ref={xmlRef} type="file" accept=".xml,text/xml,application/xml" className="hidden" onChange={handleHealth} />

      <div className="space-y-2">
        <button
          type="button"
          onClick={() => csvRef.current?.click()}
          disabled={busy}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-accent py-3 text-sm font-semibold text-on-accent active:bg-accent-hover disabled:opacity-60"
        >
          <UploadIcon className="h-4 w-4" />
          {t('trackImport.importCsv')}
        </button>
        <button
          type="button"
          onClick={() => xmlRef.current?.click()}
          disabled={busy}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-surface-3 py-3 text-sm font-semibold text-ink-2 active:bg-surface-4 disabled:opacity-60"
        >
          <UploadIcon className="h-4 w-4" />
          {t('trackImport.importHealth')}
        </button>
        <button
          type="button"
          onClick={handleExport}
          disabled={busy}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-surface-3 py-3 text-sm font-semibold text-ink-2 active:bg-surface-4 disabled:opacity-60"
        >
          <DownloadIcon className="h-4 w-4" />
          {t('trackImport.exportCsv')}
        </button>
      </div>

      {progress != null && (
        <div className="mt-3" role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(progress * 100)}>
          <div className="h-2 overflow-hidden rounded-full bg-surface-3">
            <div className="h-full rounded-full bg-accent transition-[width] duration-200" style={{ width: `${Math.round(progress * 100)}%` }} />
          </div>
          <p className="mt-1 text-xs text-muted">Lecture du fichier… {Math.round(progress * 100)} %</p>
        </div>
      )}

      {message && (
        <p className={`mt-3 rounded-xl px-3 py-2 text-xs font-medium ${message.ok ? 'bg-good-soft text-good-ink' : 'bg-danger-soft text-danger-ink'}`}>
          {message.text}
        </p>
      )}

      <p className="mt-3 text-[11px] text-muted">
        {t('trackImport.healthHelp')}
      </p>

      {pending && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-scrim/40 animate-fade-in-backdrop sm:items-center sm:p-4"
          onClick={() => setPending(null)}
        >
          <div
            className="w-full max-w-sm animate-slide-up rounded-t-2xl bg-surface p-5 pb-safe shadow-lg sm:rounded-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-base font-semibold text-ink">{t('trackImport.conflictTitle')}</h2>
            <p className="mt-1.5 text-sm text-muted">
              {t('trackImport.conflicts', { n: formatInt(pending.plan.conflicts) })}
              {pending.plan.fresh > 0 && t('trackImport.fresh', { n: formatInt(pending.plan.fresh) })}
              {t('trackImport.question')}
            </p>
            <div className="mt-5 space-y-2">
              <button
                type="button"
                onClick={() => resolve('keep')}
                className="w-full rounded-xl bg-accent py-3 font-medium text-on-accent active:bg-accent-hover"
              >
                {t('trackImport.keep')}
              </button>
              <button
                type="button"
                onClick={() => resolve('replace')}
                className="w-full rounded-xl bg-surface-3 py-3 font-medium text-ink-2 active:bg-surface-4"
              >
                {t('trackImport.replace')}
              </button>
              <button
                type="button"
                onClick={() => setPending(null)}
                className="w-full py-2.5 text-sm font-medium text-muted"
              >
                {t('trackImport.cancel')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
