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

/** Draws a simple, legible summary card for the session — always in a
 * light theme regardless of the app's own theme, since it's meant to be
 * shared and read outside the app. */
export async function generateBilanImage(data: BilanShareData): Promise<Blob> {
  const canvas = document.createElement('canvas')
  canvas.width = WIDTH
  canvas.height = HEIGHT
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('Canvas 2D context unavailable')

  ctx.fillStyle = '#f8fafc'
  ctx.fillRect(0, 0, WIDTH, HEIGHT)

  ctx.fillStyle = '#4f46e5'
  ctx.fillRect(0, 0, WIDTH, 170)
  ctx.fillStyle = '#ffffff'
  ctx.font = '600 44px system-ui, sans-serif'
  ctx.fillText('💪 Muscu Tracker', 60, 105)

  ctx.fillStyle = '#0f172a'
  ctx.font = '700 60px system-ui, sans-serif'
  wrapText(ctx, data.programName, 60, 280, WIDTH - 120, 68)
  ctx.fillStyle = '#64748b'
  ctx.font = '400 34px system-ui, sans-serif'
  ctx.fillText(data.date, 60, 345)

  const stats: [string, string][] = [
    ['Exercices', String(data.exerciseCount)],
    ['Séries', String(data.setCount)],
    ['Volume', data.volumeLabel],
    ['Durée', data.durationLabel],
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
    ctx.fillStyle = '#ffffff'
    roundRect(ctx, x, y, cellW, cellH, 28)
    ctx.fill()
    ctx.fillStyle = '#0f172a'
    ctx.font = '700 52px system-ui, sans-serif'
    ctx.fillText(value, x + 32, y + 70)
    ctx.fillStyle = '#94a3b8'
    ctx.font = '400 30px system-ui, sans-serif'
    ctx.fillText(label, x + 32, y + 112)
  })

  let nextY = gridTop + 2 * (cellH + gapY) + 20
  if (data.prNames.length > 0) {
    const bannerH = 130
    ctx.fillStyle = '#fffbeb'
    roundRect(ctx, 60, nextY, WIDTH - 120, bannerH, 28)
    ctx.fill()
    ctx.fillStyle = '#b45309'
    ctx.font = '700 36px system-ui, sans-serif'
    const prText =
      data.prNames.length === 1
        ? `🏆 Nouveau record : ${data.prNames[0]}`
        : `🏆 Nouveaux records : ${data.prNames.join(', ')}`
    wrapText(ctx, prText, 90, nextY + 55, WIDTH - 180, 44)
    nextY += bannerH + 20
  }

  ctx.fillStyle = '#cbd5e1'
  ctx.font = '400 26px system-ui, sans-serif'
  ctx.fillText('Suivi avec Muscu Tracker', 60, HEIGHT - 50)

  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => (blob ? resolve(blob) : reject(new Error('Échec de génération de l’image'))), 'image/png')
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
