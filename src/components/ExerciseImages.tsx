import { useState } from 'react'
import { createPortal } from 'react-dom'
import { EXERCISE_IMAGES } from '../data/exerciseImages'
import { XIcon } from './Icons'

const LABELS = ['Départ', 'Arrivée']

function imageUrl(folder: string, index: number): string {
  return `${import.meta.env.BASE_URL}exercise-images/${folder}/${index}.webp`
}

/**
 * Start / end position photos for an exercise, when the free image set has
 * one (otherwise nothing is rendered: the sheet just keeps the muscle
 * diagram). Lazy-loaded, with a placeholder while loading, a clean fallback if
 * a file can't be fetched, and tap-to-zoom.
 */
export function ExerciseImages({ seedId, name }: { seedId: string; name: string }) {
  const entry = EXERCISE_IMAGES[seedId]
  const [failed, setFailed] = useState<Record<number, boolean>>({})
  const [zoomed, setZoomed] = useState<number | null>(null)
  if (!entry) return null

  const indexes = Array.from({ length: entry.count }, (_, i) => i)
  const allFailed = indexes.every((i) => failed[i])

  return (
    <section>
      <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-400">Démonstration</h3>
      {allFailed ? (
        <p className="rounded-xl bg-slate-50 px-3 py-4 text-center text-sm text-slate-400">
          Images indisponibles pour le moment.
        </p>
      ) : (
        <div className="grid grid-cols-2 gap-2">
          {indexes.map((i) =>
            failed[i] ? null : (
              <Thumb
                key={i}
                src={imageUrl(entry.folder, i)}
                alt={`${name} : position ${LABELS[i]?.toLowerCase() ?? i + 1}`}
                label={LABELS[i] ?? String(i + 1)}
                onZoom={() => setZoomed(i)}
                onError={() => setFailed((f) => ({ ...f, [i]: true }))}
              />
            ),
          )}
        </div>
      )}
      <p className="mt-1.5 text-[11px] text-slate-400">Images : free-exercise-db (domaine public)</p>

      {zoomed != null &&
        createPortal(
          <div
            className="fixed inset-0 z-[70] flex items-center justify-center bg-black/90 p-3 animate-fade-in-backdrop"
            onClick={() => setZoomed(null)}
            onPointerDown={(e) => e.stopPropagation()}
          >
            <img
              src={imageUrl(entry.folder, zoomed)}
              alt={`${name} : position ${LABELS[zoomed]?.toLowerCase() ?? zoomed + 1}, agrandie`}
              className="max-h-full max-w-full rounded-lg object-contain"
            />
            <button
              type="button"
              aria-label="Fermer l'image"
              className="absolute right-3 top-3 rounded-full bg-black/50 p-2.5 text-white"
              onClick={() => setZoomed(null)}
              style={{ marginTop: 'env(safe-area-inset-top)' }}
            >
              <XIcon className="h-6 w-6" />
            </button>
          </div>,
          document.body,
        )}
    </section>
  )
}

function Thumb({
  src,
  alt,
  label,
  onZoom,
  onError,
}: {
  src: string
  alt: string
  label: string
  onZoom: () => void
  onError: () => void
}) {
  const [loaded, setLoaded] = useState(false)
  return (
    <button
      type="button"
      onClick={onZoom}
      aria-label={`Agrandir : ${alt}`}
      className="relative aspect-[3/2] overflow-hidden rounded-xl bg-slate-100 active:opacity-80"
    >
      {!loaded && <span className="absolute inset-0 animate-pulse bg-slate-200" aria-hidden="true" />}
      <img
        src={src}
        alt={alt}
        loading="lazy"
        decoding="async"
        draggable={false}
        onLoad={() => setLoaded(true)}
        onError={onError}
        className={`h-full w-full object-cover transition-opacity duration-200 ${loaded ? 'opacity-100' : 'opacity-0'}`}
      />
      <span className="absolute bottom-1.5 left-1.5 rounded-full bg-black/55 px-2 py-0.5 text-[10px] font-semibold text-white">
        {label}
      </span>
    </button>
  )
}
