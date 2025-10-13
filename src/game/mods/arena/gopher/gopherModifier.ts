import type { GravityWellModifier } from '../../../devtools'
import type { ArenaDimensions } from '../shared'
import {
  createMovingWellState,
  resetMovingWellState,
  updateMovingWellState,
  type MovingWellState,
} from '../gravityWell/gravityWellModifier'

export type GopherState = MovingWellState

export const createGopherState = createMovingWellState
export const resetGopherState = resetMovingWellState

export function updateGopherState(
  state: GopherState,
  modifier: GravityWellModifier,
  dt: number,
  dimensions: ArenaDimensions,
) {
  updateMovingWellState(state, modifier, dt, dimensions)
}
