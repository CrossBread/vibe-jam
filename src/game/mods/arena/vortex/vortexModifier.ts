import type { GravityWellModifier } from '../../../devtools'
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
  ball: { x: number; y: number; vx: number; vy: number; radius: number; portalCooldown?: number },
): boolean {
  return tryResolvePortalTeleport(state, modifier, dimensions, ball, VORTEX_DEFAULTS)
}

