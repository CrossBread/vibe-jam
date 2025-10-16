/*
 * Copyright (c) 2025. CrossBread Tech All rights reserved.
 */

import type { GravityWellModifier } from '../../../devtools'
import type { RGBColor } from '../../ball/shared'
import type { ManagedMod, BallLike } from '../../modManager'
import type { ArenaDimensions } from '../shared'
import {
  clearPortalState,
  createPortalState,
  maintainPortalState,
  resetPortalState,
  tryResolvePortalTeleport,
  updatePortalState,
  type PortalConfigDefaults,
  type PortalState,
} from '../portal/portalModifier'
import { drawVortexPortals } from './vortexView'

const VORTEX_DEFAULTS: PortalConfigDefaults = {
  pairCount: 2,
  radius: 34,
  margin: 96,
  cooldown: 0.18,
  rotationSpeed: Math.PI,
}

export type VortexState = PortalState

export const createVortexState = createPortalState
export const clearVortexState = clearPortalState

export function maintainVortexState(
  state: VortexState,
  modifier: GravityWellModifier,
  dimensions: ArenaDimensions,
) {
  maintainPortalState(state, modifier, dimensions, VORTEX_DEFAULTS)
}

export function resetVortexState(
  state: VortexState,
  modifier: GravityWellModifier,
  dimensions: ArenaDimensions,
) {
  resetPortalState(state, modifier, dimensions, VORTEX_DEFAULTS)
}

export function updateVortexState(state: VortexState, modifier: GravityWellModifier, dt: number) {
  updatePortalState(state, modifier, dt)
}

export function tryResolveVortexTeleport(
  state: VortexState,
  modifier: GravityWellModifier,
  dimensions: ArenaDimensions,
  ball: BallLike,
): boolean {
  return tryResolvePortalTeleport(state, modifier, dimensions, ball, VORTEX_DEFAULTS)
}

interface VortexModParams {
  getModifier(): GravityWellModifier
  getArenaDimensions(): ArenaDimensions
  getContext(): CanvasRenderingContext2D
  getBackgroundRgb(): RGBColor
}

export function createVortexMod(params: VortexModParams): ManagedMod {
  const state: VortexState = createVortexState()

  const getModifier = () => params.getModifier()
  const getDimensions = () => params.getArenaDimensions()

  const maintainState = () => {
    maintainVortexState(state, getModifier(), getDimensions())
  }

  const resetState = () => {
    resetVortexState(state, getModifier(), getDimensions())
  }

  return {
    key: 'vortex',
    isEnabled: () => Boolean(getModifier().enabled),
    onInit() {
      maintainState()
    },
    onEnabled() {
      maintainState()
      resetState()
    },
    onDisabled() {
      clearVortexState(state)
    },
    onReset() {
      clearVortexState(state)
    },
    onTick(dt) {
      maintainState()
      updateVortexState(state, getModifier(), dt)
    },
    onBallReset() {
      maintainState()
      resetState()
    },
    onBallStep(ball: BallLike) {
      return tryResolveVortexTeleport(state, getModifier(), getDimensions(), ball)
    },
    onDraw() {
      drawVortexPortals(params.getContext(), state, getModifier(), {
        backgroundRgb: params.getBackgroundRgb(),
      })
    },
  }
}
