import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { usePreferences } from '../hooks/usePreferences'
import { setHapticsEnabled, setSoundEnabled } from '../lib/settingsActions'
import { hapticLight } from '../lib/haptics'
import {
  getNotificationSupport,
  requestNotificationPermission,
  type NotificationSupport,
} from '../lib/notifications'
import { ChevronLeftIcon } from '../components/Icons'

function Toggle({ on, onChange, label }: { on: boolean; onChange: (v: boolean) => void; label: string }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={on}
      aria-label={label}
      onClick={() => onChange(!on)}
      className={`relative h-7 w-12 shrink-0 rounded-full transition-colors ${on ? 'bg-brand-600' : 'bg-slate-300'}`}
    >
      <span
        className={`absolute left-0.5 top-0.5 h-6 w-6 rounded-full bg-white shadow transition-transform ${
          on ? 'translate-x-5' : 'translate-x-0'
        }`}
      />
    </button>
  )
}

const NOTIF_LABEL: Record<NotificationSupport, string> = {
  unsupported: 'Non pris en charge par ce navigateur.',
  default: 'Pas encore autorisées.',
  granted: 'Autorisées.',
  denied: 'Bloquées — à réactiver dans les réglages du navigateur/téléphone.',
}

export function ReglagesScreen() {
  const navigate = useNavigate()
  const preferences = usePreferences()
  const [notif, setNotif] = useState<NotificationSupport>(() => getNotificationSupport())

  return (
    <div className="mx-auto max-w-md px-4 pt-safe pb-28 pt-4 animate-fade-in">
      <div className="mb-5 flex items-center gap-2">
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="-ml-2 rounded-full p-2 text-slate-400 active:bg-slate-100"
          aria-label="Retour"
        >
          <ChevronLeftIcon className="h-5 w-5" />
        </button>
        <h1 className="text-lg font-bold text-slate-900">Réglages</h1>
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-surface p-4 shadow-sm">
          <div>
            <p className="font-semibold text-slate-800">Vibrations</p>
            <p className="text-xs text-slate-400">
              Série ajoutée, menu contextuel, fin du repos, fin de séance, record. Désactive tout d'un coup.
            </p>
          </div>
          <Toggle
            on={!!preferences?.hapticsEnabled}
            label="Vibrations"
            onChange={(v) => {
              setHapticsEnabled(v)
              hapticLight(v)
            }}
          />
        </div>

        <div className="flex items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-surface p-4 shadow-sm">
          <div>
            <p className="font-semibold text-slate-800">Sons</p>
            <p className="text-xs text-slate-400">Jingle de record et bip de fin de repos.</p>
          </div>
          <Toggle on={!!preferences?.soundEnabled} label="Sons" onChange={setSoundEnabled} />
        </div>

        <div className="rounded-2xl border border-slate-200 bg-surface p-4 shadow-sm">
          <p className="font-semibold text-slate-800">Notification de fin de repos</p>
          <p className="mb-3 text-xs text-slate-400">{NOTIF_LABEL[notif]}</p>
          {(notif === 'default' || notif === 'denied') && (
            <button
              type="button"
              disabled={notif === 'denied'}
              onClick={async () => setNotif(await requestNotificationPermission())}
              className="w-full rounded-xl bg-brand-600 py-2.5 text-sm font-semibold text-white active:bg-brand-700 disabled:opacity-40"
            >
              Autoriser les notifications
            </button>
          )}
          <p className="mt-3 rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-700">
            Limite technique : l'app n'a pas de serveur, la notification part depuis l'app elle-même. Elle
            fonctionne app ouverte ou en arrière-plan, mais un téléphone verrouillé peut suspendre l'app et la
            retarder — surtout sur iPhone, où les notifications web exigent d'ajouter l'app à l'écran d'accueil
            (iOS 16.4+). Une notification 100 % fiable app fermée n'est pas garantie.
          </p>
        </div>
      </div>
    </div>
  )
}
