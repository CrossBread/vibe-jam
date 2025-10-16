import type { GravityWellModifier } from '../../../devtools'
import type { ManagedMod } from '../../modManager'
import type { ActiveGravityWell, ArenaDimensions } from '../shared'
import {
  createGopherState,
  resetGopherState,
  updateGopherState,
  type GopherState,
} from './gopherModifier'
import { getGopherWells } from './gopherView'

interface GopherModParams {
  getModifier(): GravityWellModifier
  getArenaDimensions(): ArenaDimensions
}

export interface GopherMod extends ManagedMod {
  getActiveWells(): ActiveGravityWell[]
}

export function createGopherMod(params: GopherModParams): GopherMod {
  const state: GopherState = createGopherState(params.getArenaDimensions())

  const getModifier = () => params.getModifier()
  const getDimensions = () => params.getArenaDimensions()

  const resetState = () => {
    resetGopherState(state, getDimensions())
  }

  return {
    key: 'gopher',
    isEnabled: () => Boolean(getModifier().enabled),
    onEnabled() {
      resetState()
    },
    onTick(dt: number) {
      updateGopherState(state, getModifier(), dt, getDimensions())
    },
    onDisabled() {
      resetState()
    },
    onReset() {
      resetState()
    },
    getActiveWells() {
      return getGopherWells(state, getModifier())
    },
  }
}
