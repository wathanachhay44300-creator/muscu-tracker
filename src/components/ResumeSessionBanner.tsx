import { useEffect } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { useActiveSession } from '../hooks/useActiveSession'
import { ChevronRightIcon } from './Icons'
import { t } from '../i18n'

/**
 * "Séance en cours – Reprendre" strip at the top of every tab while today's
 * session is unfinished. Hidden in session mode itself, on the summary, and
 * on the home screen, whose main card already offers "Reprendre".
 */
export function ResumeSessionBanner() {
  const active = useActiveSession()
  const { pathname } = useLocation()
  const show = !!active && pathname !== '/' && !pathname.startsWith('/seance') && !pathname.startsWith('/bilan')

  // Lets screens drop the notch inset and offset their own sticky headers (see index.css).
  useEffect(() => {
    document.documentElement.classList.toggle('has-session-banner', show)
    return () => document.documentElement.classList.remove('has-session-banner')
  }, [show])

  if (!show) return null
  return (
    <Link
      to="/seance"
      className="sticky top-0 z-30 block bg-accent px-4 text-on-accent active:bg-accent-hover"
      style={{ paddingTop: 'env(safe-area-inset-top)' }}
    >
      <span className="mx-auto flex h-[var(--session-banner-h)] max-w-md items-center gap-2">
        <span className="h-2 w-2 shrink-0 animate-pulse rounded-full bg-on-accent" aria-hidden="true" />
        <span className="min-w-0 flex-1 truncate text-sm font-semibold">
          {t('common.inProgressBanner')} · <span className="font-normal">{active.title}</span>
        </span>
        <span className="flex items-center text-sm font-bold">
          {t('common.resume')}
          <ChevronRightIcon className="h-4 w-4" />
        </span>
      </span>
    </Link>
  )
}
