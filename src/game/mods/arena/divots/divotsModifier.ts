import { randomRange, toGravityFalloffValue } from '../shared'
import { getDivotsWells } from './divotsView'
import type { GravityWellModifier } from '../../../devtools'
import type { ManagedMod } from '../../modManager'
import type { ActiveGravityWell, ArenaDimensions, StoredWell } from '../shared'

type DivotsModifierConfig = GravityWellModifier & {
  maxDivots?: number
  spawnMargin?: number
}

export interface DivotsState {
  wells: StoredWell[]
}

export function createDivotsState(): DivotsState {
  return { wells: [] }
}

export function clearDivots(state: DivotsState) {
  if (state.wells.length > 0) {
    state.wells.length = 0
  }
}

export function updateDivotsState(state: DivotsState, modifier: DivotsModifierConfig) {
  if (!modifier.enabled) {
    clearDivots(state)
    return
  }

  const maxDivots = Math.max(1, Math.floor(modifier.maxDivots ?? 12))
  if (state.wells.length > maxDivots) {
    state.wells.splice(0, state.wells.length - maxDivots)
  }
}

export function spawnDivotWell(
  state: DivotsState,
  modifier: DivotsModifierConfig,
  dimensions: ArenaDimensions,
) {
  if (!modifier.enabled) return

  const maxDivots = Math.max(1, Math.floor(modifier.maxDivots ?? 12))
  const margin = Math.max(20, modifier.spawnMargin ?? modifier.radius ?? 0)
  const minX = Math.max(margin, 0)
  const maxX = Math.min(dimensions.width - margin, dimensions.width)
  const minY = Math.max(margin, 0)
  const maxY = Math.min(dimensions.height - margin, dimensions.height)
  const x = minX <= maxX ? randomRange(minX, maxX) : dimensions.width * 0.5
  const y = minY <= maxY ? randomRange(minY, maxY) : dimensions.height * 0.5

  state.wells.push({
    x,
    y,
    gravityStrength: modifier.gravityStrength,
    gravityFalloff: toGravityFalloffValue(modifier.gravityFalloff),
    radius: modifier.radius,
  })

  if (state.wells.length > maxDivots) {
    state.wells.splice(0, state.wells.length - maxDivots)
  }
}

interface DivotsModParams {
  getModifier(): DivotsModifierConfig
  getArenaDimensions(): ArenaDimensions
}

export interface DivotsMod extends ManagedMod {
  spawnWell(): void
  clearWells(): void
  getActiveWells(): ActiveGravityWell[]
}

export function createDivotsMod(params: DivotsModParams): DivotsMod {
  const state: DivotsState = createDivotsState()

  const getModifier = () => params.getModifier()
  const getDimensions = () => params.getArenaDimensions()

  const maintainState = () => {
    updateDivotsState(state, getModifier())
  }

  const clearState = () => {
    clearDivots(state)
  }

  return {
    key: 'divots',
    isEnabled: () => Boolean(getModifier().enabled),
    onEnabled() {
      maintainState()
    },
    onTick() {
      maintainState()
    },
    onDisabled() {
      clearState()
    },
    onReset() {
      clearState()
    },
    spawnWell() {
      spawnDivotWell(state, getModifier(), getDimensions())
    },
    clearWells() {
      clearState()
    },
    getActiveWells() {
      return getDivotsWells(state, getModifier())
    },
  }
}
