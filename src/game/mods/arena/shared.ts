import type { GravityWellKey, GravityWellModifier } from '../../devtools'

export interface ArenaDimensions {
  width: number
  height: number
}

export interface StoredWell {
  x: number
  y: number
  gravityStrength: number
  gravityFalloff: number
  radius: number
}

export interface ActiveGravityWell extends StoredWell {
  key: GravityWellKey
  positiveTint: string
  negativeTint: string
}

export function toGravityFalloffValue(range: number): number {
  const radius = Number.isFinite(range) ? Math.max(0, range) : 0
  return radius * radius
}

export function createActiveWell(
  key: GravityWellKey,
  well: StoredWell,
  modifier: GravityWellModifier,
): ActiveGravityWell {
  return {
    key,
    x: well.x,
    y: well.y,
    gravityStrength: well.gravityStrength,
    gravityFalloff: well.gravityFalloff,
    radius: well.radius,
    positiveTint: modifier.positiveTint,
    negativeTint: modifier.negativeTint,
  }
}

export function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value))
}

export function randomRange(min: number, max: number): number {
  return Math.random() * (max - min) + min
}
