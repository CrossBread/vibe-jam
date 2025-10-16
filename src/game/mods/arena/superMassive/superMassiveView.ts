/*
 * Copyright (c) 2025. CrossBread Tech All rights reserved.
 */

import type { GravityWellModifier } from '../../../devtools'
import { createActiveWell, type ActiveGravityWell, type ArenaDimensions } from '../shared'
import { getSuperMassiveWell } from './superMassiveModifier'

export function getSuperMassiveWells(
  modifier: GravityWellModifier,
  dimensions: ArenaDimensions,
): ActiveGravityWell[] {
  if (!modifier.enabled) return []
  const well = getSuperMassiveWell(modifier, dimensions)
  return [createActiveWell('superMassive', well, modifier)]
}
