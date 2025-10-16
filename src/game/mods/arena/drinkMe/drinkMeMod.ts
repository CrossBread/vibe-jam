import type { GravityWellModifier } from '../../../devtools'
import type { ManagedMod } from '../../modManager'
import type { ArenaDimensions } from '../shared'
import {
  clearDrinkMeState,
  createDrinkMeState,
  maintainDrinkMeState,
  respawnDrinkMeObject,
  type DrinkMeState,
} from './drinkMeModifier'
import { getDrinkMeObjects } from './drinkMeView'

type DrinkMeModifierConfig = GravityWellModifier & {
  objectRadius?: number
  spawnCount?: number
}

interface DrinkMeModParams {
  getModifier(): DrinkMeModifierConfig
  getArenaDimensions(): ArenaDimensions
}

export interface DrinkMeMod extends ManagedMod {
  getObjects(): { x: number; y: number; radius: number }[]
  respawnObject(
    index: number,
    avoid?: { x: number; y: number; radius: number },
  ): void
}

export function createDrinkMeMod(params: DrinkMeModParams): DrinkMeMod {
  const state: DrinkMeState = createDrinkMeState()

  const getModifier = () => params.getModifier()
  const getDimensions = () => params.getArenaDimensions()

  const maintainState = () => {
    maintainDrinkMeState(state, getModifier(), getDimensions())
  }

  const clearState = () => {
    clearDrinkMeState(state)
  }

  return {
    key: 'drinkMe',
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
      return getDrinkMeObjects(state, getModifier())
    },
    respawnObject(index, avoid) {
      respawnDrinkMeObject(state, index, getModifier(), getDimensions(), avoid)
    },
  }
}
