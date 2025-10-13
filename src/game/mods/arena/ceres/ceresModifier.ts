import type { GravityWellModifier } from '../../../devtools'
import type { ArenaDimensions } from '../shared'
import { clamp } from '../shared'

export interface CeresState {
  x: number
  y: number
  vx: number
  vy: number
  initialized: boolean
}

export function createCeresState(dimensions: ArenaDimensions): CeresState {
  return {
    x: dimensions.width * 0.5,
    y: dimensions.height * 0.5,
    vx: 0,
    vy: 0,
    initialized: false,
  }
}

export function resetCeresState(state: CeresState, dimensions: ArenaDimensions): void {
  state.x = dimensions.width * 0.5
  state.y = dimensions.height * 0.5
  state.vx = 0
  state.vy = 0
  state.initialized = false
}

function getCeresSpeed(modifier: GravityWellModifier): number {
  const rawSpeed = Number.isFinite(modifier.wanderSpeed) ? Number(modifier.wanderSpeed) : 180
  return Math.max(0, rawSpeed)
}

function initializeCeres(state: CeresState, modifier: GravityWellModifier): void {
  const speed = getCeresSpeed(modifier)
  if (speed <= 0) {
    state.vx = 0
    state.vy = 0
    state.initialized = true
    return
  }

  const angle = Math.random() * Math.PI * 2
  state.vx = Math.cos(angle) * speed
  state.vy = Math.sin(angle) * speed
  state.initialized = true
}

export function updateCeresState(
  state: CeresState,
  modifier: GravityWellModifier,
  dt: number,
  dimensions: ArenaDimensions,
): void {
  if (!modifier.enabled) {
    resetCeresState(state, dimensions)
    return
  }

  const radius = Math.max(0, modifier.radius)
  const minX = radius
  const maxX = Math.max(radius, dimensions.width - radius)
  const minY = radius
  const maxY = Math.max(radius, dimensions.height - radius)

  state.x = clamp(state.x, minX, maxX)
  state.y = clamp(state.y, minY, maxY)

  if (!state.initialized) {
    initializeCeres(state, modifier)
  }

  const speed = getCeresSpeed(modifier)

  let nextX = state.x + state.vx * dt
  let nextY = state.y + state.vy * dt

  if (nextX < minX) {
    nextX = minX + (minX - nextX)
    state.vx = Math.abs(state.vx)
  } else if (nextX > maxX) {
    nextX = maxX - (nextX - maxX)
    state.vx = -Math.abs(state.vx)
  }

  if (nextY < minY) {
    nextY = minY + (minY - nextY)
    state.vy = Math.abs(state.vy)
  } else if (nextY > maxY) {
    nextY = maxY - (nextY - maxY)
    state.vy = -Math.abs(state.vy)
  }

  state.x = clamp(nextX, minX, maxX)
  state.y = clamp(nextY, minY, maxY)

  if (speed <= 0) {
    state.vx = 0
    state.vy = 0
    return
  }

  const currentSpeed = Math.hypot(state.vx, state.vy)
  if (!Number.isFinite(currentSpeed) || currentSpeed === 0) {
    initializeCeres(state, modifier)
    return
  }

  const scale = speed / currentSpeed
  state.vx *= scale
  state.vy *= scale
}
