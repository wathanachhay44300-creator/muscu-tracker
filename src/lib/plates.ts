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

export interface PlateResult {
  /** Plates to load on ONE side of the bar, heaviest first. */
  perSide: PlateBreakdownItem[]
  /** Actual total weight achievable with the available plates (bar + both sides). */
  achievedTotal: number
}

/**
 * Greedy largest-plate-first breakdown for one side of the bar. This plate
 * set is a "canonical" denomination system (each value divides evenly into
 * the ones above it), so greedy always finds the best achievable
 * combination — exact when possible, closest below the target otherwise.
 */
export function calculatePlates(
  totalWeight: number,
  barWeight: number,
  availablePlates: number[],
): PlateResult {
  const perSideTarget = Math.max(0, (totalWeight - barWeight) / 2)
  const sortedPlates = [...availablePlates].filter((p) => p > 0).sort((a, b) => b - a)

  let remainingUnits = toUnits(perSideTarget)
  const perSide: PlateBreakdownItem[] = []

  for (const plate of sortedPlates) {
    const plateUnits = toUnits(plate)
    if (plateUnits <= 0) continue
    const count = Math.floor(remainingUnits / plateUnits)
    if (count > 0) {
      perSide.push({ weight: plate, count })
      remainingUnits -= count * plateUnits
    }
  }

  const achievedPerSide = (toUnits(perSideTarget) - remainingUnits) * UNIT
  return { perSide, achievedTotal: round2(barWeight + achievedPerSide * 2) }
}
