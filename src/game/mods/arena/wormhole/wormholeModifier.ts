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
  type PortalConfigDefaults,
  type PortalState,
} from '../portal/portalModifier'
import { drawWormholes } from './wormholeView'

const WORMHOLE_DEFAULTS: PortalConfigDefaults = {
  pairCount: 2,
  radius: 34,
  margin: 92,
  cooldown: 0.18,
  rotationSpeed: 0,
}

export type WormholeState = PortalState

export const createWormholeState = createPortalState
export const clearWormholeState = clearPortalState

export function maintainWormholeState(
  state: WormholeState,
  modifier: GravityWellModifier,
  dimensions: ArenaDimensions,
) {
  maintainPortalState(state, modifier, dimensions, WORMHOLE_DEFAULTS)
}

export function resetWormholeState(
  state: WormholeState,
  modifier: GravityWellModifier,
  dimensions: ArenaDimensions,
) {
  resetPortalState(state, modifier, dimensions, WORMHOLE_DEFAULTS)
}

export function tryResolveWormholeTeleport(
  state: WormholeState,
  modifier: GravityWellModifier,
  dimensions: ArenaDimensions,
  ball: BallLike,
): boolean {
  return tryResolvePortalTeleport(state, modifier, dimensions, ball, WORMHOLE_DEFAULTS)
}

interface WormholeModParams {
  getModifier(): GravityWellModifier
  getArenaDimensions(): ArenaDimensions
  getContext(): CanvasRenderingContext2D
  getBackgroundRgb(): RGBColor
}

export function createWormholeMod(params: WormholeModParams): ManagedMod {
  const state: WormholeState = createWormholeState()

  const getModifier = () => params.getModifier()
  const getDimensions = () => params.getArenaDimensions()

  const maintainState = () => {
    maintainWormholeState(state, getModifier(), getDimensions())
  }

  const resetState = () => {
    resetWormholeState(state, getModifier(), getDimensions())
  }

  return {
    key: 'wormhole',
    isEnabled: () => Boolean(getModifier().enabled),
    onInit() {
      maintainState()
    },
    onEnabled() {
      maintainState()
      resetState()
    },
    onDisabled() {
      clearWormholeState(state)
    },
    onReset() {
      clearWormholeState(state)
    },
    onTick() {
      maintainState()
    },
    onBallReset() {
      maintainState()
      resetState()
    },
    onBallStep(ball: BallLike) {
      return tryResolveWormholeTeleport(state, getModifier(), getDimensions(), ball)
    },
    onDraw() {
      drawWormholes(params.getContext(), state, getModifier(), {
        backgroundRgb: params.getBackgroundRgb(),
      })
    },
  }
}
