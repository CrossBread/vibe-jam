import type { GravityWellModifier } from '../../../devtools'
import type { ModifierBuilder } from '../../shared'
import { createPaddlePotionEditor } from '../paddlePotion/paddlePotionEditor'

type DrinkMeModifierConfig = GravityWellModifier & {
  objectRadius?: number
  spawnCount?: number
  shrinkAmount?: number
  objectColor?: string
}

export const createDrinkMeModifier: ModifierBuilder<DrinkMeModifierConfig> = context =>
  createPaddlePotionEditor({ includeGrowControl: false })(context)
