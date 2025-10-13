import type { BallModifierKey, BallModifiers } from '../../devtools'
import type { ModifierBuilder } from '../shared'
import { createBumShuffleModifier } from './bumShuffle'
import { createKiteModifier } from './kite'
import { createMeteorModifier } from './meteor'
import { createPollokModifier } from './pollok'
import { createSnowballModifier } from './snowball'

type BallBuilderMap = {
  [K in BallModifierKey]: ModifierBuilder<BallModifiers[K]>
}

export const ballModifierBuilders: BallBuilderMap = {
  kite: createKiteModifier,
  bumShuffle: createBumShuffleModifier,
  pollok: createPollokModifier,
  snowball: createSnowballModifier,
  meteor: createMeteorModifier,
}
