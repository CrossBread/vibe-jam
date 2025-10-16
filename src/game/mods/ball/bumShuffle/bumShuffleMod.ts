import type { BumShuffleModifier } from '../../../devtools'
import type { ManagedMod } from '../../modManager'
import {
  clearBumShuffleTrail,
  createBumShuffleState,
  updateBumShuffleTrail,
  type BumShuffleState,
} from './bumShuffleModifier'
import { drawBumShuffleTrail } from './bumShuffleView'

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
