import type { SecondChancesModifier } from '../../../devtools'
import type { RGBColor } from '../../ball/shared'
import type { ManagedMod, BallLike } from '../../modManager'
import type { ArenaDimensions } from '../shared'
import {
  clearSecondChancesState,
  createSecondChancesState,
  maintainSecondChancesState,
  reflectBallWithSecondChanceShields,
  resetSecondChancesShields,
  type SecondChancesState,
} from './secondChancesModifier'
import { drawSecondChanceShields } from './secondChancesView'

interface SecondChancesModParams {
  getModifier(): SecondChancesModifier
  getArenaDimensions(): ArenaDimensions
  getContext(): CanvasRenderingContext2D
  getBackgroundRgb(): RGBColor
  getAreSidesSwapped(): boolean
}

export interface SecondChancesMod extends ManagedMod {
  resetShields(): void
  clearState(): void
  reflectBall(ball: BallLike): 'left' | 'right' | null
}

export function createSecondChancesMod(params: SecondChancesModParams): SecondChancesMod {
  const state: SecondChancesState = createSecondChancesState()

  const getModifier = () => params.getModifier()
  const getDimensions = () => params.getArenaDimensions()

  const maintainState = () => {
    maintainSecondChancesState(state, getModifier())
  }

  const resetShields = () => {
    resetSecondChancesShields(state, getModifier())
  }

  const clearState = () => {
    clearSecondChancesState(state)
  }

  return {
    key: 'secondChances',
    isEnabled: () => Boolean(getModifier().enabled),
    onEnabled() {
      maintainState()
      resetShields()
    },
    onTick() {
      maintainState()
    },
    onBallReset() {
      maintainState()
      resetShields()
    },
    onDisabled() {
      clearState()
    },
    onReset() {
      clearState()
    },
    onDraw() {
      drawSecondChanceShields(params.getContext(), state, getModifier(), {
        arenaWidth: getDimensions().width,
        arenaHeight: getDimensions().height,
        backgroundRgb: params.getBackgroundRgb(),
        swapSides: params.getAreSidesSwapped(),
      })
    },
    resetShields,
    clearState,
    reflectBall(ball) {
      return reflectBallWithSecondChanceShields(
        state,
        getModifier(),
        ball,
        getDimensions().width,
        params.getAreSidesSwapped(),
      )
    },
  }
}
