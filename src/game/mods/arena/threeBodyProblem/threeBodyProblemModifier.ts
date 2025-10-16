/*
 * Copyright (c) 2025. CrossBread Tech All rights reserved.
 */

import type { ThreeBodyProblemModifier } from '../../../devtools'
import type { ManagedMod } from '../../modManager'
import {
  clamp,
  createActiveWell,
  toGravityFalloffValue,
  type ActiveGravityWell,
  type ArenaDimensions,
  type StoredWell,
} from '../shared'

export interface ThreeBodyProblemState {
  angle: number
  orbitX: number
  orbitY: number
  initialized: boolean
}

export function createThreeBodyProblemState(dimensions: ArenaDimensions): ThreeBodyProblemState {
  const centerX = dimensions.width * 0.5
  const centerY = dimensions.height * 0.5
  return {
    angle: 0,
    orbitX: centerX,
    orbitY: centerY,
    initialized: false,
  }
}

export function resetThreeBodyProblemState(
  state: ThreeBodyProblemState,
  dimensions: ArenaDimensions,
): void {
  const centerX = dimensions.width * 0.5
  const centerY = dimensions.height * 0.5
  state.angle = 0
  state.orbitX = centerX
  state.orbitY = centerY
  state.initialized = false
}

function getOrbitSpeed(modifier: ThreeBodyProblemModifier): number {
  const raw = Number(modifier.orbitSpeed)
  if (!Number.isFinite(raw)) return 0.85
  return Math.max(0, raw)
}

function getOrbitRadius(modifier: ThreeBodyProblemModifier): number {
  const raw = Number(modifier.orbitRadius)
  if (!Number.isFinite(raw)) return 36
  return Math.max(0, raw)
}

function getOrbitDistance(
  modifier: ThreeBodyProblemModifier,
  dimensions: ArenaDimensions,
  orbitRadius: number,
): number {
  const raw = Number(modifier.orbitDistance)
  const centerX = dimensions.width * 0.5
  const centerY = dimensions.height * 0.5
  const maxDistance = Math.max(0, Math.min(centerX, centerY) - orbitRadius)
  if (!Number.isFinite(raw)) {
    return clamp(Math.min(centerX, centerY) * 0.6, 0, maxDistance)
  }
  return clamp(raw, 0, maxDistance)
}

function createCenterWell(
  modifier: ThreeBodyProblemModifier,
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

function createOrbitWell(
  state: ThreeBodyProblemState,
  modifier: ThreeBodyProblemModifier,
): StoredWell {
  const strength = Number.isFinite(modifier.orbitGravityStrength)
    ? Number(modifier.orbitGravityStrength)
    : modifier.gravityStrength
  const falloff = Number.isFinite(modifier.orbitGravityFalloff)
    ? Number(modifier.orbitGravityFalloff)
    : modifier.gravityFalloff
  const radius = getOrbitRadius(modifier)

  return {
    x: state.orbitX,
    y: state.orbitY,
    gravityStrength: strength,
    gravityFalloff: toGravityFalloffValue(falloff),
    radius,
  }
}

export function updateThreeBodyProblemState(
  state: ThreeBodyProblemState,
  modifier: ThreeBodyProblemModifier,
  dt: number,
  dimensions: ArenaDimensions,
): void {
  if (!modifier.enabled) {
    resetThreeBodyProblemState(state, dimensions)
    return
  }

  if (!state.initialized) {
    state.angle = Math.random() * Math.PI * 2
    state.initialized = true
  }

  const orbitRadius = getOrbitRadius(modifier)
  const orbitDistance = getOrbitDistance(modifier, dimensions, orbitRadius)
  const centerX = dimensions.width * 0.5
  const centerY = dimensions.height * 0.5
  const orbitSpeed = getOrbitSpeed(modifier)

  state.angle += orbitSpeed * dt
  if (!Number.isFinite(state.angle)) {
    state.angle = 0
  } else {
    const tau = Math.PI * 2
    state.angle = state.angle % tau
    if (state.angle < 0) state.angle += tau
  }

  state.orbitX = centerX + Math.cos(state.angle) * orbitDistance
  state.orbitY = centerY + Math.sin(state.angle) * orbitDistance
}

interface ThreeBodyProblemModParams {
  getModifier(): ThreeBodyProblemModifier
  getArenaDimensions(): ArenaDimensions
}

export interface ThreeBodyProblemMod extends ManagedMod {
  getActiveWells(): ActiveGravityWell[]
}

export function createThreeBodyProblemMod(params: ThreeBodyProblemModParams): ThreeBodyProblemMod {
  const state = createThreeBodyProblemState(params.getArenaDimensions())

  const getModifier = () => params.getModifier()
  const getDimensions = () => params.getArenaDimensions()

  const resetState = () => {
    resetThreeBodyProblemState(state, getDimensions())
  }

  return {
    key: 'threeBodyProblem',
    isEnabled: () => Boolean(getModifier().enabled),
    onEnabled() {
      resetState()
    },
    onTick(dt: number) {
      updateThreeBodyProblemState(state, getModifier(), dt, getDimensions())
    },
    onDisabled() {
      resetState()
    },
    onReset() {
      resetState()
    },
    getActiveWells() {
      const modifier = getModifier()
      if (!modifier.enabled) return []

      const dimensions = getDimensions()
      const wells: ActiveGravityWell[] = []

      const center = createActiveWell('threeBodyProblem', createCenterWell(modifier, dimensions), modifier)
      wells.push(center)

      const orbitStored = createOrbitWell(state, modifier)
      const orbit = createActiveWell('threeBodyProblem', orbitStored, modifier)
      orbit.positiveTint = modifier.orbitPositiveTint ?? '#38bdf8'
      orbit.negativeTint = modifier.orbitNegativeTint ?? '#bae6fd'
      wells.push(orbit)

      return wells
    },
  }
}
