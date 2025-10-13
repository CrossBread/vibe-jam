import type { GravityWellModifier } from '../../../devtools'
import { createActiveWell, toGravityFalloffValue, type ActiveGravityWell } from '../shared'
import type { GopherState } from './gopherModifier'

export function getGopherWells(
  state: GopherState,
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
  return [createActiveWell('gopher', well, modifier)]
}
