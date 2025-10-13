import {
  clearPaddlePotionState,
  createPaddlePotionState,
  maintainPaddlePotionState,
  respawnPaddlePotionObject,
  type PaddlePotionState,
} from '../paddlePotion/paddlePotionModifier'

export type TeaPartyState = PaddlePotionState

export const createTeaPartyState = createPaddlePotionState
export const clearTeaPartyState = clearPaddlePotionState
export const maintainTeaPartyState = maintainPaddlePotionState
export const respawnTeaPartyObject = respawnPaddlePotionObject
