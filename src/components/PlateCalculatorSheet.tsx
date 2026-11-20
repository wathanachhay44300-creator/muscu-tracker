import { useState } from 'react'
import { usePlateSettings } from '../hooks/usePlateSettings'
import { calculateDirectPlates, calculateSplitPlates } from '../lib/plates'
import { togglePlate, updateBarWeight } from '../lib/settingsActions'
import { formatWeight } from '../lib/stats'
import { ChevronRightIcon, XIcon } from './Icons'
import type { LoadType } from '../types'
import { parseDecimal, t } from '../i18n'

interface PlateCalculatorSheetProps {
  initialWeight: number
  /** Only 'Barre libre' and 'Machine à plaques' ever reach this component. */
  loadType: LoadType
  onClose: () => void
}

export function PlateCalculatorSheet({ initialWeight, loadType, onClose }: PlateCalculatorSheetProps) {
  const settings = usePlateSettings()
  const [weightText, setWeightText] = useState(initialWeight > 0 ? String(initialWeight) : '')
  const [showSettings, setShowSettings] = useState(false)
  const isSplit = loadType === 'Barre libre'

  const weight = parseDecimal(weightText) || 0

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-scrim/40 animate-fade-in-backdrop sm:items-center sm:p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-sm animate-slide-up rounded-t-2xl bg-surface p-5 pb-safe shadow-lg sm:rounded-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-base font-semibold text-ink">{t('plates.title')}</h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-1.5 text-muted active:bg-surface-3"
            aria-label={t('common.close')}
          >
            <XIcon className="h-5 w-5" />
          </button>
        </div>

        <label className="mb-1 block text-sm font-medium text-ink-2">
          {isSplit ? t('plates.total') : t('plates.load')}
        </label>
        <input
          autoFocus
          value={weightText}
          onChange={(e) => setWeightText(e.target.value)}
          onFocus={(e) => e.target.select()}
          inputMode="decimal"
          placeholder={t('plates.placeholder')}
          className="mb-4 w-full rounded-xl border border-line bg-surface-2 px-4 py-3 text-center text-lg font-semibold outline-none focus:border-accent-line"
        />

        {!settings ? null : (
          <PlateBreakdown weight={weight} isSplit={isSplit} barWeight={settings.barWeight} plates={settings.plates} />
        )}

        <button
          type="button"
          onClick={() => setShowSettings((s) => !s)}
          className="mt-4 flex w-full items-center justify-between rounded-xl bg-surface-3 px-4 py-3 text-sm font-medium text-ink-2 active:bg-surface-4"
        >
          {isSplit ? t('plates.settingsSplit') : t('plates.settings')}
          <ChevronRightIcon
            className={`h-4 w-4 shrink-0 transition-transform duration-200 ${showSettings ? 'rotate-90' : ''}`}
          />
        </button>

        {showSettings && settings && (
          <div className="animate-fade-in mt-4 space-y-4">
            {isSplit && (
              <div>
                <label className="mb-1 block text-sm font-medium text-ink-2">
                  {t('plates.barWeight')}
                </label>
                <input
                  type="number"
                  step="0.5"
                  min="0"
                  value={settings.barWeight}
                  onChange={(e) => updateBarWeight(parseFloat(e.target.value) || 0)}
                  className="w-full rounded-xl border border-line bg-surface-2 px-4 py-2.5 text-base outline-none focus:border-accent-line"
                />
              </div>
            )}
            <div>
              <label className="mb-1.5 block text-sm font-medium text-ink-2">
                {t('plates.available')}
              </label>
              <div className="flex flex-wrap gap-2">
                {settings.plates.map((p) => (
                  <button
                    key={p.weight}
                    type="button"
                    onClick={() => togglePlate(p.weight, !p.enabled)}
                    className={`rounded-full px-3.5 py-2 text-sm font-medium ${
                      p.enabled ? 'bg-accent text-on-accent' : 'bg-surface-3 text-muted'
                    }`}
                  >
                    {formatWeight(p.weight)} kg
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

function PlateBreakdown({
  weight,
  isSplit,
  barWeight,
  plates,
}: {
  weight: number
  isSplit: boolean
  barWeight: number
  plates: { weight: number; enabled: boolean }[]
}) {
  if (weight <= 0) {
    return <p className="rounded-xl bg-surface-2 p-4 text-center text-sm text-muted">{t('plates.enter')}</p>
  }

  if (isSplit && weight < barWeight) {
    return (
      <p className="rounded-xl bg-surface-2 p-4 text-center text-sm text-muted">
        {t('plates.belowBar', { v: formatWeight(barWeight) })}
      </p>
    )
  }

  const enabledPlates = plates.filter((p) => p.enabled).map((p) => p.weight)

  if (isSplit) {
    const result = calculateSplitPlates(weight, barWeight, enabledPlates)
    const gap = round2(Math.abs(result.achievedTotal - weight))
    return (
      <>
        <div className="rounded-xl bg-surface-2 p-4 text-center">
          <p className="text-xs font-medium text-muted">{t('plates.perSide')}</p>
          {result.perSide.length === 0 ? (
            <p className="mt-1.5 text-lg font-bold text-ink">{t('plates.barOnly')}</p>
          ) : (
            <p className="mt-1.5 text-lg font-bold text-ink">
              {result.perSide.map((p) => `${p.count} × ${formatWeight(p.weight)} kg`).join('  +  ')}
            </p>
          )}
          <p className="mt-1 text-xs text-muted">
            {t('plates.plusBar', { v: formatWeight(barWeight) })}
          </p>
        </div>
        <GapMessage gap={gap} achieved={result.achievedTotal} requested={weight} />
      </>
    )
  }

  const result = calculateDirectPlates(weight, enabledPlates)
  const gap = round2(Math.abs(result.achievedTotal - weight))
  return (
    <>
      <div className="rounded-xl bg-surface-2 p-4 text-center">
        <p className="text-xs font-medium text-muted">{t('plates.toLoad')}</p>
        {result.plates.length === 0 ? (
          <p className="mt-1.5 text-lg font-bold text-ink">{t('plates.none')}</p>
        ) : (
          <p className="mt-1.5 text-lg font-bold text-ink">
            {result.plates.map((p) => `${p.count} × ${formatWeight(p.weight)} kg`).join('  +  ')}
          </p>
        )}
      </div>
      <GapMessage gap={gap} achieved={result.achievedTotal} requested={weight} />
    </>
  )
}

function GapMessage({ gap, achieved, requested }: { gap: number; achieved: number; requested: number }) {
  if (gap > 0.01) {
    return (
      <p className="mt-3 rounded-lg bg-highlight-soft px-3 py-2 text-center text-xs font-medium text-highlight-ink">
        {t('plates.gap', { a: formatWeight(achieved), r: formatWeight(requested) })}
      </p>
    )
  }
  return <p className="mt-3 text-center text-xs font-medium text-good-ink">{t('plates.exact')}</p>
}

function round2(n: number): number {
  return Math.round(n * 100) / 100
}
