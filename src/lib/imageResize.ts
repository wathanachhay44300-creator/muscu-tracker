const MAX_DIMENSION = 1280
const JPEG_QUALITY = 0.82

/**
 * Downscales and re-encodes an image file as a compressed JPEG before it's
 * stored in IndexedDB — local storage has limits, and progress photos taken
 * on a modern phone camera are otherwise several megabytes each.
 */
export async function resizeImageFile(file: File | Blob): Promise<Blob> {
  const bitmap = await createImageBitmap(file)
  const scale = Math.min(1, MAX_DIMENSION / Math.max(bitmap.width, bitmap.height))
  const width = Math.round(bitmap.width * scale)
  const height = Math.round(bitmap.height * scale)

  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('Canvas 2D context unavailable')
  ctx.drawImage(bitmap, 0, 0, width, height)
  bitmap.close()

  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error('Image encoding failed'))),
      'image/jpeg',
      JPEG_QUALITY,
    )
  })
}
