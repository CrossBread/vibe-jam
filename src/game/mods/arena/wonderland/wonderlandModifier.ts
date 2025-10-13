import type { GravityWellModifier } from '../../../devtools'
import type { ArenaDimensions } from '../shared'
import { clamp } from '../shared'

interface WonderlandSnowflake {
  x: number
  y: number
  radius: number
  sizeMultiplier: number
  speedMultiplier: number
  driftMultiplier: number
}

export interface WonderlandState {
  snowflakes: WonderlandSnowflake[]
  needsRespawn: boolean
}

export function createWonderlandState(): WonderlandState {
  return { snowflakes: [], needsRespawn: true }
}

export function resetWonderlandState(state: WonderlandState) {
  state.snowflakes = []
  state.needsRespawn = true
}

function getSnowflakeCount(modifier: GravityWellModifier): number {
  const raw = Number(modifier.snowflakeCount)
  if (Number.isFinite(raw)) return Math.max(0, Math.round(raw))
  return 180
}

function getBaseSnowflakeSize(modifier: GravityWellModifier): number {
  const raw = Number(modifier.snowflakeSize)
  if (Number.isFinite(raw)) return Math.max(1, raw)
  return 8
}

function getBaseSnowflakeSpeed(modifier: GravityWellModifier): number {
  const raw = Number(modifier.snowflakeSpeed)
  if (Number.isFinite(raw)) return Math.max(0, raw)
  return 200
}

export function getSnowOpacity(modifier: GravityWellModifier): number {
  const raw = Number(modifier.snowOpacity)
  if (Number.isFinite(raw)) return clamp(raw, 0, 1)
  return 0.85
}

function createSnowflake(
  dimensions: ArenaDimensions,
  modifier: GravityWellModifier,
): WonderlandSnowflake {
  const sizeMultiplier = 0.6 + Math.random() * 0.8
  const speedMultiplier = 0.6 + Math.random() * 0.8
  const driftMultiplier = Math.random() * 2 - 1
  const radius = getBaseSnowflakeSize(modifier) * sizeMultiplier
  return {
    x: Math.random() * dimensions.width,
    y: Math.random() * dimensions.height,
    radius,
    sizeMultiplier,
    speedMultiplier,
    driftMultiplier,
  }
}

function respawnSnowflake(
  flake: WonderlandSnowflake,
  dimensions: ArenaDimensions,
  modifier: GravityWellModifier,
) {
  flake.x = Math.random() * dimensions.width
  flake.y = -flake.radius - Math.random() * dimensions.height * 0.3
  flake.sizeMultiplier = 0.6 + Math.random() * 0.8
  flake.speedMultiplier = 0.6 + Math.random() * 0.8
  flake.driftMultiplier = Math.random() * 2 - 1
  flake.radius = getBaseSnowflakeSize(modifier) * flake.sizeMultiplier
}

export function updateWonderlandState(
  state: WonderlandState,
  modifier: GravityWellModifier,
  dt: number,
  dimensions: ArenaDimensions,
) {
  if (!modifier.enabled) {
    resetWonderlandState(state)
    return
  }

  const desiredCount = getSnowflakeCount(modifier)
  if (state.needsRespawn || state.snowflakes.length !== desiredCount) {
    state.snowflakes = []
    for (let i = 0; i < desiredCount; i++) {
      state.snowflakes.push(createSnowflake(dimensions, modifier))
    }
    state.needsRespawn = false
  }

  if (state.snowflakes.length === 0) return

  const baseSize = getBaseSnowflakeSize(modifier)
  const baseSpeed = getBaseSnowflakeSpeed(modifier)
  const driftScale = baseSpeed * 0.15
  const wrapWidth = dimensions.width + 40
  const lerpAmount = Math.min(1, dt * 6)

  for (const flake of state.snowflakes) {
    const targetRadius = baseSize * flake.sizeMultiplier
    flake.radius += (targetRadius - flake.radius) * lerpAmount

    const fallSpeed = baseSpeed * flake.speedMultiplier
    flake.y += fallSpeed * dt
    flake.x += driftScale * flake.driftMultiplier * dt

    if (flake.x < -20) flake.x += wrapWidth
    else if (flake.x > dimensions.width + 20) flake.x -= wrapWidth

    if (flake.y - flake.radius > dimensions.height) {
      respawnSnowflake(flake, dimensions, modifier)
    }
  }
}
