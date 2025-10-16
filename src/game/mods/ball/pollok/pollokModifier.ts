import type { PollokModifier } from '../../../devtools'
import type { ManagedMod } from '../../modManager'
import {
  addColoredTrailPoint,
  clampTrailLength,
  type ColoredTrailPoint,
} from '../shared'
import { drawPollokTrail } from './pollokView'

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

interface PollokModParams {
  getModifier(): PollokModifier
  getContext(): CanvasRenderingContext2D
  getBallPosition(): { x: number; y: number }
  getBallRadius(): number
}

export interface PollokMod extends ManagedMod {
  clearTrail(): void
  registerReturn(side: 'left' | 'right'): void
}

export function createPollokMod(params: PollokModParams): PollokMod {
  const state: PollokState = createPollokState()

  const getModifier = () => params.getModifier()
  const getBallRadius = () => params.getBallRadius()

  const clearState = () => {
    clearPollokTrail(state)
  }

  return {
    key: 'pollok',
    isEnabled: () => Boolean(getModifier().enabled),
    onTick() {
      const modifier = getModifier()
      const position = params.getBallPosition()
      updatePollokTrail(
        state,
        modifier,
        position.x,
        position.y,
        getBallRadius(),
        getPollokColor(state, modifier),
      )
    },
    onBallReset() {
      state.lastReturner = null
    },
    onDisabled() {
      clearState()
    },
    onReset() {
      clearState()
    },
    onDraw() {
      drawPollokTrail(params.getContext(), state, getModifier(), {
        getBallRadius,
      })
    },
    clearTrail() {
      clearState()
    },
    registerReturn(side) {
      registerPollokReturn(state, side)
    },
  }
}
