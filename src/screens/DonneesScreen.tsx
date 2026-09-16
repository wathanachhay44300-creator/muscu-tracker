import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { exportAllDataJSON, exportHistoryCSV, getDataSummary, importDataJSON, type DataSummary } from '../lib/dataExport'
import { ConfirmDialog } from '../components/ConfirmDialog'
import { ChevronLeftIcon, DownloadIcon, UploadIcon } from '../components/Icons'

export function DonneesScreen() {
  const navigate = useNavigate()
  const [summary, setSummary] = useState<DataSummary | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [pendingFile, setPendingFile] = useState<File | null>(null)
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState<{ tone: 'success' | 'error'; text: string } | null>(null)

  useEffect(() => {
    getDataSummary().then(setSummary)
  }, [])

  async function refreshSummary() {
    setSummary(await getDataSummary())
  }

  async function handleExportJSON() {
    setBusy(true)
    try {
      await exportAllDataJSON()
    } finally {
      setBusy(false)
    }
  }

  async function handleExportCSV() {
    setBusy(true)
    try {
      await exportHistoryCSV()
    } finally {
      setBusy(false)
    }
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (file) setPendingFile(file)
  }

  async function handleConfirmImport() {
    const file = pendingFile
    setPendingFile(null)
    if (!file) return
    setBusy(true)
    setMessage(null)
    try {
      await importDataJSON(file)
      await refreshSummary()
      setMessage({ tone: 'success', text: 'Données importées avec succès.' })
    } catch (err) {
      setMessage({ tone: 'error', text: err instanceof Error ? err.message : 'Échec de l’import.' })
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="mx-auto max-w-md px-4 pt-safe pb-28 pt-4 animate-fade-in">
      <div className="mb-5 flex items-center gap-2">
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="rounded-full p-2 -ml-2 text-slate-400 active:bg-slate-100"
          aria-label="Retour"
        >
          <ChevronLeftIcon className="h-5 w-5" />
        </button>
        <h1 className="text-lg font-bold text-slate-900">Export / import des données</h1>
      </div>

      {summary && (
        <div className="mb-5 grid grid-cols-3 gap-2.5">
          <SummaryTile label="Séances" value={summary.workouts} />
          <SummaryTile label="Exercices" value={summary.exercises} />
          <SummaryTile label="Programmes" value={summary.templates} />
          <SummaryTile label="Mesures" value={summary.bodyMeasurements} />
          <SummaryTile label="Photos" value={summary.photos} />
        </div>
      )}

      {message && (
        <p
          className={`mb-4 rounded-xl px-3.5 py-2.5 text-sm font-medium ${
            message.tone === 'success' ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'
          }`}
        >
          {message.text}
        </p>
      )}

      <div className="space-y-3">
        <div className="rounded-2xl border border-slate-200 bg-surface p-4 shadow-sm">
          <p className="mb-1 text-sm font-semibold text-slate-700">Sauvegarde complète (JSON)</p>
          <p className="mb-3 text-xs text-slate-400">
            Toutes vos données (séances, exercices, programmes, mesures, photos). À conserver pour restaurer plus
            tard, sur cet appareil ou un autre.
          </p>
          <button
            type="button"
            onClick={handleExportJSON}
            disabled={busy}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-brand-600 py-3 font-semibold text-white active:bg-brand-700 disabled:opacity-60"
          >
            <DownloadIcon className="h-4 w-4" />
            Exporter en JSON
          </button>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-surface p-4 shadow-sm">
          <p className="mb-1 text-sm font-semibold text-slate-700">Historique (CSV)</p>
          <p className="mb-3 text-xs text-slate-400">
            Le détail des séries de vos séances, pour l'ouvrir dans un tableur. Ne contient ni les photos ni les
            mensurations.
          </p>
          <button
            type="button"
            onClick={handleExportCSV}
            disabled={busy}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-slate-100 py-3 font-semibold text-slate-700 active:bg-slate-200 disabled:opacity-60"
          >
            <DownloadIcon className="h-4 w-4" />
            Exporter en CSV
          </button>
        </div>

        <div className="rounded-2xl border border-red-200 bg-red-50 p-4">
          <p className="mb-1 text-sm font-semibold text-red-700">Importer des données</p>
          <p className="mb-3 text-xs text-red-600">
            Restaure une sauvegarde JSON exportée depuis Muscu Tracker. Cela remplace définitivement toutes les
            données actuellement sur cet appareil.
          </p>
          <input ref={fileInputRef} type="file" accept="application/json,.json" className="hidden" onChange={handleFileChange} />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={busy}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-red-600 py-3 font-semibold text-white active:bg-red-700 disabled:opacity-60"
          >
            <UploadIcon className="h-4 w-4" />
            Importer un fichier JSON
          </button>
        </div>
      </div>

      {pendingFile && (
        <ConfirmDialog
          title="Remplacer toutes les données ?"
          message={`Le fichier « ${pendingFile.name} » va remplacer définitivement toutes vos données actuelles (séances, exercices, programmes, mesures, photos). Cette action est irréversible.`}
          confirmLabel="Remplacer"
          danger
          onConfirm={handleConfirmImport}
          onCancel={() => setPendingFile(null)}
        />
      )}
    </div>
  )
}

function SummaryTile({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-surface px-2 py-3 text-center shadow-sm">
      <p className="text-lg font-bold text-slate-900">{value}</p>
      <p className="text-[11px] font-medium text-slate-400">{label}</p>
    </div>
  )
}
