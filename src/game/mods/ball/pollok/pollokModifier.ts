import type { PollokModifier } from '../../../devtools'
import {
  addColoredTrailPoint,
  clampTrailLength,
  type ColoredTrailPoint,
} from '../shared'

export const MAX_POLLOK_HISTORY = 6000
export const POLLOK_DISTANCE_SQ = 9

export type PollokReturner = 'left' | 'right' | null

export interface PollokState {
  trail: ColoredTrailPoint[]
  lastReturner: PollokReturner
}

export function createPollokState(): PollokState {
  return { trail: [], lastReturner: null }
}

export function updatePollokTrail(
  state: PollokState,
  modifier: PollokModifier,
  x: number,
  y: number,
  radius: number,
  color: string,
) {
  if (!modifier.enabled) {
    clearPollokTrail(state)
    return
  }

  const maxLength = clampTrailLength(modifier.trailLength, 80, MAX_POLLOK_HISTORY)
  addColoredTrailPoint(
    state.trail,
    x,
    y,
    color,
    maxLength,
    POLLOK_DISTANCE_SQ,
    radius,
  )
}

export function clearPollokTrail(state: PollokState) {
  if (state.trail.length > 0) {
    state.trail.length = 0
  }
  state.lastReturner = null
}

export function registerPollokReturn(state: PollokState, side: 'left' | 'right') {
  state.lastReturner = side
}

export function getPollokColor(state: PollokState, modifier: PollokModifier) {
  if (state.lastReturner === 'left') return modifier.leftColor
  if (state.lastReturner === 'right') return modifier.rightColor
  return modifier.neutralColor
}
