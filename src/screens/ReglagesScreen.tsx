import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { usePreferences } from '../hooks/usePreferences'
import { setExerciseNameLang, setHapticsEnabled, setSoundEnabled, setWeightGoal, setWeightStep, WEIGHT_STEPS } from '../lib/settingsActions'
import { ClipboardImport } from '../components/ClipboardImport'
import { todayISO } from '../lib/date'
import { shortDate } from '../lib/tracking'
import type { WeightGoal } from '../types'
import { hapticLight } from '../lib/haptics'
import { useTheme } from '../hooks/useTheme'
import { THEMES } from '../theme/themes'
import { JokerOnly, MiniCard } from '../components/joker/Joker'
import {
  getNotificationSupport,
  requestNotificationPermission,
  type NotificationSupport,
} from '../lib/notifications'
import { CheckIcon, ChevronLeftIcon, ChevronRightIcon, CopyIcon, DownloadIcon } from '../components/Icons'
import { formatDecimal, LANGUAGES, setLang, t, tDynamic, type TKey, useLang } from '../i18n'

function Toggle({ on, onChange, label }: { on: boolean; onChange: (v: boolean) => void; label: string }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={on}
      aria-label={label}
      onClick={() => onChange(!on)}
      className={`relative h-7 w-12 shrink-0 rounded-full transition-colors ${on ? 'bg-accent' : 'bg-line-strong'}`}
    >
      <span
        className={`absolute left-0.5 top-0.5 h-6 w-6 rounded-full bg-knob shadow transition-transform ${
          on ? 'translate-x-5' : 'translate-x-0'
        }`}
      />
    </button>
  )
}

const notifLabelKey: Record<NotificationSupport, TKey> = {
  unsupported: 'settings.notifUnsupported', default: 'settings.notifDefault', granted: 'settings.notifGranted', denied: 'settings.notifDenied',
}

const APP_URL = 'https://wathanachhay44300-creator.github.io/muscu-tracker/'

const GOALS: { key: WeightGoal }[] = [
  { key: 'loss' },
  { key: 'maintain' },
  { key: 'gain' },
]

