import type { GravityWellModifier } from '../../../devtools'
import type { ManagedMod } from '../../modManager'
import type { ActiveGravityWell, ArenaDimensions } from '../shared'
import {
  createJupiterState,
  resetJupiterState,
  updateJupiterState,
  type JupiterState,
} from './jupiterModifier'
import { getJupiterWells } from './jupiterView'

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
