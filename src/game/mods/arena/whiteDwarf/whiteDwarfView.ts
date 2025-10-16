/*
 * Copyright (c) 2025. CrossBread Tech All rights reserved.
 */

import type { GravityWellModifier } from '../../../devtools'
import { createActiveWell, type ActiveGravityWell, type ArenaDimensions } from '../shared'
import { getWhiteDwarfWell } from './whiteDwarfModifier'

export function getWhiteDwarfWells(
  modifier: GravityWellModifier,
  dimensions: ArenaDimensions,
): ActiveGravityWell[] {
  if (!modifier.enabled) return []
  const well = getWhiteDwarfWell(modifier, dimensions)
  return [createActiveWell('whiteDwarf', well, modifier)]
}
