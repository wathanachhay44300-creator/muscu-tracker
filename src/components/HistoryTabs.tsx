import { NavLink } from 'react-router-dom'

/** "Liste / Calendrier" switch at the top of the Historique tab. */
export function HistoryTabs() {
  const tab = ({ isActive }: { isActive: boolean }) =>
    `flex min-h-11 flex-1 items-center justify-center rounded-xl text-sm font-semibold ${
      isActive ? 'bg-accent text-on-accent' : 'text-muted active:bg-surface-4'
    }`
  return (
    <div className="mb-4 flex gap-1 rounded-2xl bg-surface-3 p-1" role="tablist" aria-label="Affichage de l'historique">
      <NavLink to="/historique" end className={tab}>
        Liste
      </NavLink>
      <NavLink to="/historique/calendrier" className={tab}>
        Calendrier
      </NavLink>
    </div>
  )
}
