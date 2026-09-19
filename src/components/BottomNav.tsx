import { NavLink } from 'react-router-dom'
import { DumbbellIcon, CalendarIcon, ClipboardIcon, ListIcon } from './Icons'

const TABS = [
  { to: '/', label: 'Séance', icon: DumbbellIcon, end: true },
  { to: '/historique', label: 'Historique', icon: CalendarIcon, end: false },
  { to: '/exercices', label: 'Exercices', icon: ListIcon, end: false },
  { to: '/programmes', label: 'Programmes', icon: ClipboardIcon, end: false },
]

export function BottomNav() {
  return (
    <nav className="fixed inset-x-0 bottom-0 z-30 border-t border-slate-200 bg-surface/95 pb-safe backdrop-blur">
      <div className="mx-auto flex max-w-md">
        {TABS.map((tab) => (
          <NavLink
            key={tab.to}
            to={tab.to}
            end={tab.end}
            className={({ isActive }) =>
              `flex flex-1 flex-col items-center gap-0.5 py-2 pt-2.5 text-xs font-medium transition-colors ${
                isActive ? 'text-accent' : 'text-slate-400'
              }`
            }
          >
            {({ isActive }) => (
              <>
                <tab.icon className="h-6 w-6" strokeWidth={isActive ? 2.4 : 2} />
                {tab.label}
              </>
            )}
          </NavLink>
        ))}
      </div>
    </nav>
  )
}
