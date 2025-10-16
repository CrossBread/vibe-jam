/*
 * Copyright (c) 2025. CrossBread Tech All rights reserved.
 */

import type { GravityWellModifier } from '../../../devtools'
import { createActiveWell, type ActiveGravityWell } from '../shared'
import type { DivotsState } from './divotsModifier'

type DivotsModifierConfig = GravityWellModifier & {
  maxDivots?: number
  spawnMargin?: number
}

export function getDivotsWells(
  state: DivotsState,
  modifier: DivotsModifierConfig,
): ActiveGravityWell[] {
  if (!modifier.enabled || state.wells.length === 0) return []
  return state.wells.map(well => createActiveWell('divots', well, modifier))
}
