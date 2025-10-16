/*
 * Copyright (c) 2025. CrossBread Tech All rights reserved.
 */

import type { GravityWellModifier } from '../../../devtools'
import type { ActiveGravityWell, ArenaDimensions } from '../shared'
import { createActiveWell } from '../shared'
import { getBlackHoleWell } from './blackHoleModifier'

export function getBlackHoleWells(
  modifier: GravityWellModifier,
  dimensions: ArenaDimensions,
): ActiveGravityWell[] {
  if (!modifier.enabled) return []
  const well = getBlackHoleWell(modifier, dimensions)
  return [createActiveWell('blackHole', well, modifier)]
}
