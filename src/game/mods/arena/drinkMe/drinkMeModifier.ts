import {
  clearPaddlePotionState,
  createPaddlePotionState,
  maintainPaddlePotionState,
  respawnPaddlePotionObject,
  type PaddlePotionState,
} from '../paddlePotion/paddlePotionModifier'

export type DrinkMeState = PaddlePotionState

export const createDrinkMeState = createPaddlePotionState
export const clearDrinkMeState = clearPaddlePotionState
export const maintainDrinkMeState = maintainPaddlePotionState
export const respawnDrinkMeObject = respawnPaddlePotionObject
