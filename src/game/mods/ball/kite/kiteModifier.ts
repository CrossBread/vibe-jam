/*
 * Copyright (c) 2025. CrossBread Tech All rights reserved.
 */

import type { ManagedMod } from '../../modManager'
import type { KiteModifier } from '../../../devtools'
import { addTrailPoint, clampTrailLength, type TrailPoint } from '../shared'
import { drawKiteTrail } from './kiteView'

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

interface KiteModParams {
  getModifier(): KiteModifier
  getContext(): CanvasRenderingContext2D
  getBallPosition(): { x: number; y: number }
  getBallRadius(): number
  getTrailColor(): string
  applyAlpha(color: string, alpha: number): string
}

export interface KiteMod extends ManagedMod {
  clearTrail(): void
}

export function createKiteMod(params: KiteModParams): KiteMod {
  const state: KiteState = createKiteState()

  const getModifier = () => params.getModifier()
  const getBallRadius = () => params.getBallRadius()

  const clearState = () => {
    clearKiteTrail(state)
  }

  return {
    key: 'kite',
    isEnabled: () => Boolean(getModifier().enabled),
    onTick() {
      const modifier = getModifier()
      const position = params.getBallPosition()
      updateKiteTrail(state, modifier, position.x, position.y, getBallRadius())
    },
    onDisabled() {
      clearState()
    },
    onReset() {
      clearState()
    },
    onDraw() {
      drawKiteTrail(params.getContext(), state, getModifier(), {
        baseColor: params.getTrailColor(),
        applyAlpha: params.applyAlpha,
        getBallRadius,
      })
    },
    clearTrail() {
      clearState()
    },
  }
}
