import type { PollokModifier } from '../../../devtools'
import type { ManagedMod } from '../../modManager'
import {
  clearPollokTrail,
  createPollokState,
  getPollokColor,
  registerPollokReturn,
  updatePollokTrail,
  type PollokState,
} from './pollokModifier'
import { drawPollokTrail } from './pollokView'

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
