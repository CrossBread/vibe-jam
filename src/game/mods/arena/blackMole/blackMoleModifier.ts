import type { GravityWellModifier } from '../../../devtools'
import type { ArenaDimensions } from '../shared'
import {
  createMovingWellState,
  resetMovingWellState,
  updateMovingWellState,
  type MovingWellState,
} from '../gravityWell/gravityWellModifier'

export type BlackMoleState = MovingWellState

export const createBlackMoleState = createMovingWellState
export const resetBlackMoleState = resetMovingWellState

export function updateBlackMoleState(
  state: BlackMoleState,
  modifier: GravityWellModifier,
  dt: number,
  dimensions: ArenaDimensions,
) {
  updateMovingWellState(state, modifier, dt, dimensions)
}
