import sharp from 'sharp'
import { mkdirSync } from 'node:fs'

mkdirSync('public/icons', { recursive: true })

const BRAND = '#4f46e5'

function dumbbell(scale, strokeScale = 1) {
  // Centered dumbbell glyph, coordinates in a 100x100 box, then scaled/translated.
  const sw = 7 * strokeScale
  return `
    <g transform="translate(${(100 - 100 * scale) / 2}, ${(100 - 100 * scale) / 2}) scale(${scale})"
       stroke="#ffffff" stroke-width="${sw}" stroke-linecap="round" stroke-linejoin="round" fill="none">
      <path d="M32 32 68 68"/>
      <path d="M26 38 38 26 46 34 34 46 Z" fill="#ffffff" stroke="none"/>
      <path d="M54 66 66 54 74 62 62 74 Z" fill="#ffffff" stroke="none"/>
      <path d="M20 44 26 38"/>
      <path d="M74 62 80 56"/>
    </g>
  `
}

function squareIcon({ radius }) {
  return `
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
    <rect width="100" height="100" rx="${radius}" fill="${BRAND}"/>
    ${dumbbell(0.72)}
  </svg>`
}

function maskableIcon() {
  // Full-bleed background, glyph kept within the ~80% safe-zone circle.
  return `
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
    <rect width="100" height="100" fill="${BRAND}"/>
    ${dumbbell(0.5)}
  </svg>`
}

const targets = [
  { file: 'public/icons/icon-192.png', size: 192, svg: squareIcon({ radius: 22 }) },
  { file: 'public/icons/icon-512.png', size: 512, svg: squareIcon({ radius: 22 }) },
  { file: 'public/icons/icon-maskable-512.png', size: 512, svg: maskableIcon() },
  { file: 'public/apple-touch-icon.png', size: 180, svg: squareIcon({ radius: 22 }) },
]

for (const t of targets) {
  await sharp(Buffer.from(t.svg), { density: 384 })
    .resize(t.size, t.size)
    .png()
    .toFile(t.file)
  console.log('wrote', t.file)
}
