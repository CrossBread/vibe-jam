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
import { getGopherWells } from './gopherView'

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

interface GopherModParams {
  getModifier(): GravityWellModifier
  getArenaDimensions(): ArenaDimensions
}

export interface GopherMod extends ManagedMod {
  getActiveWells(): ActiveGravityWell[]
}

export function createGopherMod(params: GopherModParams): GopherMod {
  const state: GopherState = createGopherState(params.getArenaDimensions())

  const getModifier = () => params.getModifier()
  const getDimensions = () => params.getArenaDimensions()

  const resetState = () => {
    resetGopherState(state, getDimensions())
  }

  return {
    key: 'gopher',
    isEnabled: () => Boolean(getModifier().enabled),
    onEnabled() {
      resetState()
    },
    onTick(dt: number) {
      updateGopherState(state, getModifier(), dt, getDimensions())
    },
    onDisabled() {
      resetState()
    },
    onReset() {
      resetState()
    },
    getActiveWells() {
      return getGopherWells(state, getModifier())
    },
  }
}
