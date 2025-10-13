import type { GravityWellModifier } from '../../../devtools'
import type { ArenaDimensions } from '../shared'
import { clamp } from '../shared'

export interface FogOfWarState {
  radius: number
}

export function createFogOfWarState(): FogOfWarState {
  return { radius: 0 }
}

export function resetFogOfWarState(state: FogOfWarState) {
  state.radius = 0
}

export function getFogExpansionSpeed(modifier: GravityWellModifier): number {
  const raw = Number(modifier.fogExpansionSpeed)
  if (Number.isFinite(raw)) return Math.max(0, raw)
  return 220
}

export function getFogMaxRadius(
  modifier: GravityWellModifier,
  dimensions: ArenaDimensions,
): number {
  const raw = Number(modifier.fogMaxRadius)
  if (Number.isFinite(raw)) return Math.max(0, raw)
  const diagonal = Math.hypot(dimensions.width, dimensions.height)
  return diagonal * 0.55
}

export function getFogMaxOpacity(modifier: GravityWellModifier): number {
  const raw = Number(modifier.fogMaxOpacity)
  if (Number.isFinite(raw)) return clamp(raw, 0, 1)
  return 0.85
}

export function updateFogOfWarState(
  state: FogOfWarState,
  modifier: GravityWellModifier,
  dt: number,
  dimensions: ArenaDimensions,
) {
  if (!modifier.enabled) {
    resetFogOfWarState(state)
    return
  }

  const maxRadius = getFogMaxRadius(modifier, dimensions)
  state.radius = clamp(state.radius, 0, maxRadius)

  const speed = getFogExpansionSpeed(modifier)
  if (speed <= 0) return

  state.radius = Math.min(maxRadius, state.radius + speed * dt)
}
