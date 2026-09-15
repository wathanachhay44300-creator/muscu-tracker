import { useState } from 'react'
import { usePlateSettings } from '../hooks/usePlateSettings'
import { calculatePlates } from '../lib/plates'
import { togglePlate, updateBarWeight } from '../lib/settingsActions'
import { formatWeight } from '../lib/stats'
import { ChevronRightIcon, XIcon } from './Icons'

interface PlateCalculatorSheetProps {
  initialWeight: number
  onClose: () => void
}

export function PlateCalculatorSheet({ initialWeight, onClose }: PlateCalculatorSheetProps) {
  const settings = usePlateSettings()
  const [weightText, setWeightText] = useState(initialWeight > 0 ? String(initialWeight) : '')
  const [showSettings, setShowSettings] = useState(false)

  const weight = parseFloat(weightText.replace(',', '.')) || 0

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 animate-fade-in-backdrop sm:items-center sm:p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-sm animate-slide-up rounded-t-2xl bg-white p-5 pb-safe shadow-lg sm:rounded-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-base font-semibold text-slate-900">Calculateur de plaques</h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-1.5 text-slate-500 active:bg-slate-100"
            aria-label="Fermer"
          >
            <XIcon className="h-5 w-5" />
          </button>
        </div>

        <label className="mb-1 block text-sm font-medium text-slate-600">Poids total (kg)</label>
        <input
          autoFocus
          value={weightText}
          onChange={(e) => setWeightText(e.target.value)}
          onFocus={(e) => e.target.select()}
          inputMode="decimal"
          placeholder="Ex : 100"
          className="mb-4 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-center text-lg font-semibold outline-none focus:border-brand-400"
        />

        {!settings ? null : (
          <PlateBreakdown weight={weight} barWeight={settings.barWeight} plates={settings.plates} />
        )}

        <button
          type="button"
          onClick={() => setShowSettings((s) => !s)}
          className="mt-4 flex w-full items-center justify-between rounded-xl bg-slate-100 px-4 py-3 text-sm font-medium text-slate-600 active:bg-slate-200"
        >
          Réglages (barre et plaques disponibles)
          <ChevronRightIcon
            className={`h-4 w-4 shrink-0 transition-transform duration-200 ${showSettings ? 'rotate-90' : ''}`}
          />
        </button>

        {showSettings && settings && (
          <div className="animate-fade-in mt-4 space-y-4">
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-600">
                Poids de la barre (kg)
              </label>
              <input
                type="number"
                step="0.5"
                min="0"
                value={settings.barWeight}
                onChange={(e) => updateBarWeight(parseFloat(e.target.value) || 0)}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-base outline-none focus:border-brand-400"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-600">
                Plaques disponibles
              </label>
              <div className="flex flex-wrap gap-2">
                {settings.plates.map((p) => (
                  <button
                    key={p.weight}
                    type="button"
                    onClick={() => togglePlate(p.weight, !p.enabled)}
                    className={`rounded-full px-3.5 py-2 text-sm font-medium ${
                      p.enabled ? 'bg-brand-600 text-white' : 'bg-slate-100 text-slate-400'
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
  barWeight,
  plates,
}: {
  weight: number
  barWeight: number
  plates: { weight: number; enabled: boolean }[]
}) {
  if (weight <= 0) {
    return <p className="rounded-xl bg-slate-50 p-4 text-center text-sm text-slate-400">Saisissez un poids.</p>
  }

  if (weight < barWeight) {
    return (
      <p className="rounded-xl bg-slate-50 p-4 text-center text-sm text-slate-500">
        Ce poids est inférieur à celui de la barre seule ({formatWeight(barWeight)} kg).
      </p>
    )
  }

  const enabledPlates = plates.filter((p) => p.enabled).map((p) => p.weight)
  const result = calculatePlates(weight, barWeight, enabledPlates)
  const gap = round2(Math.abs(result.achievedTotal - weight))

  return (
    <>
      <div className="rounded-xl bg-slate-50 p-4 text-center">
        <p className="text-xs font-medium text-slate-400">Par côté de la barre</p>
        {result.perSide.length === 0 ? (
          <p className="mt-1.5 text-lg font-bold text-slate-900">Barre seule</p>
        ) : (
          <p className="mt-1.5 text-lg font-bold text-slate-900">
            {result.perSide.map((p) => `${p.count} × ${formatWeight(p.weight)} kg`).join('  +  ')}
          </p>
        )}
        <p className="mt-1 text-xs text-slate-400">
          + barre de {formatWeight(barWeight)} kg de chaque côté
        </p>
      </div>

      {gap > 0.01 ? (
        <p className="mt-3 rounded-lg bg-amber-50 px-3 py-2 text-center text-xs font-medium text-amber-700">
          Poids réel : {formatWeight(result.achievedTotal)} kg au lieu de {formatWeight(weight)} kg demandé
        </p>
      ) : (
        <p className="mt-3 text-center text-xs font-medium text-emerald-600">Poids exact atteint ✓</p>
      )}
    </>
  )
}

function round2(n: number): number {
  return Math.round(n * 100) / 100
}