function GoalCard() {
  const preferences = usePreferences()
  if (!preferences) return null
  const { goal, goalRateKg } = preferences
  const rateLabel = `${goal === 'loss' ? '−' : '+'}${formatDecimal(goalRateKg, 1)} kg / ${t('settings.perWeek')}`
  const step = (delta: number) =>
    setWeightGoal(goal, Math.min(1, Math.max(0.1, Math.round((goalRateKg + delta) * 10) / 10)))

  return (
    <div className="rounded-2xl border border-line bg-surface p-4 shadow-sm">
      <p className="font-semibold text-ink">{t('settings.goal')}</p>
      <p className="mb-3 text-xs text-muted">{t('settings.goalHint')}</p>
      <div className="flex rounded-xl bg-surface-3 p-1 text-sm font-semibold">
        {GOALS.map((g) => (
          <button
            key={g.key}
            type="button"
            aria-pressed={goal === g.key}
            onClick={() => setWeightGoal(g.key)}
            className={`flex-1 rounded-lg py-2.5 ${goal === g.key ? 'bg-accent text-on-accent' : 'text-muted'}`}
          >
            {g.key === 'loss' ? t('settings.loss') : g.key === 'maintain' ? t('settings.maintain') : t('settings.gain')}
          </button>
        ))}
      </div>
      {goal !== 'maintain' && (
        <div className="mt-3 flex items-center justify-between rounded-xl bg-surface-2 px-3 py-2">
            <p className="shrink-0 text-sm text-muted">{t('settings.pace')}</p>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => step(-0.1)}
              aria-label={t('settings.decreasePace')}
              className="h-10 w-10 rounded-full bg-surface-3 text-xl font-semibold text-ink-2 active:bg-surface-4"
            >
              −
            </button>
            <span className="min-w-[8.5rem] text-center text-sm font-bold tabular-nums text-ink">{rateLabel}</span>
            <button
              type="button"
              onClick={() => step(0.1)}
              aria-label={t('settings.increasePace')}
              className="h-10 w-10 rounded-full bg-surface-3 text-xl font-semibold text-ink-2 active:bg-surface-4"
            >
              +
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

const SHORTCUT_STEP_KEYS: TKey[] = [
  'settings.shortcutStep1', 'settings.shortcutStep2', 'settings.shortcutStep3', 'settings.shortcutStep4',
  'settings.shortcutStep5', 'settings.shortcutStep6', 'settings.shortcutStep7',
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
      className="flex w-full items-center justify-center gap-2 rounded-xl bg-surface-3 py-3 text-sm font-semibold text-ink-2 active:bg-surface-4"
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
    <div className="rounded-2xl border border-line bg-surface p-4 shadow-sm">
      <p className="font-semibold text-ink">{t('settings.shortcut')}</p>
      <p className="mb-3 text-xs text-muted">
        {t('settings.shortcutHint')}
      </p>
      <ol className="mb-4 space-y-2">
        {SHORTCUT_STEP_KEYS.map((key, i) => (
          <li key={i} className="flex gap-2.5 text-sm text-ink-2">
            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-accent-soft text-xs font-bold text-accent-ink">
              {i + 1}
            </span>
            <span>{t(key)}</span>
          </li>
        ))}
      </ol>

      <ClipboardImport />

      <p className="mb-1 mt-4 text-xs font-medium text-muted">{t('settings.shortcutFormat')}</p>
      <p className="mb-2 rounded-xl bg-surface-2 px-3 py-2 font-mono text-xs text-ink-2 [user-select:text]">
        {t('clipboard.placeholder')}
      </p>
      <CopyButton text={formatExample} label={t('settings.copyFormat')} doneLabel={t('settings.formatCopied')} />
      <p className="mt-1.5 text-[11px] text-muted">
        {t('settings.exampleImport', { date: shortDate(today) })}
      </p>

      <details className="mt-4 rounded-xl bg-surface-2 px-3 py-2.5">
        <summary className="cursor-pointer text-xs font-semibold text-ink-2">
          {t('settings.deepLink')}
        </summary>
        <p className="mt-2 text-xs text-muted">
          {t('settings.deepLinkHelp')}
        </p>
        <p className="mb-2 mt-2 break-all rounded-lg bg-surface px-3 py-2 text-xs text-ink-2 [user-select:text]">
          {templateUrl}
        </p>
        <p className="mb-2 text-[11px] text-muted">
          {t('settings.deepLinkOptions', { weight: '&weight=78.4', kcal: '&kcal=2400' })}
        </p>
        <CopyButton text={templateUrl} label={t('settings.copyUrl')} doneLabel={t('settings.urlCopied')} />
      </details>
    </div>
  )
}

/** Theme picker: each option is previewed in its own colors (data-theme on the swatch). */
function ThemeCard() {
  const { theme, setTheme } = useTheme()
  return (
    <div className="rounded-2xl border border-line bg-surface p-4 shadow-sm">
      <p className="font-semibold text-ink">{t('settings.theme')}</p>
      <p className="mb-3 text-xs text-muted">{t('settings.themeHint')}</p>
      <div className="grid grid-cols-2 gap-2" role="radiogroup" aria-label={t('settings.theme')}>
        {THEMES.map((th) => {
          const on = theme === th.id
          return (
            <button
              key={th.id}
              type="button"
              role="radio"
              aria-checked={on}
              onClick={() => setTheme(th.id)}
              className={`overflow-hidden rounded-xl border-2 text-left ${on ? 'border-accent' : 'border-line'}`}
            >
              <div data-theme={th.id} className="bg-page p-2">
                <div className="relative rounded-lg bg-surface p-2">
                  <JokerOnly>
                    <MiniCard suit="spade" glow="magenta" className="absolute right-1.5 top-1.5 h-6 w-[18px]" />
                  </JokerOnly>
                  <p className="font-display text-[12px] leading-tight text-ink">{tDynamic(`theme.${th.id}`)}</p>
                  <div className="mt-1.5 flex items-center gap-1">
                    <span className="h-3 w-6 rounded-full bg-accent" />
                    <span className="h-3 w-3 rounded-full bg-highlight" />
                    <span className="h-3 w-3 rounded-full bg-surface-3" />
                  </div>
                </div>
              </div>
              <div className="flex min-h-11 items-center justify-between gap-1 bg-surface-2 px-2 py-1.5">
                <span className="text-[11px] leading-tight text-muted">{tDynamic(`theme.${th.id}_desc`)}</span>
                {on && <CheckIcon className="h-4 w-4 shrink-0 text-accent-ink" />}
              </div>
            </button>
          )
        })}
      </div>
    </div>
  )
}

export function ReglagesScreen() {
  const lang = useLang()
  const navigate = useNavigate()
  const preferences = usePreferences()
  const [notif, setNotif] = useState<NotificationSupport>(() => getNotificationSupport())

  return (
    <div className="mx-auto max-w-md px-4 pt-safe pb-28 pt-4 animate-fade-in">
      <div className="mb-5 flex items-center gap-2">
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="-ml-2 rounded-full p-2 text-muted active:bg-surface-3"
          aria-label={t('common.back')}
        >
          <ChevronLeftIcon className="h-5 w-5" />
        </button>
        <h1 className="text-lg font-bold text-ink">{t('nav.settings')}</h1>
      </div>

      <div className="space-y-3">
        <div className="rounded-2xl border border-line bg-surface p-4 shadow-sm">
          <p className="font-semibold text-ink">{t('settings.language')}</p>
          <p className="mb-3 text-xs text-muted">{t('settings.languageHint')}</p>
          <div className="grid grid-cols-2 gap-2" role="group" aria-label={t('settings.language')}>
            {LANGUAGES.map((option) => (
              <button
                key={option.id}
                type="button"
                aria-pressed={lang === option.id}
                onClick={() => setLang(option.id)}
                className={`min-h-11 rounded-xl text-sm font-semibold ${lang === option.id ? 'bg-accent text-on-accent' : 'bg-surface-3 text-ink-2 active:bg-surface-4'}`}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>
        <ThemeCard />

        <Link
          to="/donnees"
          className="flex min-h-14 items-center justify-between gap-3 rounded-2xl border border-line bg-surface px-4 py-3 shadow-sm active:bg-surface-2"
        >
          <span className="flex items-center gap-3">
            <DownloadIcon className="h-5 w-5 text-accent-ink" />
            <span>
              <span className="block font-semibold text-ink">{t('settings.data')}</span>
              <span className="block text-xs text-muted">{t('settings.dataHint')}</span>
            </span>
          </span>
          <ChevronRightIcon className="h-5 w-5 text-faint" />
        </Link>

        <div className="rounded-2xl border border-line bg-surface p-4 shadow-sm">
          <p className="font-semibold text-ink">{t('settings.exerciseNames')}</p>
          <p className="mb-3 text-xs text-muted">{t('settings.exerciseNamesHint')}</p>
          <div className="grid grid-cols-2 gap-1.5" role="radiogroup" aria-label={t('settings.exerciseNames')}>
            {(
              [
                ['fr', 'Français'],
                ['en', 'English'],
              ] as const
            ).map(([lang, label]) => {
              const on = (preferences?.exerciseNameLang ?? 'en') === lang
              return (
                <button
                  key={lang}
                  type="button"
                  role="radio"
                  aria-checked={on}
                  onClick={() => setExerciseNameLang(lang)}
                  className={`min-h-11 rounded-xl text-sm font-bold ${
                    on ? 'bg-accent text-on-accent' : 'bg-surface-3 text-ink-2 active:bg-surface-4'
                  }`}
                >
                  {label}
                </button>
              )
            })}
          </div>
        </div>

        <div className="rounded-2xl border border-line bg-surface p-4 shadow-sm">
          <p className="font-semibold text-ink">{t('settings.weightStep')}</p>
          <p className="mb-3 text-xs text-muted">{t('settings.weightStepHint')}</p>
          <div className="grid grid-cols-4 gap-1.5" role="radiogroup" aria-label={t('settings.weightStep')}>
            {WEIGHT_STEPS.map((st) => {
              const on = (preferences?.weightStep ?? 2.5) === st
              return (
                <button
                  key={st}
                  type="button"
                  role="radio"
                  aria-checked={on}
                  onClick={() => setWeightStep(st)}
                  className={`min-h-11 rounded-xl text-sm font-bold ${
                    on ? 'bg-accent text-on-accent' : 'bg-surface-3 text-ink-2 active:bg-surface-4'
                  }`}
                >
                  {formatDecimal(st)} kg
                </button>
              )
            })}
          </div>
        </div>

        <div className="flex items-center justify-between gap-3 rounded-2xl border border-line bg-surface p-4 shadow-sm">
          <div>
            <p className="font-semibold text-ink">{t('settings.haptics')}</p>
            <p className="text-xs text-muted">{t('settings.hapticsHint')}</p>
          </div>
          <Toggle
            on={!!preferences?.hapticsEnabled}
            label={t('settings.haptics')}
            onChange={(v) => {
              setHapticsEnabled(v)
              hapticLight(v)
            }}
          />
        </div>

        <div className="flex items-center justify-between gap-3 rounded-2xl border border-line bg-surface p-4 shadow-sm">
          <div>
          <p className="font-semibold text-ink">{t('settings.sound')}</p>
          <p className="text-xs text-muted">{t('settings.soundHint')}</p>
          </div>
          <Toggle on={!!preferences?.soundEnabled} label={t('settings.sound')} onChange={setSoundEnabled} />
        </div>

        <div className="rounded-2xl border border-line bg-surface p-4 shadow-sm">
          <p className="font-semibold text-ink">{t('settings.notifications')}</p>
          <p className="mb-3 text-xs text-muted">{t(notifLabelKey[notif])}</p>
          {(notif === 'default' || notif === 'denied') && (
            <button
              type="button"
              disabled={notif === 'denied'}
              onClick={async () => setNotif(await requestNotificationPermission())}
              className="w-full rounded-xl bg-accent py-2.5 text-sm font-semibold text-on-accent active:bg-accent-hover disabled:opacity-40"
            >
              {t('settings.allowNotifications')}
            </button>
          )}
          <p className="mt-3 rounded-lg bg-highlight-soft px-3 py-2 text-xs text-highlight-ink">
            {t('settings.notifLimit')}
          </p>
        </div>

        <GoalCard />
        <ShortcutCard />

        <p className="px-2 pt-1 text-center text-[11px] text-muted">
          {t('settings.sourceCredit')}
        </p>
      </div>
    </div>
  )
}
