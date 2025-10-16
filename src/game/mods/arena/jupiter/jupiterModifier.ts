/*
 * Copyright (c) 2025. CrossBread Tech All rights reserved.
 */

import { clamp } from '../shared'
import { getJupiterWells } from './jupiterView'
import type { GravityWellModifier } from '../../../devtools'
import type { ManagedMod } from '../../modManager'
import type { ActiveGravityWell, ArenaDimensions } from '../shared'

export interface JupiterState {
  x: number
  y: number
  angle: number
  initialized: boolean
}

export function createJupiterState(dimensions: ArenaDimensions): JupiterState {
  return {
    x: dimensions.width * 0.5,
    y: dimensions.height * 0.5,
    angle: 0,
    initialized: false,
  }
}

export function resetJupiterState(state: JupiterState, dimensions: ArenaDimensions): void {
  state.x = dimensions.width * 0.5
  state.y = dimensions.height * 0.5
  state.angle = 0
  state.initialized = false
}

function getOrbitRadius(
  modifier: GravityWellModifier,
  dimensions: ArenaDimensions,
  radius: number,
): number {
  const maxRadius = Math.max(0, Math.min(dimensions.width, dimensions.height) * 0.5 - radius)
  if (maxRadius === 0) return 0
  const percentage = clamp(modifier.wanderWidthPercentage ?? 0.7, 0, 1)
  return clamp(maxRadius * percentage, 0, maxRadius)
}

function getAngularSpeed(modifier: GravityWellModifier): number {
  const raw = Number.isFinite(modifier.wanderSpeed) ? Number(modifier.wanderSpeed) : 0.55
  return Math.max(0, raw)
}

export function updateJupiterState(
  state: JupiterState,
  modifier: GravityWellModifier,
  dt: number,
  dimensions: ArenaDimensions,
): void {
  if (!modifier.enabled) {
    resetJupiterState(state, dimensions)
    return
  }

  const radius = Math.max(0, modifier.radius)
  const centerX = dimensions.width * 0.5
  const centerY = dimensions.height * 0.5
  const orbitRadius = getOrbitRadius(modifier, dimensions, radius)
  const angularSpeed = getAngularSpeed(modifier)

  if (!state.initialized) {
    state.angle = Math.random() * Math.PI * 2
    state.initialized = true
  }

  state.angle += angularSpeed * dt
  const tau = Math.PI * 2
  if (!Number.isFinite(state.angle)) {
    state.angle = 0
  } else {
    state.angle = state.angle % tau
    if (state.angle < 0) state.angle += tau
  }

  state.x = centerX + Math.cos(state.angle) * orbitRadius
  state.y = centerY + Math.sin(state.angle) * orbitRadius
}

interface JupiterModParams {
  getModifier(): GravityWellModifier
  getArenaDimensions(): ArenaDimensions
}

export interface JupiterMod extends ManagedMod {
  getActiveWells(): ActiveGravityWell[]
}

export function createJupiterMod(params: JupiterModParams): JupiterMod {
  const state: JupiterState = createJupiterState(params.getArenaDimensions())

  const getModifier = () => params.getModifier()
  const getDimensions = () => params.getArenaDimensions()

  const resetState = () => {
    resetJupiterState(state, getDimensions())
  }

  return {
    key: 'jupiter',
    isEnabled: () => Boolean(getModifier().enabled),
    onEnabled() {
      resetState()
    },
    onTick(dt: number) {
      updateJupiterState(state, getModifier(), dt, getDimensions())
    },
    onDisabled() {
      resetState()
    },
    onReset() {
      resetState()
    },
    getActiveWells() {
      return getJupiterWells(state, getModifier())
    },
  }
}
