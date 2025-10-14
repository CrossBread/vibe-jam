import type { GravityWellModifier } from '../../../devtools'
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
  ball: { x: number; y: number; vx: number; vy: number; radius: number; portalCooldown?: number },
): boolean {
  return tryResolvePortalTeleport(state, modifier, dimensions, ball, WORMHOLE_DEFAULTS)
}

