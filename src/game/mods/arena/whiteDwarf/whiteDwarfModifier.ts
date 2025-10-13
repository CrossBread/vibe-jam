import type { GravityWellModifier } from '../../../devtools'
import type { ArenaDimensions, StoredWell } from '../shared'
import { createCenteredWell } from '../gravityWell/gravityWellModifier'

export function getWhiteDwarfWell(
  modifier: GravityWellModifier,
  dimensions: ArenaDimensions,
): StoredWell {
  return createCenteredWell(modifier, dimensions)
}
