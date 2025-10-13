import type { GravityWellModifier } from '../../../devtools'
import { createActiveWell, toGravityFalloffValue, type ActiveGravityWell } from '../shared'
import type { ArenaDimensions } from '../shared'
import type { IrelandState } from './irelandModifier'

type IrelandModifierConfig = GravityWellModifier & {
  wellCount?: number
  minGravityStrength?: number
  maxGravityStrength?: number
  minGravityFalloff?: number
  maxGravityFalloff?: number
  minRadius?: number
  maxRadius?: number
}

export function getIrelandWells(
  state: IrelandState,
  modifier: IrelandModifierConfig,
  dimensions: ArenaDimensions,
): ActiveGravityWell[] {
  if (!modifier.enabled) return []

  const wells =
    state.wells.length > 0
      ? state.wells
      : [
          {
            x: dimensions.width * 0.5,
            y: dimensions.height * 0.5,
            gravityStrength: modifier.gravityStrength,
            gravityFalloff: toGravityFalloffValue(modifier.gravityFalloff),
            radius: modifier.radius,
          },
        ]

  return wells.map(well => createActiveWell('ireland', well, modifier))
}
