import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { exportAllDataJSON, exportHistoryCSV, getDataSummary, importDataJSON, type DataSummary } from '../lib/dataExport'
import { ConfirmDialog } from '../components/ConfirmDialog'
import { TrackingImportCard } from '../components/TrackingImportCard'
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
          className="rounded-full p-2 -ml-2 text-muted active:bg-surface-3"
          aria-label="Retour"
        >
          <ChevronLeftIcon className="h-5 w-5" />
        </button>
        <h1 className="text-lg font-bold text-ink">Export / import des données</h1>
      </div>

      {summary && (
        <div className="mb-5 grid grid-cols-2 gap-2.5">
          <SummaryTile label="Séances" value={summary.workouts} />
          <SummaryTile label="Exercices" value={summary.exercises} />
          <SummaryTile label="Programmes" value={summary.templates} />
          <SummaryTile label="Mesures" value={summary.bodyMeasurements} />
        </div>
      )}

      {message && (
        <p
          className={`mb-4 rounded-xl px-3.5 py-2.5 text-sm font-medium ${
            message.tone === 'success' ? 'bg-good-soft text-good-ink' : 'bg-danger-soft text-danger-ink'
          }`}
        >
          {message.text}
        </p>
      )}

      <div className="space-y-3">
        <div className="rounded-2xl border border-line bg-surface p-4 shadow-sm">
          <p className="mb-1 text-sm font-semibold text-ink-2">Sauvegarde complète (JSON)</p>
          <p className="mb-3 text-xs text-muted">
            Toutes vos données (séances, exercices, programmes, mesures, pas, poids, calories, objectif). À conserver pour restaurer plus
            tard, sur cet appareil ou un autre.
          </p>
          <button
            type="button"
            onClick={handleExportJSON}
            disabled={busy}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-accent py-3 font-semibold text-on-accent active:bg-accent-hover disabled:opacity-60"
          >
            <DownloadIcon className="h-4 w-4" />
            Exporter en JSON
          </button>
        </div>

        <div className="rounded-2xl border border-line bg-surface p-4 shadow-sm">
          <p className="mb-1 text-sm font-semibold text-ink-2">Historique (CSV)</p>
          <p className="mb-3 text-xs text-muted">
            Le détail des séries de vos séances, pour l'ouvrir dans un tableur. Ne contient pas les
            mensurations.
          </p>
          <button
            type="button"
            onClick={handleExportCSV}
            disabled={busy}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-surface-3 py-3 font-semibold text-ink-2 active:bg-surface-4 disabled:opacity-60"
          >
            <DownloadIcon className="h-4 w-4" />
            Exporter en CSV
          </button>
        </div>

        <TrackingImportCard />

        <div className="rounded-2xl border border-danger-line bg-danger-soft p-4">
          <p className="mb-1 text-sm font-semibold text-danger-ink">Importer des données</p>
          <p className="mb-3 text-xs text-danger-ink">
            Restaure une sauvegarde JSON exportée depuis Muscu Tracker. Cela remplace définitivement toutes les
            données actuellement sur cet appareil.
          </p>
          <input ref={fileInputRef} type="file" accept="application/json,.json" className="hidden" onChange={handleFileChange} />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={busy}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-danger py-3 font-semibold text-on-danger active:bg-danger disabled:opacity-60"
          >
            <UploadIcon className="h-4 w-4" />
            Importer un fichier JSON
          </button>
        </div>
      </div>

      {pendingFile && (
        <ConfirmDialog
          title="Remplacer toutes les données ?"
          message={`Le fichier « ${pendingFile.name} » va remplacer définitivement toutes vos données actuelles (séances, exercices, programmes, mesures). Cette action est irréversible.`}
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
    <div className="rounded-2xl border border-line bg-surface px-2 py-3 text-center shadow-sm">
      <p className="text-lg font-bold text-ink">{value}</p>
      <p className="text-[11px] font-medium text-muted">{label}</p>
    </div>
  )
}
