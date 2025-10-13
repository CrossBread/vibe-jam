import type { GravityWellModifier } from '../../../devtools'
import type { PaddlePotionState } from './paddlePotionModifier'
import { getPotionObjects } from './paddlePotionModifier'

export function getPaddlePotionObjects(
  state: PaddlePotionState,
  modifier: GravityWellModifier & { objectRadius?: number; spawnCount?: number },
) {
  return getPotionObjects(state, modifier)
}
