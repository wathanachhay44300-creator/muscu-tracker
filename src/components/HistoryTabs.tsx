import { NavLink } from 'react-router-dom'
import { t } from '../i18n'

/** "Liste / Calendrier" switch at the top of the Historique tab. */
export function HistoryTabs() {
  const tab = ({ isActive }: { isActive: boolean }) =>
    `flex min-h-11 flex-1 items-center justify-center rounded-xl text-sm font-semibold ${
      isActive ? 'bg-accent text-on-accent' : 'text-muted active:bg-surface-4'
    }`
  return (
    <div className="mb-4 flex gap-1 rounded-2xl bg-surface-3 p-1" role="tablist" aria-label={t('historyTabs.label')}>
      <NavLink to="/historique" end className={tab}>
        {t('historyTabs.list')}
      </NavLink>
      <NavLink to="/historique/calendrier" className={tab}>
        {t('historyTabs.calendar')}
      </NavLink>
    </div>
  )
}
