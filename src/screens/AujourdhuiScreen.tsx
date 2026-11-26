import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useActiveSession } from '../hooks/useActiveSession'
import { useHomeStats } from '../hooks/useHomeStats'
import { useTemplates } from '../hooks/useTemplates'
import { getOrCreateWorkout } from '../lib/workoutActions'
import { startWorkoutFromPreviousSession, startWorkoutFromTemplate } from '../lib/sessionStart'
import { relativeDateLabel, todayISO } from '../lib/date'
import { formatReps, formatWeight } from '../lib/stats'
import { formatKg } from '../lib/tracking'
import { DuplicateSessionSheet } from '../components/DuplicateSessionSheet'
import { CheckIcon, ChevronRightIcon, CopyIcon, PlayIcon, PlusIcon, SettingsIcon, StarIcon } from '../components/Icons'
import { getLocale, t, tn, tnThemed, tThemed } from '../i18n'
import { useThemeId } from '../hooks/useTheme'
import { BeltIcon, GloveIcon, NoRing, RingOnly, RopeBand, Spotlight } from '../components/ring/Ring'
import { JokerHeroDecor, JokerOnly, MiniCard, NoJoker, SuitIcon } from '../components/joker/Joker'
import { PROGRAM_SUITS } from '../lib/cards'
import { CoinIcon, DragonHeroDecor, DragonOnly, NoDragon, RecordTrophyIcon } from '../components/dragon/Dragon'
import { HeartIcon, KawaiiOnly, PlainOnly, Sprinkles } from '../components/kawaii/Kawaii'
import { Mochi } from '../components/kawaii/Mochi'

function longDate(iso: string): string {
  const [y, m, d] = iso.split('-').map(Number)
  return new Date(y, m - 1, d).toLocaleDateString(getLocale(), { weekday: 'long', day: 'numeric', month: 'long' })
}

