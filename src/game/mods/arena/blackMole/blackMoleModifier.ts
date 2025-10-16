/*
 * Copyright (c) 2025. CrossBread Tech All rights reserved.
 */

import type { GravityWellModifier } from '../../../devtools'
import type { ManagedMod } from '../../modManager'
import type { ActiveGravityWell, ArenaDimensions } from '../shared'
import {
  createMovingWellState,
  resetMovingWellState,
  updateMovingWellState,
  type MovingWellState,
} from '../gravityWell/gravityWellModifier'
import { getBlackMoleWells } from './blackMoleView'

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

interface BlackMoleModParams {
  getModifier(): GravityWellModifier
  getArenaDimensions(): ArenaDimensions
}

export interface BlackMoleMod extends ManagedMod {
  getActiveWells(): ActiveGravityWell[]
}

export function createBlackMoleMod(params: BlackMoleModParams): BlackMoleMod {
  const state: BlackMoleState = createBlackMoleState(params.getArenaDimensions())

  const getModifier = () => params.getModifier()
  const getDimensions = () => params.getArenaDimensions()

  const resetState = () => {
    resetBlackMoleState(state, getDimensions())
  }

  return {
    key: 'blackMole',
    isEnabled: () => Boolean(getModifier().enabled),
    onEnabled() {
      resetState()
    },
    onTick(dt: number) {
      updateBlackMoleState(state, getModifier(), dt, getDimensions())
    },
    onDisabled() {
      resetState()
    },
    onReset() {
      resetState()
    },
    getActiveWells() {
      return getBlackMoleWells(state, getModifier())
    },
  }
}
