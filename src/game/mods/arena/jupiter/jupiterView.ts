/*
 * Copyright (c) 2025. CrossBread Tech All rights reserved.
 */

import type { GravityWellModifier } from '../../../devtools'
import { createActiveWell, toGravityFalloffValue, type ActiveGravityWell } from '../shared'
import type { JupiterState } from './jupiterModifier'

export function getJupiterWells(
  state: JupiterState,
  modifier: GravityWellModifier,
): ActiveGravityWell[] {
  if (!modifier.enabled) return []

  const well = {
    x: state.x,
    y: state.y,
    gravityStrength: modifier.gravityStrength,
    gravityFalloff: toGravityFalloffValue(modifier.gravityFalloff),
    radius: modifier.radius,
  }

  return [createActiveWell('jupiter', well, modifier)]
}
