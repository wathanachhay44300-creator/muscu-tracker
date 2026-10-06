import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { usePreferences } from '../hooks/usePreferences'
import { setHapticsEnabled, setSoundEnabled, setWeightGoal } from '../lib/settingsActions'
import { importFromParams } from '../lib/deepLink'
import { hasDeepLinkParams, paramsFromText, todayEntryDate } from '../lib/tracking'
import type { WeightGoal } from '../types'
import { hapticLight } from '../lib/haptics'
import {
  getNotificationSupport,
  requestNotificationPermission,
  type NotificationSupport,
} from '../lib/notifications'
import { ChevronLeftIcon, ClipboardPasteIcon, CopyIcon } from '../components/Icons'

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
  'Ajoutez l\u2019action « Rechercher des échantillons Santé » : Type = Pas, Période = aujourd\u2019hui, Regrouper par = jour, puis « Calculer » = Somme.',
  'Ajoutez l\u2019action « Texte » et composez : l\u2019URL de l\u2019app + ?steps= + la variable (résultat de la somme) + &date= + la variable « Date actuelle » au format personnalisé AAAA-MM-JJ (yyyy-MM-dd).',
  'Ajoutez l\u2019action « Ouvrir les URL » avec ce texte.',
  'Optionnel : onglet Automatisation > + > « Heure du jour » (par ex. chaque soir à 22 h) > exécuter ce raccourci.',
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

function ShortcutCard() {
  const [copied, setCopied] = useState(false)
  const [pasted, setPasted] = useState('')
  const [result, setResult] = useState<{ ok: boolean; text: string } | null>(null)
  const templateUrl = `${APP_URL}?steps=8500&date=${todayEntryDate()}`

  async function handleCopy() {
    if (await copyText(templateUrl)) {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  async function handlePaste() {
    try {
      setPasted(await navigator.clipboard.readText())
      setResult(null)
    } catch {
      setResult({ ok: false, text: 'Collage refusé : collez le lien dans le champ ci-dessus.' })
    }
  }

  async function handleImport() {
    const params = paramsFromText(pasted)
    if (!hasDeepLinkParams(params)) {
      setResult({ ok: false, text: 'Aucune donnée reconnue (attendu : steps=…&date=…).' })
      return
    }
    const r = await importFromParams(params)
    setResult({ ok: r.ok, text: r.message })
    if (r.ok) setPasted('')
  }

  return (
    <div className="rounded-2xl border border-slate-200 bg-surface p-4 shadow-sm">
      <p className="font-semibold text-slate-800">Importer mes pas automatiquement</p>
      <p className="mb-3 text-xs text-slate-400">
        Une app web ne peut pas lire Apple Santé. Un Raccourci iOS le fait à sa place et envoie les pas à
        l'app par un lien. Rien ne quitte votre téléphone.
      </p>
      <ol className="mb-3 space-y-2">
        {SHORTCUT_STEPS.map((text, i) => (
          <li key={i} className="flex gap-2.5 text-sm text-slate-700">
            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-brand-50 text-xs font-bold text-accent">
              {i + 1}
            </span>
            <span>{text}</span>
          </li>
        ))}
      </ol>

      <p className="mb-1 text-xs font-medium text-slate-500">URL modèle</p>
      <p className="mb-2 break-all rounded-xl bg-slate-50 px-3 py-2 text-xs text-slate-600 [user-select:text]">
        {templateUrl}
      </p>
      <p className="mb-2 text-[11px] text-slate-400">
        Options : <span className="font-mono">&amp;weight=78.4</span> et <span className="font-mono">&amp;kcal=2400</span>. Une
        date manquante vaut aujourd'hui ; relancer le raccourci met à jour le même jour.
      </p>
      <button
        type="button"
        onClick={handleCopy}
        className="flex w-full items-center justify-center gap-2 rounded-xl bg-brand-600 py-3 text-sm font-semibold text-white active:bg-brand-700"
      >
        <CopyIcon className="h-4 w-4" />
        {copied ? 'URL copiée' : 'Copier l\u2019URL modèle'}
      </button>

      <div className="mt-4 rounded-xl bg-amber-50 px-3 py-2.5 text-xs text-amber-700">
        <p className="mb-1 font-semibold">App installée sur l'écran d'accueil ?</p>
        Sur iPhone, « Ouvrir les URL » ouvre Safari, dont le stockage est séparé de celui de l'app installée : les
        pas importés ne s'afficheraient alors pas dans l'app installée. Dans ce cas, remplacez l'étape 4 par
        l'action « Copier dans le presse-papiers », puis ouvrez l'app, collez ci-dessous et touchez Importer.
      </div>

      <div className="mt-3 flex gap-2">
        <input
          value={pasted}
          onChange={(e) => {
            setPasted(e.target.value)
            setResult(null)
          }}
          placeholder="Lien ou steps=8500&date=…"
          aria-label="Lien d'import à coller"
          className="min-w-0 flex-1 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm outline-none focus:border-brand-400"
        />
        <button
          type="button"
          onClick={handlePaste}
          aria-label="Coller depuis le presse-papiers"
          className="flex shrink-0 items-center gap-1.5 rounded-xl bg-slate-100 px-3 text-sm font-semibold text-slate-700 active:bg-slate-200"
        >
          <ClipboardPasteIcon className="h-4 w-4" />
          Coller
        </button>
      </div>
      <button
        type="button"
        onClick={handleImport}
        disabled={!pasted.trim()}
        className="mt-2 w-full rounded-xl bg-slate-100 py-3 text-sm font-semibold text-slate-700 active:bg-slate-200 disabled:opacity-40"
      >
        Importer
      </button>
      {result && (
        <p className={`mt-2 text-xs font-medium ${result.ok ? 'text-emerald-600' : 'text-red-600'}`}>{result.text}</p>
      )}
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
      </div>
    </div>
  )
}
