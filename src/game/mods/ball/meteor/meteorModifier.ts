import type { MeteorModifier } from '../../../devtools'

export function applyMeteorShrink(
  modifier: MeteorModifier,
  travelDistance: number,
  defaultRadius: number,
): number {
  const rawStart = Number.isFinite(modifier.startRadius)
    ? (modifier.startRadius as number)
    : defaultRadius * 2
  const startRadius = clamp(rawStart, 2, 220)
  const rawMin = Number.isFinite(modifier.minRadius)
    ? (modifier.minRadius as number)
    : defaultRadius * 0.75
  const minRadius = clamp(Math.min(rawMin, startRadius), 1, startRadius)
  const shrinkRate = Number.isFinite(modifier.shrinkRate)
    ? Math.max(0, modifier.shrinkRate as number)
    : 0
  const radius = startRadius - travelDistance * shrinkRate
  return clamp(radius, minRadius, startRadius)
}

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value))
}
