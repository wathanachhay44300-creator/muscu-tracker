import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useActiveSession } from '../hooks/useActiveSession'
import { useHomeStats } from '../hooks/useHomeStats'
import { useTemplates } from '../hooks/useTemplates'
import { getOrCreateWorkout } from '../lib/workoutActions'
import { startWorkoutFromPreviousSession, startWorkoutFromTemplate } from '../lib/sessionStart'
import { relativeDateLabel, todayISO } from '../lib/date'
import { formatWeight } from '../lib/stats'
import { formatKg } from '../lib/tracking'
import { DuplicateSessionSheet } from '../components/DuplicateSessionSheet'
import { CheckIcon, ChevronRightIcon, CopyIcon, PlayIcon, PlusIcon, SettingsIcon, StarIcon } from '../components/Icons'

const WEEKDAYS_LONG = ['dimanche', 'lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi']
const MONTHS_LONG = ['janvier', 'février', 'mars', 'avril', 'mai', 'juin', 'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre']
const WEEK_LETTERS = ['L', 'M', 'M', 'J', 'V', 'S', 'D']

function longDate(iso: string): string {
  const [y, m, d] = iso.split('-').map(Number)
  const date = new Date(y, m - 1, d)
  return `${WEEKDAYS_LONG[date.getDay()]} ${d} ${MONTHS_LONG[m - 1]}`
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
          <h1 className="mt-0.5 !text-[2rem] leading-none text-ink">Aujourd'hui</h1>
        </div>
        <Link
          to="/reglages"
          aria-label="Réglages"
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-surface-3 text-ink-2 active:bg-surface-4"
        >
          <SettingsIcon className="h-5 w-5" />
        </Link>
      </header>

      {/* Hero: resume the session in progress, or start a new one. */}
      <section className="mb-6 rounded-3xl bg-accent p-5 text-on-accent">
        {active ? (
          <>
            <p className="text-xs font-bold uppercase tracking-wide opacity-75">Séance en cours</p>
            <p className="font-display mt-1 text-[1.6rem] leading-tight">{active.title}</p>
            <p className="mt-1 text-sm font-medium opacity-80">
              {active.exerciseCount} exercice{active.exerciseCount > 1 ? 's' : ''} · {active.setCount} série
              {active.setCount > 1 ? 's' : ''}
            </p>
            <button
              type="button"
              onClick={() => navigate('/seance')}
              className="mt-4 flex min-h-14 w-full items-center justify-center gap-2 rounded-2xl bg-on-accent text-base font-bold text-accent active:opacity-90"
            >
              <PlayIcon className="h-4 w-4" />
              Reprendre
            </button>
          </>
        ) : (
          <>
            <p className="text-xs font-bold uppercase tracking-wide opacity-75">Nouvelle séance</p>
            <p className="font-display mt-1 text-[1.6rem] leading-tight">Prêt ?</p>
            <p className="mt-1 text-sm font-medium opacity-80">
              Séance libre, ou démarre un de tes programmes ci-dessous.
            </p>
            <button
              type="button"
              disabled={starting}
              onClick={() => start(() => getOrCreateWorkout(today))}
              className="mt-4 flex min-h-14 w-full items-center justify-center gap-2 rounded-2xl bg-on-accent text-base font-bold text-accent active:opacity-90 disabled:opacity-60"
            >
              <PlayIcon className="h-4 w-4" />
              Séance libre
            </button>
            <button
              type="button"
              disabled={starting}
              onClick={() => setDuplicating(true)}
              className="mt-2 flex min-h-12 w-full items-center justify-center gap-2 rounded-2xl border-2 border-on-accent/40 text-sm font-semibold active:bg-on-accent/10 disabled:opacity-60"
            >
              <CopyIcon className="h-4 w-4" />
              Dupliquer une séance
            </button>
          </>
        )}
      </section>

      {/* Programs */}
      <section className="mb-6">
        <div className="mb-2 flex items-center justify-between px-1">
          <h2 className="text-ink">Mes programmes</h2>
          <Link to="/programmes" className="flex min-h-11 items-center px-1 text-sm font-semibold text-accent-ink">
            Tout voir
          </Link>
        </div>
        <div className="-mx-4 flex gap-2.5 overflow-x-auto px-4 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {templates?.map(({ template, exerciseCount }) => (
            <div key={template.id} className="flex w-40 shrink-0 flex-col rounded-2xl border border-line bg-surface p-3.5">
              <Link to={`/programmes/${template.id}`} className="min-h-[3.25rem] flex-1 active:opacity-70">
                <p className="font-exercise line-clamp-2 text-[1.05rem] leading-tight text-ink">{template.name}</p>
                <p className="mt-0.5 text-xs text-muted">
                  {exerciseCount} exercice{exerciseCount > 1 ? 's' : ''}
                </p>
              </Link>
              {!active && exerciseCount > 0 && (
                <button
                  type="button"
                  disabled={starting}
                  onClick={() => start(() => startWorkoutFromTemplate(today, template.id!))}
                  className="mt-2.5 flex min-h-11 items-center justify-center gap-1.5 rounded-xl bg-accent text-sm font-bold text-on-accent active:bg-accent-hover disabled:opacity-60"
                >
                  <PlayIcon className="h-3.5 w-3.5" />
                  Commencer
                </button>
              )}
            </div>
          ))}
          <Link
            to="/programmes?nouveau=1"
            className="flex w-28 shrink-0 flex-col items-center justify-center gap-1.5 rounded-2xl border border-dashed border-line-strong text-sm font-semibold text-muted active:bg-surface-3"
          >
            <PlusIcon className="h-5 w-5" />
            Nouveau
          </Link>
        </div>
      </section>

      {/* This week */}
      {stats && (
        <section className="mb-6">
          <div className="mb-2 flex items-center justify-between px-1">
            <h2 className="text-ink">Cette semaine</h2>
            <p className="text-sm font-semibold text-muted">
              {stats.sessionsThisWeek} séance{stats.sessionsThisWeek > 1 ? 's' : ''}
            </p>
          </div>
          <Link
            to="/historique/calendrier"
            aria-label="Voir le calendrier"
            className="grid grid-cols-7 gap-1 rounded-2xl border border-line bg-surface px-2 py-3 active:bg-surface-2"
          >
            {stats.week.map((d, i) => {
              const isToday = d.date === today
              return (
                <div key={d.date} className="flex flex-col items-center gap-1.5">
                  <span className={`text-[11px] font-semibold ${isToday ? 'text-accent-ink' : 'text-muted'}`}>
                    {WEEK_LETTERS[i]}
                  </span>
                  <span
                    className={`flex h-9 w-9 items-center justify-center rounded-full ${
                      d.trained ? 'bg-accent text-on-accent' : 'bg-surface-3 text-faint'
                    } ${isToday ? 'ring-2 ring-accent ring-offset-2 ring-offset-surface' : ''}`}
                    aria-label={`${WEEKDAYS_LONG[(i + 1) % 7]}${d.trained ? ' : entraîné' : ''}`}
                  >
                    {d.trained ? <CheckIcon className="h-4 w-4" strokeWidth={3} /> : null}
                  </span>
                </div>
              )
            })}
          </Link>

          <div className="mt-2.5 grid grid-cols-2 gap-2.5">
            <div className="rounded-2xl border border-line bg-surface px-4 py-3">
              <p className="font-numbers text-[1.9rem] font-bold leading-none text-ink">{stats.setsThisWeek}</p>
              <p className="mt-1 text-xs font-medium text-muted">Séries cette semaine</p>
            </div>
            <Link to="/corps" className="rounded-2xl border border-line bg-surface px-4 py-3 active:bg-surface-2">
              <p className="font-numbers text-[1.9rem] font-bold leading-none text-ink">
                {stats.weightAvg7 != null ? formatKg(stats.weightAvg7) : '—'}
                {stats.weightAvg7 != null && <span className="ml-1 text-base text-muted">kg</span>}
              </p>
              <p className="mt-1 text-xs font-medium text-muted">Poids moyen 7 j</p>
            </Link>
          </div>
        </section>
      )}

      {/* Latest record */}
      {stats?.latestRecord && (
        <section>
          <h2 className="mb-2 px-1 text-ink">Dernier record</h2>
          <Link
            to={`/exercices/${stats.latestRecord.exerciseId}`}
            className="flex items-center gap-3 rounded-2xl border border-highlight-line bg-highlight-soft px-4 py-3.5 active:opacity-80"
          >
            <StarIcon className="pr-star-glow h-6 w-6 shrink-0 text-highlight" />
            <div className="min-w-0 flex-1">
              <p className="font-exercise truncate text-[1.05rem] text-ink">{stats.latestRecord.exerciseName}</p>
              <p className="text-sm text-ink-2">
                <span className="font-numbers font-bold text-highlight-ink">
                  {formatWeight(stats.latestRecord.weight).replace('.', ',')} kg × {stats.latestRecord.reps}
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
