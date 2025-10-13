import type { KiteModifier } from '../../../devtools'
import { addTrailPoint, clampTrailLength, type TrailPoint } from '../shared'

export const MAX_KITE_HISTORY = 240

export interface KiteState {
  trail: TrailPoint[]
}

export function createKiteState(): KiteState {
  return { trail: [] }
}

export function updateKiteTrail(
  state: KiteState,
  modifier: KiteModifier,
  x: number,
  y: number,
  radius: number,
) {
  if (!modifier.enabled) {
    clearKiteTrail(state)
    return
  }

  const maxLength = clampTrailLength(modifier.tailLength, 4, MAX_KITE_HISTORY)
  addTrailPoint(state.trail, x, y, maxLength, 0, radius)
}

export function clearKiteTrail(state: KiteState) {
  if (state.trail.length > 0) {
    state.trail.length = 0
  }
}
