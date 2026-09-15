/** Smallest resolution we reason in (kg) — avoids float drift from 1.25kg plates. */
const UNIT = 0.25

function toUnits(kg: number): number {
  return Math.round(kg / UNIT)
}

function round2(n: number): number {
  return Math.round(n * 100) / 100
}

export interface PlateBreakdownItem {
  weight: number
  count: number
}

/**
 * Greedy largest-plate-first breakdown of a target weight. This plate set is
 * a "canonical" denomination system (each value divides evenly into the
 * ones above it), so greedy always finds the best achievable combination —
 * exact when possible, closest below the target otherwise.
 */
function greedyBreakdown(
  targetWeight: number,
  availablePlates: number[],
): { items: PlateBreakdownItem[]; achievedWeight: number } {
  const sortedPlates = [...availablePlates].filter((p) => p > 0).sort((a, b) => b - a)
  let remainingUnits = toUnits(Math.max(0, targetWeight))
  const items: PlateBreakdownItem[] = []

  for (const plate of sortedPlates) {
    const plateUnits = toUnits(plate)
    if (plateUnits <= 0) continue
    const count = Math.floor(remainingUnits / plateUnits)
    if (count > 0) {
      items.push({ weight: plate, count })
      remainingUnits -= count * plateUnits
    }
  }

  const achievedWeight = (toUnits(Math.max(0, targetWeight)) - remainingUnits) * UNIT
  return { items, achievedWeight }
}

export interface SplitPlateResult {
  /** Plates to load on ONE side of the bar, heaviest first. */
  perSide: PlateBreakdownItem[]
  /** Actual total weight achievable (bar + both sides). */
  achievedTotal: number
}

/** Free-weight barbell: the entered weight is the TOTAL, bar included. */
export function calculateSplitPlates(
  totalWeight: number,
  barWeight: number,
  availablePlates: number[],
): SplitPlateResult {
  const perSideTarget = Math.max(0, (totalWeight - barWeight) / 2)
  const { items, achievedWeight } = greedyBreakdown(perSideTarget, availablePlates)
  return { perSide: items, achievedTotal: round2(barWeight + achievedWeight * 2) }
}

export interface DirectPlateResult {
  /** Plates to load, heaviest first — no bar, no splitting. */
  plates: PlateBreakdownItem[]
  /** Actual weight achievable with the available plates. */
  achievedTotal: number
}

/**
 * Plate-loaded machine (or a single loadable dumbbell): the entered weight
 * IS the plate weight to load directly — no bar to subtract, no /2.
 */
export function calculateDirectPlates(weight: number, availablePlates: number[]): DirectPlateResult {
  const { items, achievedWeight } = greedyBreakdown(weight, availablePlates)
  return { plates: items, achievedTotal: round2(achievedWeight) }
}
