import type { BallModifierKey, BallModifiers } from '../../devtools'
import type { ModifierBuilder } from '../shared'
import { createBumShuffleModifier } from './bumShuffle/bumShuffleEditor'
import { createKiteModifier } from './kite/kiteEditor'
import { createMeteorModifier } from './meteor/meteorEditor'
import { createPollokModifier } from './pollok/pollokEditor'
import { createSnowballModifier } from './snowball/snowballEditor'

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
