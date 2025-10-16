import type { GravityWellModifier } from '../../../devtools'
import type { ManagedMod } from '../../modManager'
import type { ArenaDimensions } from '../shared'
import {
  clearTeaPartyState,
  createTeaPartyState,
  maintainTeaPartyState,
  respawnTeaPartyObject,
  type TeaPartyState,
} from './teaPartyModifier'
import { getTeaPartyObjects } from './teaPartyView'

type TeaPartyModifierConfig = GravityWellModifier & {
  objectRadius?: number
  spawnCount?: number
}

interface TeaPartyModParams {
  getModifier(): TeaPartyModifierConfig
  getArenaDimensions(): ArenaDimensions
}

export interface TeaPartyMod extends ManagedMod {
  getObjects(): { x: number; y: number; radius: number }[]
  respawnObject(
    index: number,
    avoid?: { x: number; y: number; radius: number },
  ): void
}

export function createTeaPartyMod(params: TeaPartyModParams): TeaPartyMod {
  const state: TeaPartyState = createTeaPartyState()

  const getModifier = () => params.getModifier()
  const getDimensions = () => params.getArenaDimensions()

  const maintainState = () => {
    maintainTeaPartyState(state, getModifier(), getDimensions())
  }

  const clearState = () => {
    clearTeaPartyState(state)
  }

  return {
    key: 'teaParty',
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
    getObjects() {
      return getTeaPartyObjects(state, getModifier())
    },
    respawnObject(index, avoid) {
      respawnTeaPartyObject(state, index, getModifier(), getDimensions(), avoid)
    },
  }
}
