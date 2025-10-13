import type { GravityWellModifier } from '../../../devtools'
import { getPaddlePotionObjects } from '../paddlePotion/paddlePotionView'
import type { DrinkMeState } from './drinkMeModifier'

type DrinkMeModifierConfig = GravityWellModifier & { objectRadius?: number; spawnCount?: number }

export function getDrinkMeObjects(state: DrinkMeState, modifier: DrinkMeModifierConfig) {
  return getPaddlePotionObjects(state, modifier)
}
