/*
 * Copyright (c) 2025. CrossBread Tech All rights reserved.
 */

import type { GravityWellModifier } from '../../../devtools'
import { getPaddlePotionObjects } from '../paddlePotion/paddlePotionView'
import type { TeaPartyState } from './teaPartyModifier'

type TeaPartyModifierConfig = GravityWellModifier & { objectRadius?: number; spawnCount?: number }

export function getTeaPartyObjects(state: TeaPartyState, modifier: TeaPartyModifierConfig) {
  return getPaddlePotionObjects(state, modifier)
}
