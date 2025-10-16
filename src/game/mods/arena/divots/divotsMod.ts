import type { GravityWellModifier } from '../../../devtools'
import type { ManagedMod } from '../../modManager'
import type { ActiveGravityWell, ArenaDimensions } from '../shared'
import {
  clearDivots,
  createDivotsState,
  spawnDivotWell,
  updateDivotsState,
  type DivotsState,
} from './divotsModifier'
import { getDivotsWells } from './divotsView'

type DivotsModifierConfig = GravityWellModifier & {
  maxDivots?: number
  spawnMargin?: number
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
