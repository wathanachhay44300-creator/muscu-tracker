import { NavLink, useLocation } from 'react-router-dom'
import { CalendarIcon, HomeIcon, ListIcon, TrendIcon } from './Icons'
import { t } from '../i18n'

/** Four tabs; each also lights up for the screens reached from it. */
const TABS = [
  { to: '/', key: 'today', icon: HomeIcon, match: ['/', '/programmes', '/reglages', '/donnees'] },
  { to: '/historique', key: 'history', icon: CalendarIcon, match: ['/historique', '/bilan'] },
  { to: '/progres', key: 'progress', icon: TrendIcon, match: ['/progres', '/suivi', '/corps'] },
  { to: '/exercices', key: 'exercises', icon: ListIcon, match: ['/exercices'] },
]

function isActive(pathname: string, match: string[]): boolean {
  return match.some((m) => (m === '/' ? pathname === '/' : pathname === m || pathname.startsWith(`${m}/`)))
}

export function BottomNav() {
  const { pathname } = useLocation()

  return (
    <nav data-tab-bar className="fixed inset-x-0 bottom-0 z-30 border-t border-line bg-nav/95 pb-safe backdrop-blur">
      <div className="mx-auto flex max-w-md">
        {TABS.map((tab) => {
          const active = isActive(pathname, tab.match)
          return (
            <NavLink
              key={tab.to}
              to={tab.to}
              aria-current={active ? 'page' : undefined}
              className={`flex min-h-14 flex-1 flex-col items-center justify-center gap-0.5 pt-1.5 text-[11px] font-semibold transition-colors ${
                active ? 'text-nav-active' : 'text-muted'
              }`}
            >
              <span className="relative flex">
                {/* Pill behind the active icon; transparent unless the theme sets --tab-pill. */}
                {active && (
                  <span
                    aria-hidden="true"
                    className="absolute -inset-x-3.5 -inset-y-0.5 rounded-full"
                    style={{ background: 'var(--tab-pill)' }}
                  />
                )}
                <tab.icon className="relative h-6 w-6" strokeWidth={active ? 2.4 : 1.9} />
              </span>
              {t(`nav.${tab.key}` as 'nav.today' | 'nav.history' | 'nav.progress' | 'nav.exercises')}
            </NavLink>
          )
        })}
      </div>
    </nav>
  )
}
