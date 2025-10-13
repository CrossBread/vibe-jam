import type { GravityWellModifier } from '../../../devtools'
import { createActiveWell, toGravityFalloffValue, type ActiveGravityWell } from '../shared'
import type { BlackMoleState } from './blackMoleModifier'

export function getBlackMoleWells(
  state: BlackMoleState,
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
  return [createActiveWell('blackMole', well, modifier)]
}
