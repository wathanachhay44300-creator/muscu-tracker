import { useState } from 'react'
import { createPortal } from 'react-dom'
import { EXERCISE_IMAGES } from '../data/exerciseImages'
import { XIcon } from './Icons'
import { t } from '../i18n'

const labels = () => [t('images.start'), t('images.end')]

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
      <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted">{t('images.demo')}</h3>
      {allFailed ? (
        <p className="rounded-xl bg-surface-2 px-3 py-4 text-center text-sm text-muted">
          {t('images.unavailable')}
        </p>
      ) : (
        <div className="grid grid-cols-2 gap-2">
          {indexes.map((i) =>
            failed[i] ? null : (
              <Thumb
                key={i}
                src={imageUrl(entry.folder, i)}
                alt={t('images.alt', { name, pos: labels()[i]?.toLowerCase() ?? i + 1 })}
                label={labels()[i] ?? String(i + 1)}
                onZoom={() => setZoomed(i)}
                onError={() => setFailed((f) => ({ ...f, [i]: true }))}
              />
            ),
          )}
        </div>
      )}
      <p className="mt-1.5 text-[11px] text-muted">{t('images.credit')}</p>

      {zoomed != null &&
        createPortal(
          <div
            className="fixed inset-0 z-[70] flex items-center justify-center bg-scrim/90 p-3 animate-fade-in-backdrop"
            onClick={() => setZoomed(null)}
            onPointerDown={(e) => e.stopPropagation()}
          >
            <img
              src={imageUrl(entry.folder, zoomed)}
              alt={t('images.altZoomed', { name, pos: labels()[zoomed]?.toLowerCase() ?? zoomed + 1 })}
              className="max-h-full max-w-full rounded-lg object-contain"
            />
            <button
              type="button"
              aria-label={t('images.closeImage')}
              className="absolute right-3 top-3 rounded-full bg-scrim/50 p-2.5 text-on-scrim"
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
      aria-label={t('images.enlarge', { alt })}
      className="relative aspect-[3/2] overflow-hidden rounded-xl bg-surface-3 active:opacity-80"
    >
      {!loaded && <span className="absolute inset-0 animate-pulse bg-surface-4" aria-hidden="true" />}
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
      <span className="absolute bottom-1.5 left-1.5 rounded-full bg-scrim/55 px-2 py-0.5 text-[10px] font-semibold text-on-scrim">
        {label}
      </span>
    </button>
  )
}