/** Home tab: start or resume a session, programs, this week at a glance, latest record. */
export function AujourdhuiScreen() {
  const navigate = useNavigate()
  const active = useActiveSession()
  const templates = useTemplates()
  const stats = useHomeStats()
  const [starting, setStarting] = useState(false)
  const [duplicating, setDuplicating] = useState(false)
  const today = todayISO()
  const theme = useThemeId()

  async function start(run: () => Promise<unknown>) {
    if (starting) return
    setStarting(true)
    try {
      await run()
      navigate('/seance')
    } finally {
      setStarting(false)
    }
  }

  return (
    <div className="mx-auto max-w-md px-4 pt-safe pb-28 pt-4 animate-fade-in">
      <header className="mb-5 flex items-start justify-between gap-3 pt-2">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-muted">{longDate(today)}</p>
          <h1 className="mt-0.5 leading-none text-ink" style={{ fontSize: 'var(--home-title-size)' }}>
            {t('home.title')}
            <KawaiiOnly>
              <HeartIcon className="ml-1.5 inline-block h-5 w-5 align-[-0.05em] text-accent" />
            </KawaiiOnly>
          </h1>
        </div>
        <Link
          to="/reglages"
          aria-label={t('nav.settings')}
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-surface-3 text-ink-2 active:bg-surface-4"
        >
          <SettingsIcon className="h-5 w-5" />
        </Link>
      </header>

      {/* Hero: resume the session in progress, or start a new one. */}
      <section
        className="relative isolate mb-6 overflow-hidden rounded-3xl bg-hero p-5 text-on-hero"
        style={{ backgroundImage: 'var(--hero-image)', boxShadow: 'var(--hero-shadow)', padding: 'var(--hero-pad)' }}
      >
        <JokerHeroDecor />
        <DragonHeroDecor />
        <RingOnly>
          <span className="pointer-events-none absolute inset-0 -z-10 block">
            <Spotlight />
          </span>
          <RopeBand className="absolute inset-x-0 top-0" />
        </RingOnly>
        <KawaiiOnly>
          <Sprinkles className="pointer-events-none absolute right-2 top-2 h-16 w-[88px]" />
        </KawaiiOnly>
        {active ? (
          <>
            <div className="flex items-end gap-2">
              <div className="min-w-0 flex-1">
                <p
                  className="text-xs font-bold uppercase tracking-wide"
                  style={{ color: 'var(--hero-label)', opacity: 'var(--hero-label-opacity)' }}
                >{t('home.inProgress')}</p>
                <p className="font-display mt-1 leading-tight" style={{ fontSize: 'var(--hero-title-size)' }}>{active.title}</p>
                <p className="mt-1 text-sm font-medium" style={{ color: 'var(--hero-small)', opacity: 'var(--hero-small-opacity)' }}>
                  {tn('common.exercises', active.exerciseCount)} · {tn('common.sets', active.setCount)}
                </p>
              </div>
              <KawaiiOnly>
                <Mochi size={76} onAccent className="relative -mb-1 shrink-0" />
              </KawaiiOnly>
            </div>
            <button
              type="button"
              onClick={() => navigate('/seance')}
              className="mt-4 flex min-h-14 w-full items-center justify-center gap-2 rounded-2xl bg-hero-button text-base font-bold text-on-hero-button active:opacity-90"
              style={{ boxShadow: 'var(--glow-button)', width: 'calc(100% - var(--hero-actions-end))' }}
            >
              <PlayIcon className="h-4 w-4" />
              {t('home.resume')}
            </button>
          </>
        ) : (
          <>
            <div className="flex items-end gap-2">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <p
                  className="text-xs font-bold uppercase tracking-wide"
                  style={{ color: 'var(--hero-label)', opacity: 'var(--hero-label-opacity)' }}
                >{tThemed(theme, 'home.newWorkout')}</p>
                  <RingOnly>
                    <span className="rounded bg-accent px-1.5 py-0.5 text-[10px] font-extrabold uppercase tracking-wide text-on-accent">
                      {t('ring.tonight')}
                    </span>
                  </RingOnly>
                </div>
                <p className="font-display mt-1 leading-tight" style={{ fontSize: 'var(--hero-title-size)' }}>{t('home.ready')}</p>
                <p className="mt-1 text-sm font-medium" style={{ color: 'var(--hero-small)', opacity: 'var(--hero-small-opacity)' }}>
                  {t('home.freeOrProgram')}
                </p>
              </div>
              <KawaiiOnly>
                <Mochi size={76} onAccent className="relative -mb-1 shrink-0" />
              </KawaiiOnly>
            </div>
            <button
              type="button"
              disabled={starting}
              onClick={() => start(() => getOrCreateWorkout(today))}
              className="mt-4 flex min-h-14 w-full items-center justify-center gap-2 rounded-2xl bg-hero-button text-base font-bold text-on-hero-button active:opacity-90 disabled:opacity-60"
              style={{ boxShadow: 'var(--glow-button)', width: 'calc(100% - var(--hero-actions-end))' }}
            >
              <PlayIcon className="h-4 w-4" />
              {tThemed(theme, 'home.free')}
            </button>
            <button
              type="button"
              disabled={starting}
              onClick={() => setDuplicating(true)}
              className="mt-2 flex min-h-12 w-full items-center justify-center gap-2 rounded-2xl border-2 border-on-hero/40 text-sm font-semibold active:bg-on-hero/10 disabled:opacity-60"
              style={{ width: 'calc(100% - var(--hero-actions-end))' }}
            >
              <CopyIcon className="h-4 w-4" />
              {t('home.duplicateWorkout')}
            </button>
          </>
        )}
      </section>

      {/* Programs */}
      <section className="mb-6">
        <div className="mb-2 flex items-center justify-between px-1">
          <h2 className="text-ink">{t('home.programs')}</h2>
          <Link to="/programmes" className="flex min-h-11 items-center px-1 text-sm font-semibold text-link">
            {t('common.seeAll')}
          </Link>
        </div>
        <div className="-mx-4 flex gap-2.5 overflow-x-auto px-4 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {templates?.map(({ template, exerciseCount }, i) => (
            <div
              key={template.id}
              className="flex w-40 shrink-0 flex-col border border-line bg-surface p-3.5"
              style={{ borderRadius: 'var(--program-radius)' }}
            >
              <Link to={`/programmes/${template.id}`} className="min-h-[3.25rem] flex-1 active:opacity-70">
                <p className="font-exercise line-clamp-2 text-[1.05rem] leading-tight text-ink">
                  <JokerOnly>
                    <SuitIcon
                      suit={PROGRAM_SUITS[i % PROGRAM_SUITS.length].suit}
                      className="mr-1 inline-block h-3.5 w-3.5 align-[-0.1em]"
                      style={{ color: PROGRAM_SUITS[i % PROGRAM_SUITS.length].color }}
                    />
                  </JokerOnly>
                  {template.name}
                </p>
                <p className="mt-0.5 text-xs text-muted">
                  {tn('common.exercises', exerciseCount)}
                </p>
              </Link>
              {!active && exerciseCount > 0 && (
                <button
                  type="button"
                  disabled={starting}
                  onClick={() => start(() => startWorkoutFromTemplate(today, template.id!))}
                  className="mt-2.5 flex min-h-11 items-center justify-center gap-1.5 rounded-xl bg-accent text-sm font-bold text-on-accent active:bg-accent-hover disabled:opacity-60"
                  style={{ boxShadow: 'var(--glow-button)' }}
                >
                  <PlayIcon className="h-3.5 w-3.5" />
                  {tThemed(theme, 'home.start')}
                </button>
              )}
            </div>
          ))}
          <Link
            to="/programmes?nouveau=1"
            className="flex w-28 shrink-0 flex-col items-center justify-center gap-1.5 border border-dashed border-line-strong text-sm font-semibold text-muted active:bg-surface-3"
            style={{ borderRadius: 'var(--program-radius)' }}
          >
            <PlusIcon className="h-5 w-5" />
            {t('home.new')}
          </Link>
        </div>
      </section>

      {/* This week */}
      {stats && (
        <section className="mb-6">
          <div className="mb-2 flex items-center justify-between px-1">
            <h2 className="text-ink">{t('home.thisWeek')}</h2>
            <p className="text-sm font-semibold text-muted">
              {tnThemed(theme, 'common.sessions', stats.sessionsThisWeek)}
            </p>
          </div>
          <Link
            to="/historique/calendrier"
            aria-label={t('home.seeCalendar')}
            className="grid grid-cols-7 gap-1 rounded-2xl border border-line bg-surface px-2 py-3 active:bg-surface-2"
          >
            {stats.week.map((d, i) => {
              const isToday = d.date === today
              const dayLabel = `${new Date(`${d.date}T12:00:00`).toLocaleDateString(getLocale(), { weekday: 'long' })}${d.trained ? t('home.trained') : ''}`
              // Joker: trained days are cards, alternately ♠ and ♥.
              const trainedBefore = stats.week.slice(0, i).filter((x) => x.trained).length
              return (
                <div key={d.date} className="flex flex-col items-center gap-1.5">
                  <span className={`text-[11px] font-semibold ${isToday ? 'text-accent-ink' : 'text-muted'}`}>
                    {new Date(`${d.date}T12:00:00`).toLocaleDateString(getLocale(), { weekday: 'narrow' })}
                  </span>
                  <NoJoker>
                  <NoDragon>
                  <span
                    className={`flex h-9 w-9 items-center justify-center rounded-full ${
                      d.trained ? 'bg-week-done text-on-week-done' : 'bg-surface-3 text-faint'
                    } ${isToday ? 'ring-2 ring-week-today ring-offset-2 ring-offset-surface' : ''}`}
                    aria-label={dayLabel}
                  >
                    {d.trained ? (
                      <>
                        <PlainOnly>
                          <NoRing>
                            <CheckIcon className="h-4 w-4" strokeWidth={3} />
                          </NoRing>
                        </PlainOnly>
                        <RingOnly>
                          <GloveIcon className="h-5 w-5" />
                        </RingOnly>
                        <KawaiiOnly>
                          <HeartIcon className="h-4 w-4" />
                        </KawaiiOnly>
                      </>
                    ) : null}
                  </span>
                  </NoDragon>
                  </NoJoker>
                  <DragonOnly>
                    <span aria-label={dayLabel} role="img" className="flex">
                      {d.trained ? (
                        <span
                          className="flex h-9 w-9 rounded-full"
                          // Today: red ring around the coin.
                          style={isToday ? { boxShadow: '0 0 0 2px var(--surface), 0 0 0 4px var(--week-today)' } : undefined}
                        >
                          <CoinIcon className="h-9 w-9" />
                        </span>
                      ) : isToday ? (
                        <span
                          className="block h-9 w-9 rounded-full border-2"
                          style={{ borderColor: 'var(--dragon-red)', background: 'var(--dragon-red-soft)' }}
                        />
                      ) : (
                        <span className="block h-9 w-9 rounded-full border border-dotted border-line" />
                      )}
                    </span>
                  </DragonOnly>
                  <JokerOnly>
                    <span aria-label={dayLabel} role="img" className="flex">
                      {d.trained ? (
                        <MiniCard
                          suit={trainedBefore % 2 === 0 ? 'spade' : 'heart'}
                          red={trainedBefore % 2 === 1}
                          glow="magenta"
                          className="relative h-10 w-7"
                          // Today: violet ring around the card, kept with its glow (both are box-shadows).
                          style={
                            isToday
                              ? { boxShadow: '0 0 0 2px var(--surface), 0 0 0 4px var(--week-today), var(--joker-card-glow)' }
                              : undefined
                          }
                        />
                      ) : (
                        <span
                          className={`block h-10 w-7 rounded-lg ${isToday ? 'border-2 border-[var(--joker-violet)]' : 'bg-surface-2'}`}
                          style={isToday ? { background: 'var(--joker-today-bg)' } : undefined}
                        />
                      )}
                    </span>
                  </JokerOnly>
                </div>
              )
            })}
          </Link>
          <JokerOnly>
            <p className="mt-2 px-1 text-xs text-muted">{t('joker.hand')}</p>
          </JokerOnly>

          <div className="mt-2.5 grid grid-cols-2 gap-2.5">
            <div className="rounded-2xl border border-line bg-surface px-4 py-3">
              <p className="font-numbers text-[1.9rem] font-bold leading-none text-ink">{stats.setsThisWeek}</p>
              <p className="mt-1 text-xs font-medium text-muted">{t('home.setsThisWeek')}</p>
            </div>
            <Link to="/corps" className="rounded-2xl border border-line bg-surface px-4 py-3 active:bg-surface-2">
              <p className="font-numbers text-[1.9rem] font-bold leading-none text-ink">
                {stats.weightAvg7 != null ? formatKg(stats.weightAvg7) : '—'}
                {stats.weightAvg7 != null && <span className="ml-1 text-base text-muted">kg</span>}
              </p>
              <p className="mt-1 text-xs font-medium text-muted">{t('home.averageWeight')}</p>
            </Link>
          </div>
        </section>
      )}

      {/* Latest record */}
      {stats?.latestRecord && (
        <section>
          <h2 className="mb-2 px-1 text-record-title">{tThemed(theme, 'home.latestRecord')}</h2>
          <Link
            to={`/exercices/${stats.latestRecord.exerciseId}`}
            className="flex items-center gap-3 rounded-2xl border border-record-line bg-highlight-soft px-4 py-3.5 active:opacity-80"
          >
            <NoRing>
              <NoJoker>
                <NoDragon>
                  <StarIcon className="pr-star-glow h-6 w-6 shrink-0 text-highlight" />
                </NoDragon>
              </NoJoker>
            </NoRing>
            <DragonOnly>
              <RecordTrophyIcon className="h-10 w-10 shrink-0" />
            </DragonOnly>
            <JokerOnly>
              <MiniCard suit="heart" red ace glow="violet" className="relative h-[54px] w-10 shrink-0" />
            </JokerOnly>
            <RingOnly>
              <BeltIcon className="h-[34px] w-[54px] shrink-0" />
            </RingOnly>
            <div className="min-w-0 flex-1">
              <p className="font-exercise name-fit text-[1.05rem] text-ink">{stats.latestRecord.exerciseName}</p>
              <p className="text-sm text-ink-2">
                <span className="font-numbers font-bold text-highlight-ink">
                  {formatWeight(stats.latestRecord.weight)} kg × {formatReps(stats.latestRecord.reps)}
                </span>{' '}
                · {relativeDateLabel(stats.latestRecord.date).toLowerCase()}
              </p>
            </div>
            <ChevronRightIcon className="h-5 w-5 shrink-0 text-faint" />
          </Link>
        </section>
      )}

      {duplicating && (
        <DuplicateSessionSheet
          onSelect={(id) => {
            setDuplicating(false)
            void start(() => startWorkoutFromPreviousSession(today, id))
          }}
          onClose={() => setDuplicating(false)}
        />
      )}
    </div>
  )
}
