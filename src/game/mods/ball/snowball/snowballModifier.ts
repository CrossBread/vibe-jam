import type { SnowballModifier } from '../../../devtools'

export function applySnowballGrowth(
  modifier: SnowballModifier,
  travelDistance: number,
  defaultRadius: number,
): number {
  const rawMin = Number.isFinite(modifier.minRadius)
    ? (modifier.minRadius as number)
    : defaultRadius * 0.5
  const rawMax = Number.isFinite(modifier.maxRadius)
    ? (modifier.maxRadius as number)
    : defaultRadius * 2
  const minRadius = clamp(rawMin, 1, 160)
  const maxRadius = clamp(Math.max(rawMax, minRadius), minRadius, 200)
  const growthRate = Number.isFinite(modifier.growthRate)
    ? Math.max(0, modifier.growthRate as number)
    : 0
  const radius = minRadius + travelDistance * growthRate
  return clamp(radius, minRadius, maxRadius)
}

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value))
}
