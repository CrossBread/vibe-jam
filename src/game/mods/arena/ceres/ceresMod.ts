import type { GravityWellModifier } from '../../../devtools'
import type { ManagedMod } from '../../modManager'
import type { ActiveGravityWell, ArenaDimensions } from '../shared'
import {
  createCeresState,
  resetCeresState,
  updateCeresState,
  type CeresState,
} from './ceresModifier'
import { getCeresWells } from './ceresView'

interface CeresModParams {
  getModifier(): GravityWellModifier
  getArenaDimensions(): ArenaDimensions
}

export interface CeresMod extends ManagedMod {
  getActiveWells(): ActiveGravityWell[]
}

export function createCeresMod(params: CeresModParams): CeresMod {
  const state: CeresState = createCeresState(params.getArenaDimensions())

  const getModifier = () => params.getModifier()
  const getDimensions = () => params.getArenaDimensions()

  const resetState = () => {
    resetCeresState(state, getDimensions())
  }

  return {
    key: 'ceres',
    isEnabled: () => Boolean(getModifier().enabled),
    onEnabled() {
      resetState()
    },
    onTick(dt: number) {
      updateCeresState(state, getModifier(), dt, getDimensions())
    },
    onDisabled() {
      resetState()
    },
    onReset() {
      resetState()
    },
    getActiveWells() {
      return getCeresWells(state, getModifier())
    },
  }
}
