import type { GravityWellModifier } from '../../../devtools'
import type { ModifierBuilder } from '../../shared'
import { createPaddlePotionEditor } from '../paddlePotion/paddlePotionEditor'

type TeaPartyModifierConfig = GravityWellModifier & {
  objectRadius?: number
  spawnCount?: number
  shrinkAmount?: number
  growAmount?: number
  objectColor?: string
}

export const createTeaPartyModifier: ModifierBuilder<TeaPartyModifierConfig> = context =>
  createPaddlePotionEditor({ includeGrowControl: true })(context)
