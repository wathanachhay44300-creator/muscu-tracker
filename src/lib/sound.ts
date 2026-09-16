let sharedContext: AudioContext | null = null

function getAudioContext(): AudioContext | null {
  if (typeof window === 'undefined') return null
  const AudioCtx = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
  if (!AudioCtx) return null
  if (!sharedContext) sharedContext = new AudioCtx()
  return sharedContext
}

/**
 * Short two-note "ding" chime for revealing a personal record — synthesized
 * on the fly so there's no audio asset to ship or load. Silently no-ops if
 * the Web Audio API is unavailable or blocked (e.g. no user gesture yet).
 */
export function playRecordChime(): void {
  const ctx = getAudioContext()
  if (!ctx) return
  if (ctx.state === 'suspended') void ctx.resume()

  const notes = [880, 1318.5] // A5, E6 — a bright, brief "level up" chime
  const now = ctx.currentTime
  for (const [i, freq] of notes.entries()) {
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.type = 'sine'
    osc.frequency.value = freq
    const start = now + i * 0.11
    gain.gain.setValueAtTime(0, start)
    gain.gain.linearRampToValueAtTime(0.15, start + 0.015)
    gain.gain.exponentialRampToValueAtTime(0.0001, start + 0.22)
    osc.connect(gain).connect(ctx.destination)
    osc.start(start)
    osc.stop(start + 0.25)
  }
}
