import type { BumShuffleModifier } from '../../../devtools'
import { addTrailPoint, clampTrailLength, type TrailPoint } from '../shared'

export const MAX_BUM_SHUFFLE_HISTORY = 4000
export const BUM_SHUFFLE_DISTANCE_SQ = 4

export interface BumShuffleState {
  trail: TrailPoint[]
}

export function createBumShuffleState(): BumShuffleState {
  return { trail: [] }
}

export function updateBumShuffleTrail(
  state: BumShuffleState,
  modifier: BumShuffleModifier,
  x: number,
  y: number,
  radius: number,
) {
  if (!modifier.enabled) {
    clearBumShuffleTrail(state)
    return
  }

  const maxLength = clampTrailLength(
    modifier.trailLength,
    40,
    MAX_BUM_SHUFFLE_HISTORY,
  )
  addTrailPoint(state.trail, x, y, maxLength, BUM_SHUFFLE_DISTANCE_SQ, radius)
}

export function clearBumShuffleTrail(state: BumShuffleState) {
  if (state.trail.length > 0) {
    state.trail.length = 0
  }
}
