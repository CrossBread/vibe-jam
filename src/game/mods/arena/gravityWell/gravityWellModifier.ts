/*
 * Copyright (c) 2025. CrossBread Tech All rights reserved.
 */

import type { GravityWellModifier } from '../../../devtools'
import type { ArenaDimensions, StoredWell } from '../shared'
import { clamp, randomRange, toGravityFalloffValue } from '../shared'

export interface MovingWellState {
  x: number
  y: number
  targetX: number
  targetY: number
  pauseTimer: number
  hasTarget: boolean
}

export function createCenteredWell(
  modifier: GravityWellModifier,
  dimensions: ArenaDimensions,
): StoredWell {
  return {
    x: dimensions.width * 0.5,
    y: dimensions.height * 0.5,
    gravityStrength: modifier.gravityStrength,
    gravityFalloff: toGravityFalloffValue(modifier.gravityFalloff),
    radius: modifier.radius,
  }
}

export function createMovingWellState(dimensions: ArenaDimensions): MovingWellState {
  const centerX = dimensions.width * 0.5
  const centerY = dimensions.height * 0.5
  return {
    x: centerX,
    y: centerY,
    targetX: centerX,
    targetY: centerY,
    pauseTimer: 0,
    hasTarget: false,
  }
}

export function resetMovingWellState(
  state: MovingWellState,
  dimensions: ArenaDimensions,
): void {
  state.x = dimensions.width * 0.5
  state.y = dimensions.height * 0.5
  state.targetX = dimensions.width * 0.5
  state.targetY = dimensions.height * 0.5
  state.pauseTimer = 0
  state.hasTarget = false
}

export function updateMovingWellState(
  state: MovingWellState,
  modifier: GravityWellModifier,
  dt: number,
  dimensions: ArenaDimensions,
): void {
  if (!modifier.enabled) {
    resetMovingWellState(state, dimensions)
    return
  }

  const widthPercentage = clamp(modifier.wanderWidthPercentage ?? 0.33, 0.05, 1)
  const wanderSpeed = Math.max(0, modifier.wanderSpeed ?? 110)
  const pauseDuration = Math.max(0, modifier.pauseDuration ?? 1.25)

  const halfWidth = (dimensions.width * widthPercentage) / 2
  const halfHeight = (dimensions.height * widthPercentage) / 2
  const minX = dimensions.width * 0.5 - halfWidth
  const maxX = dimensions.width * 0.5 + halfWidth
  const minY = dimensions.height * 0.5 - halfHeight
  const maxY = dimensions.height * 0.5 + halfHeight

  state.x = clamp(state.x, minX, maxX)
  state.y = clamp(state.y, minY, maxY)
  state.targetX = clamp(state.targetX, minX, maxX)
  state.targetY = clamp(state.targetY, minY, maxY)

  const pickNextTarget = () => {
    state.targetX = randomRange(minX, maxX)
    state.targetY = randomRange(minY, maxY)
    state.hasTarget = true
  }

  if (!state.hasTarget) {
    pickNextTarget()
  }

  if (state.pauseTimer > 0) {
    state.pauseTimer = Math.max(0, state.pauseTimer - dt)
    if (state.pauseTimer === 0) {
      pickNextTarget()
    }
    return
  }

  const dx = state.targetX - state.x
  const dy = state.targetY - state.y
  const dist = Math.hypot(dx, dy)
  if (dist === 0) {
    state.pauseTimer = pauseDuration
    return
  }

  const step = wanderSpeed * dt
  if (dist <= step) {
    state.x = state.targetX
    state.y = state.targetY
    state.pauseTimer = pauseDuration
    return
  }

  const invDist = 1 / dist
  state.x += dx * invDist * step
  state.y += dy * invDist * step
}
