import type { GravityWellModifier } from '../../../devtools'
import type { ManagedMod } from '../../modManager'
import type { ActiveGravityWell, ArenaDimensions } from '../shared'
import {
  createBlackMoleState,
  resetBlackMoleState,
  updateBlackMoleState,
  type BlackMoleState,
} from './blackMoleModifier'
import { getBlackMoleWells } from './blackMoleView'

interface BlackMoleModParams {
  getModifier(): GravityWellModifier
  getArenaDimensions(): ArenaDimensions
}

export interface BlackMoleMod extends ManagedMod {
  getActiveWells(): ActiveGravityWell[]
}

export function createBlackMoleMod(params: BlackMoleModParams): BlackMoleMod {
  const state: BlackMoleState = createBlackMoleState(params.getArenaDimensions())

  const getModifier = () => params.getModifier()
  const getDimensions = () => params.getArenaDimensions()

  const resetState = () => {
    resetBlackMoleState(state, getDimensions())
  }

  return {
    key: 'blackMole',
    isEnabled: () => Boolean(getModifier().enabled),
    onEnabled() {
      resetState()
    },
    onTick(dt: number) {
      updateBlackMoleState(state, getModifier(), dt, getDimensions())
    },
    onDisabled() {
      resetState()
    },
    onReset() {
      resetState()
    },
    getActiveWells() {
      return getBlackMoleWells(state, getModifier())
    },
  }
}
