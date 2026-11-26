import { useElapsedTime } from '../hooks/useElapsedTime'
import { HeartIcon, KawaiiOnly, PlainOnly } from './kawaii/Kawaii'
import { JokerOnly, NoJoker, SuitIcon } from './joker/Joker'
import { DragonOnly, NoDragon, SealGlyph } from './dragon/Dragon'

/** "12:05" or "1:02:05" */
function formatChrono(ms: number): string {
  const total = Math.max(0, Math.floor(ms / 1000))
  const h = Math.floor(total / 3600)
  const m = Math.floor((total % 3600) / 60)
  const s = String(total % 60).padStart(2, '0')
  return h > 0 ? `${h}:${String(m).padStart(2, '0')}:${s}` : `${m}:${s}`
}

/** Live session chrono in a pill (surface background, accent dot). */
export function SessionTimer({ startedAt, label }: { startedAt: number; label: string }) {
  const elapsed = useElapsedTime(startedAt, 1000)
  return (
    <span
      className="flex h-8 shrink-0 items-center gap-1.5 rounded-full border border-chrono-line bg-chrono px-3"
      style={{ boxShadow: 'var(--glow-chrono)' }}
      role="timer"
      aria-label={label}
    >
      <PlainOnly>
        <NoJoker>
          <NoDragon>
            <span className="h-2 w-2 rounded-full bg-chrono-dot" aria-hidden="true" />
          </NoDragon>
        </NoJoker>
      </PlainOnly>
      <JokerOnly>
        <SuitIcon suit="spade" className="h-3 w-3" style={{ color: 'var(--joker-magenta)' }} />
      </JokerOnly>
      <DragonOnly>
        <SealGlyph char="气" className="text-[17px]" style={{ color: 'var(--dragon-red)' }} />
      </DragonOnly>
      <KawaiiOnly>
        <HeartIcon className="h-3 w-3 text-accent" />
      </KawaiiOnly>
      <span className="font-numbers text-base font-bold tabular-nums text-chrono-ink">{formatChrono(elapsed)}</span>
    </span>
  )
}
