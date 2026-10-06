import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { usePreferences } from '../hooks/usePreferences'
import { setHapticsEnabled, setSoundEnabled, setWeightGoal } from '../lib/settingsActions'
import { ClipboardImport } from '../components/ClipboardImport'
import { todayISO } from '../lib/date'
import { shortDate } from '../lib/tracking'
import type { WeightGoal } from '../types'
import { hapticLight } from '../lib/haptics'
import {
  getNotificationSupport,
  requestNotificationPermission,
  type NotificationSupport,
} from '../lib/notifications'
import { ChevronLeftIcon, CopyIcon } from '../components/Icons'

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

const APP_URL = 'https://wathanachhay44300-creator.github.io/muscu-tracker/'

const GOALS: { key: WeightGoal; label: string }[] = [
  { key: 'loss', label: 'Perte' },
  { key: 'maintain', label: 'Maintien' },
  { key: 'gain', label: 'Prise' },
]

function GoalCard() {
  const preferences = usePreferences()
  if (!preferences) return null
  const { goal, goalRateKg } = preferences
  const rateLabel = `${goal === 'loss' ? '−' : '+'}${goalRateKg.toFixed(1).replace('.', ',')} kg / semaine`
  const step = (delta: number) =>
    setWeightGoal(goal, Math.min(1, Math.max(0.1, Math.round((goalRateKg + delta) * 10) / 10)))

  return (
    <div className="rounded-2xl border border-slate-200 bg-surface p-4 shadow-sm">
      <p className="font-semibold text-slate-800">Objectif de poids</p>
      <p className="mb-3 text-xs text-slate-400">
        Sert aux repères indicatifs de l'écran « Pas, poids &amp; calories ». Pas un avis médical.
      </p>
      <div className="flex rounded-xl bg-slate-100 p-1 text-sm font-semibold">
        {GOALS.map((g) => (
          <button
            key={g.key}
            type="button"
            aria-pressed={goal === g.key}
            onClick={() => setWeightGoal(g.key)}
            className={`flex-1 rounded-lg py-2.5 ${goal === g.key ? 'bg-brand-600 text-white' : 'text-slate-500'}`}
          >
            {g.label}
          </button>
        ))}
      </div>
      {goal !== 'maintain' && (
        <div className="mt-3 flex items-center justify-between rounded-xl bg-slate-50 px-3 py-2">
          <p className="shrink-0 text-sm text-slate-500">Rythme</p>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => step(-0.1)}
              aria-label="Diminuer le rythme"
              className="h-10 w-10 rounded-full bg-slate-100 text-xl font-semibold text-slate-600 active:bg-slate-200"
            >
              −
            </button>
            <span className="min-w-[8.5rem] text-center text-sm font-bold tabular-nums text-slate-900">{rateLabel}</span>
            <button
              type="button"
              onClick={() => step(0.1)}
              aria-label="Augmenter le rythme"
              className="h-10 w-10 rounded-full bg-slate-100 text-xl font-semibold text-slate-600 active:bg-slate-200"
            >
              +
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

const SHORTCUT_STEPS = [
  'Ouvrez l\u2019app Raccourcis, puis touchez + (Nouveau raccourci).',
  'Ajoutez « Rechercher des échantillons Santé » : Type = Pas, Période = aujourd\u2019hui, puis « Calculer » = Somme. Si votre app de calories écrit dans Santé, refaites la même chose avec Type = Énergie alimentaire.',
  'Vérifiez que ce total correspond à celui de l\u2019app Santé. Avec un iPhone et une Apple Watch, une somme brute peut compter les pas deux fois : si le total est plus élevé que dans Santé, utilisez la source ou la statistique agrégée plutôt que la somme brute.',
  'Ajoutez « Texte » : date du jour (format AAAA-MM-JJ) ; pas ; poids ; kcal, séparés par des points-virgules. Poids et kcal peuvent rester vides. Exemple : 2026-10-06;8500;78,4;2400',
  'Ajoutez « Copier dans le presse-papiers ».',
  'Ensuite, ouvrez l\u2019app et touchez « Importer depuis le presse-papiers ».',
  'Optionnel : Automatisation > Heure du jour (par ex. chaque soir) pour lancer le raccourci. Un import fait plus tôt dans la journée peut être refait plus tard : la valeur du jour est simplement mise à jour.',
]

async function copyText(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text)
    return true
  } catch {
    const area = document.createElement('textarea')
    area.value = text
    area.style.position = 'fixed'
    area.style.opacity = '0'
    document.body.appendChild(area)
    area.select()
    const ok = document.execCommand('copy')
    area.remove()
    return ok
  }
}

function CopyButton({ text, label, doneLabel }: { text: string; label: string; doneLabel: string }) {
  const [copied, setCopied] = useState(false)
  return (
    <button
      type="button"
      onClick={async () => {
        if (await copyText(text)) {
          setCopied(true)
          setTimeout(() => setCopied(false), 2000)
        }
      }}
      className="flex w-full items-center justify-center gap-2 rounded-xl bg-slate-100 py-3 text-sm font-semibold text-slate-700 active:bg-slate-200"
    >
      <CopyIcon className="h-4 w-4" />
      {copied ? doneLabel : label}
    </button>
  )
}

function ShortcutCard() {
  const today = todayISO()
  // Example line for testing without the Shortcut: sets today's steps only.
  const formatExample = `${today};8500;;`
  const templateUrl = `${APP_URL}?steps=8500&date=${today}`

  return (
    <div className="rounded-2xl border border-slate-200 bg-surface p-4 shadow-sm">
      <p className="font-semibold text-slate-800">Importer mes pas automatiquement</p>
      <p className="mb-3 text-xs text-slate-400">
        Une app web ne peut pas lire Apple Santé. Un Raccourci iOS le fait à sa place et copie une ligne de texte
        que l'app importe d'un tap. Rien ne quitte votre téléphone.
      </p>
      <ol className="mb-4 space-y-2">
        {SHORTCUT_STEPS.map((text, i) => (
          <li key={i} className="flex gap-2.5 text-sm text-slate-700">
            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-brand-50 text-xs font-bold text-accent">
              {i + 1}
            </span>
            <span>{text}</span>
          </li>
        ))}
      </ol>

      <ClipboardImport />

      <p className="mb-1 mt-4 text-xs font-medium text-slate-500">Format attendu</p>
      <p className="mb-2 rounded-xl bg-slate-50 px-3 py-2 font-mono text-xs text-slate-600 [user-select:text]">
        AAAA-MM-JJ;pas;poids;kcal
      </p>
      <CopyButton text={formatExample} label="Copier le format attendu" doneLabel="Format copié" />
      <p className="mt-1.5 text-[11px] text-slate-400">
        Copie un exemple ({shortDate(today)} : 8 500 pas) à importer pour tester sans le Raccourci.
      </p>

      <details className="mt-4 rounded-xl bg-slate-50 px-3 py-2.5">
        <summary className="cursor-pointer text-xs font-semibold text-slate-600">
          Option : lien profond (si vous utilisez l'app dans Safari)
        </summary>
        <p className="mt-2 text-xs text-slate-500">
          Sur iPhone, Safari et l'app installée sur l'écran d'accueil ont chacun leur propre stockage, et un lien
          ouvert depuis Raccourcis s'ouvre dans Safari : avec l'app installée, les données n'apparaîtraient jamais
          dedans. Utilisez donc le presse-papiers ci-dessus. Le lien ne sert que si vous utilisez l'app dans
          Safari : remplacez alors les étapes 4 à 6 par une action « Texte » (URL + paramètres) puis « Ouvrir les URL ».
        </p>
        <p className="mb-2 mt-2 break-all rounded-lg bg-surface px-3 py-2 text-xs text-slate-600 [user-select:text]">
          {templateUrl}
        </p>
        <p className="mb-2 text-[11px] text-slate-400">
          Options : <span className="font-mono">&amp;weight=78.4</span> et <span className="font-mono">&amp;kcal=2400</span>. Une
          date manquante vaut aujourd'hui. Les paramètres invalides sont ignorés.
        </p>
        <CopyButton text={templateUrl} label="Copier l'URL modèle" doneLabel="URL copiée" />
      </details>
    </div>
  )
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

        <GoalCard />
        <ShortcutCard />

        <p className="px-2 pt-1 text-center text-[11px] text-slate-400">
          Images et données d'exercices : free-exercise-db (domaine public)
        </p>
      </div>
    </div>
  )
}
