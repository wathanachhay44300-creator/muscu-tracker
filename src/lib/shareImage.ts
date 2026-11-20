import { t } from '../i18n'
export interface BilanShareData {
  programName: string
  date: string
  exerciseCount: number
  setCount: number
  volumeLabel: string
  durationLabel: string
  prNames: string[]
}

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number): void {
  ctx.beginPath()
  ctx.moveTo(x + r, y)
  ctx.arcTo(x + w, y, x + w, y + h, r)
  ctx.arcTo(x + w, y + h, x, y + h, r)
  ctx.arcTo(x, y + h, x, y, r)
  ctx.arcTo(x, y, x + w, y, r)
  ctx.closePath()
}

const WIDTH = 1080
const HEIGHT = 1350

/** Reads a color token of the active theme (see src/theme/theme.css). */
function token(name: string): string {
  return getComputedStyle(document.documentElement).getPropertyValue(`--${name}`).trim() || '#000'
}

/** Draws a simple, legible summary card for the session, in the colors of
 * the active theme. */
export async function generateBilanImage(data: BilanShareData): Promise<Blob> {
  const T = {
    bg: token('bg'),
    accent: token('accent'),
    onAccent: token('on-accent'),
    surface: token('surface'),
    text: token('text'),
    muted: token('text-muted'),
    faint: token('text-faint'),
    hlSoft: token('highlight-soft'),
    hlInk: token('highlight-ink'),
  }
  const titleFont = token('font-title')
  const bodyFont = token('font-body')
  const numbersFont = token('font-numbers')
  const upperTitles = token('title-case') === 'uppercase'
  // Canvas text only uses fonts that are already loaded.
  await Promise.all(
    [`700 60px ${titleFont}`, `700 52px ${numbersFont}`, `400 30px ${bodyFont}`].map((f) =>
      document.fonts.load(f).catch(() => []),
    ),
  )

  const canvas = document.createElement('canvas')
  canvas.width = WIDTH
  canvas.height = HEIGHT
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('Canvas 2D context unavailable')

  ctx.fillStyle = T.bg
  ctx.fillRect(0, 0, WIDTH, HEIGHT)

  ctx.fillStyle = T.accent
  ctx.fillRect(0, 0, WIDTH, 170)
  ctx.fillStyle = T.onAccent
  ctx.font = `600 44px ${bodyFont}`
  ctx.fillText('💪 Muscu Tracker', 60, 105)

  ctx.fillStyle = T.text
  ctx.font = `700 60px ${titleFont}`
  wrapText(ctx, upperTitles ? data.programName.toUpperCase() : data.programName, 60, 280, WIDTH - 120, 68)
  ctx.fillStyle = T.muted
  ctx.font = `400 34px ${bodyFont}`
  ctx.fillText(data.date, 60, 345)

  const stats: [string, string][] = [
    [t('share.exercises'), String(data.exerciseCount)],
    [t('share.sets'), String(data.setCount)],
    [t('share.volume'), data.volumeLabel],
    [t('share.duration'), data.durationLabel],
  ]
  const gridTop = 430
  const cellW = 460
  const cellH = 150
  const gapX = 40
  const gapY = 24
  stats.forEach(([label, value], i) => {
    const col = i % 2
    const row = Math.floor(i / 2)
    const x = 60 + col * (cellW + gapX)
    const y = gridTop + row * (cellH + gapY)
    ctx.fillStyle = T.surface
    roundRect(ctx, x, y, cellW, cellH, 28)
    ctx.fill()
    ctx.fillStyle = T.text
    ctx.font = `700 52px ${numbersFont}`
    ctx.fillText(value, x + 32, y + 70)
    ctx.fillStyle = T.muted
    ctx.font = `400 30px ${bodyFont}`
    ctx.fillText(label, x + 32, y + 112)
  })

  let nextY = gridTop + 2 * (cellH + gapY) + 20
  if (data.prNames.length > 0) {
    const bannerH = 130
    ctx.fillStyle = T.hlSoft
    roundRect(ctx, 60, nextY, WIDTH - 120, bannerH, 28)
    ctx.fill()
    ctx.fillStyle = T.hlInk
    ctx.font = `700 36px ${bodyFont}`
    const prText =
      data.prNames.length === 1
        ? t('share.newRecord', { name: data.prNames[0] })
        : t('share.newRecords', { names: data.prNames.join(', ') })
    wrapText(ctx, prText, 90, nextY + 55, WIDTH - 180, 44)
    nextY += bannerH + 20
  }

  ctx.fillStyle = T.faint
  ctx.font = `400 26px ${bodyFont}`
  ctx.fillText(t('share.footer'), 60, HEIGHT - 50)

  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => (blob ? resolve(blob) : reject(new Error(t('share.failed')))), 'image/png')
  })
}

function wrapText(ctx: CanvasRenderingContext2D, text: string, x: number, y: number, maxWidth: number, lineHeight: number): void {
  const words = text.split(' ')
  let line = ''
  let curY = y
  for (const word of words) {
    const test = line ? `${line} ${word}` : word
    if (ctx.measureText(test).width > maxWidth && line) {
      ctx.fillText(line, x, curY)
      line = word
      curY += lineHeight
    } else {
      line = test
    }
  }
  ctx.fillText(line, x, curY)
}

/** Shares the image via the native share sheet when available (with a
 * downloadable file), falling back to a plain download otherwise. */
export async function shareOrDownloadImage(blob: Blob, filename: string, shareTitle: string): Promise<void> {
  const file = new File([blob], filename, { type: blob.type })
  const nav = navigator as Navigator & {
    canShare?: (data?: ShareData) => boolean
    share?: (data: ShareData) => Promise<void>
  }
  if (nav.canShare?.({ files: [file] }) && nav.share) {
    await nav.share({ files: [file], title: shareTitle })
    return
  }

  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  a.remove()
  URL.revokeObjectURL(url)
}
