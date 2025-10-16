/*
 * Copyright (c) 2025. CrossBread Tech All rights reserved.
 */

import type { BumShuffleModifier } from '../../../devtools'
import type { ManagedMod } from '../../modManager'
import { addTrailPoint, clampTrailLength, type TrailPoint } from '../shared'
import { drawBumShuffleTrail } from './bumShuffleView'

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

interface BumShuffleModParams {
  getModifier(): BumShuffleModifier
  getContext(): CanvasRenderingContext2D
  getBallPosition(): { x: number; y: number }
  getBallRadius(): number
  getTrailColor(): string
}

export interface BumShuffleMod extends ManagedMod {
  clearTrail(): void
}

export function createBumShuffleMod(params: BumShuffleModParams): BumShuffleMod {
  const state: BumShuffleState = createBumShuffleState()

  const getModifier = () => params.getModifier()
  const getBallRadius = () => params.getBallRadius()

  const clearState = () => {
    clearBumShuffleTrail(state)
  }

  return {
    key: 'bumShuffle',
    isEnabled: () => Boolean(getModifier().enabled),
    onTick() {
      const modifier = getModifier()
      const position = params.getBallPosition()
      updateBumShuffleTrail(state, modifier, position.x, position.y, getBallRadius())
    },
    onDisabled() {
      clearState()
    },
    onReset() {
      clearState()
    },
    onDraw() {
      drawBumShuffleTrail(params.getContext(), state, getModifier(), {
        baseColor: params.getTrailColor(),
        getBallRadius,
      })
    },
    clearTrail() {
      clearState()
    },
  }
}
