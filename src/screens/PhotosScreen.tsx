import { useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useObjectURL, useProgressPhotos } from '../hooks/usePhotos'
import { addProgressPhoto, deleteProgressPhoto } from '../lib/photoActions'
import { ConfirmDialog } from '../components/ConfirmDialog'
import { CameraIcon, ChevronLeftIcon, PlusIcon, TrashIcon, XIcon } from '../components/Icons'
import { formatDateFr, relativeDateLabel, todayISO } from '../lib/date'
import type { ProgressPhoto } from '../types'

export function PhotosScreen() {
  const navigate = useNavigate()
  const photos = useProgressPhotos()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(false)
  const [lightboxPhoto, setLightboxPhoto] = useState<ProgressPhoto | null>(null)
  const [deletingId, setDeletingId] = useState<number | null>(null)

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    setUploading(true)
    try {
      await addProgressPhoto(todayISO(), file)
    } finally {
      setUploading(false)
    }
  }

  const groups = groupByDate(photos ?? [])

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
        <CameraIcon className="h-5 w-5 text-brand-500" />
        <h1 className="text-lg font-bold text-slate-900">Photos de progression</h1>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={handleFileChange}
      />

      <button
        type="button"
        onClick={() => fileInputRef.current?.click()}
        disabled={uploading}
        className="mb-5 flex w-full items-center justify-center gap-2 rounded-2xl bg-brand-600 py-4 font-semibold text-white shadow-sm active:bg-brand-700 disabled:opacity-60"
      >
        <PlusIcon className="h-5 w-5" />
        {uploading ? 'Ajout en cours…' : "Ajouter une photo (aujourd'hui)"}
      </button>

      {groups.length === 0 && (
        <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-slate-300 px-4 py-14 text-center">
          <CameraIcon className="h-10 w-10 text-slate-300" />
          <p className="font-medium text-slate-600">Aucune photo pour l'instant</p>
          <p className="text-sm text-slate-400">
            Vos photos de progression seront stockées uniquement sur cet appareil.
          </p>
        </div>
      )}

      <div className="space-y-6">
        {groups.map(([date, items]) => (
          <div key={date}>
            <p className="mb-2 text-sm font-semibold text-slate-700">{relativeDateLabel(date)}</p>
            <div className="grid grid-cols-3 gap-2">
              {items.map((photo) => (
                <PhotoThumb key={photo.id} photo={photo} onOpen={() => setLightboxPhoto(photo)} />
              ))}
            </div>
          </div>
        ))}
      </div>

      {lightboxPhoto && (
        <Lightbox
          photo={lightboxPhoto}
          onClose={() => setLightboxPhoto(null)}
          onDelete={() => {
            setDeletingId(lightboxPhoto.id!)
            setLightboxPhoto(null)
          }}
        />
      )}

      {deletingId != null && (
        <ConfirmDialog
          title="Supprimer cette photo ?"
          message="Cette photo sera définitivement supprimée de cet appareil."
          confirmLabel="Supprimer"
          danger
          onConfirm={() => {
            deleteProgressPhoto(deletingId)
            setDeletingId(null)
          }}
          onCancel={() => setDeletingId(null)}
        />
      )}
    </div>
  )
}

function PhotoThumb({ photo, onOpen }: { photo: ProgressPhoto; onOpen: () => void }) {
  const url = useObjectURL(photo.blob)
  return (
    <button
      type="button"
      onClick={onOpen}
      className="aspect-square overflow-hidden rounded-xl bg-slate-100"
      aria-label="Agrandir la photo"
    >
      {url && <img src={url} alt="" className="h-full w-full object-cover" />}
    </button>
  )
}

function Lightbox({
  photo,
  onClose,
  onDelete,
}: {
  photo: ProgressPhoto
  onClose: () => void
  onDelete: () => void
}) {
  const url = useObjectURL(photo.blob)
  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-black/90 animate-fade-in-backdrop" onClick={onClose}>
      <div className="flex items-center justify-between px-4 pt-safe">
        <p className="py-3 text-sm font-medium text-white">{formatDateFr(photo.date)}</p>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation()
              onDelete()
            }}
            className="rounded-full p-2.5 text-white active:bg-white/10"
            aria-label="Supprimer"
          >
            <TrashIcon className="h-5 w-5" />
          </button>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-2.5 text-white active:bg-white/10"
            aria-label="Fermer"
          >
            <XIcon className="h-5 w-5" />
          </button>
        </div>
      </div>
      <div className="flex flex-1 items-center justify-center p-4">
        {url && <img src={url} alt="" className="max-h-full max-w-full rounded-lg object-contain" />}
      </div>
    </div>
  )
}

function groupByDate(photos: ProgressPhoto[]): [string, ProgressPhoto[]][] {
  const map = new Map<string, ProgressPhoto[]>()
  for (const photo of photos) {
    const list = map.get(photo.date) ?? []
    list.push(photo)
    map.set(photo.date, list)
  }
  return [...map.entries()]
}
