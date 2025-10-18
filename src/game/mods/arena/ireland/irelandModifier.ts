/*
 * Copyright (c) 2025. CrossBread Tech All rights reserved.
 */

import { randomRange, toGravityFalloffValue } from '../shared'
import { getIrelandWells } from './irelandView'
import type { GravityWellModifier } from '../../../devtools'
import type { ManagedMod } from '../../modManager'
import type { ActiveGravityWell, ArenaDimensions, StoredWell } from '../shared'
type IrelandModifierConfig = GravityWellModifier & {
  wellCount?: number
  minGravityStrength?: number
  maxGravityStrength?: number
  minGravityFalloff?: number
  maxGravityFalloff?: number
  minRadius?: number
  maxRadius?: number
}

export interface IrelandState {
  wells: StoredWell[]
  needsRegeneration: boolean
}

export function createIrelandState(): IrelandState {
  return {
    wells: [],
    needsRegeneration: true,
  }
}

export function clearIrelandWells(state: IrelandState) {
  if (state.wells.length > 0) {
    state.wells.length = 0
  }
  state.needsRegeneration = true
}

export function markIrelandNeedsRegeneration(state: IrelandState) {
  state.needsRegeneration = true
}

export function ensureIrelandWells(
  state: IrelandState,
  modifier: IrelandModifierConfig,
  dimensions: ArenaDimensions,
) {
  if (!modifier.enabled) {
    clearIrelandWells(state)
    return
  }

  if (state.needsRegeneration || state.wells.length === 0) {
    regenerateIrelandWells(state, modifier, dimensions)
    state.needsRegeneration = false
  }
}

export function regenerateIrelandWells(
  state: IrelandState,
  modifier: IrelandModifierConfig,
  dimensions: ArenaDimensions,
) {
  state.wells.length = 0

  const wellCount = Math.max(1, Math.floor(modifier.wellCount ?? 14))
  const [minStrength, maxStrength] = resolveRange(
    modifier.minGravityStrength,
    modifier.maxGravityStrength,
    modifier.gravityStrength * 0.5,
    modifier.gravityStrength * 1.5,
  )
  const [minFalloff, maxFalloff] = resolveRange(
    modifier.minGravityFalloff,
    modifier.maxGravityFalloff,
    modifier.gravityFalloff * 0.5,
    modifier.gravityFalloff * 1.5,
  )
  const [minRadius, maxRadius] = resolveRange(
    modifier.minRadius,
    modifier.maxRadius,
    Math.max(16, modifier.radius * 0.5),
    Math.max(20, modifier.radius * 1.25),
  )

  for (let i = 0; i < wellCount; i++) {
    const radius = randomRange(minRadius, maxRadius)
    const margin = Math.max(20, radius)
    const minX = Math.max(margin, 0)
    const maxX = Math.min(dimensions.width - margin, dimensions.width)
    const minY = Math.max(margin, 0)
    const maxY = Math.min(dimensions.height - margin, dimensions.height)
    const x = minX <= maxX ? randomRange(minX, maxX) : dimensions.width * 0.5
    const y = minY <= maxY ? randomRange(minY, maxY) : dimensions.height * 0.5
    const gravityStrength = randomRange(minStrength, maxStrength)
    const gravityFalloff = randomRange(minFalloff, maxFalloff)
    state.wells.push({
      x,
      y,
      gravityStrength,
      gravityFalloff: toGravityFalloffValue(gravityFalloff),
      radius,
    })
  }

  state.needsRegeneration = false
}

function resolveRange(
  minValue: number | undefined,
  maxValue: number | undefined,
  fallbackMin: number,
  fallbackMax: number,
): [number, number] {
  let min = typeof minValue === 'number' && Number.isFinite(minValue) ? minValue : fallbackMin
  let max = typeof maxValue === 'number' && Number.isFinite(maxValue) ? maxValue : fallbackMax
  if (min > max) {
    const originalMin = min
    min = max
    max = originalMin
  }
  return [min, max]
}

interface IrelandModParams {
  getModifier(): IrelandModifierConfig
  getArenaDimensions(): ArenaDimensions
}

export interface IrelandMod extends ManagedMod {
  markNeedsRegeneration(): void
  rebuildWells(): void
  clearWells(): void
  getActiveWells(): ActiveGravityWell[]
}

export function createIrelandMod(params: IrelandModParams): IrelandMod {
  const state: IrelandState = createIrelandState()

  const getModifier = () => params.getModifier()
  const getDimensions = () => params.getArenaDimensions()

  const clearState = () => {
    clearIrelandWells(state)
  }

  const rebuildState = () => {
    regenerateIrelandWells(state, getModifier(), getDimensions())
  }

  return {
    key: 'ireland',
    isEnabled: () => Boolean(getModifier().enabled),
    onEnabled() {
      rebuildState()
    },
    onTick() {
      ensureIrelandWells(state, getModifier(), getDimensions())
    },
    onDisabled() {
      clearState()
    },
    onReset() {
      clearState()
    },
    markNeedsRegeneration() {
      markIrelandNeedsRegeneration(state)
    },
    rebuildWells() {
      rebuildState()
    },
    clearWells() {
      clearState()
    },
    getActiveWells() {
      return getIrelandWells(state, getModifier(), getDimensions())
    },
  }
}
