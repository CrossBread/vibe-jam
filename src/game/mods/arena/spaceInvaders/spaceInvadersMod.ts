import type { SpaceInvadersModifier } from '../../../devtools'
import type { RGBColor } from '../../ball/shared'
import type { ManagedMod, BallLike } from '../../modManager'
import type { ArenaDimensions } from '../shared'
import {
  clearSpaceInvadersState,
  createSpaceInvadersState,
  maintainSpaceInvadersState,
  resetSpaceInvadersState,
  resolveSpaceInvadersCollision,
  type SpaceInvadersState,
} from './spaceInvadersModifier'
import { drawSpaceInvadersBarricades } from './spaceInvadersView'

interface SpaceInvadersModParams {
  getModifier(): SpaceInvadersModifier
  getArenaDimensions(): ArenaDimensions
  getContext(): CanvasRenderingContext2D
  getBackgroundRgb(): RGBColor
  getAreSidesSwapped(): boolean
}

export interface SpaceInvadersMod extends ManagedMod {
  resetBarricades(): void
  clearBarricades(): void
  resolveCollision(ball: BallLike): boolean
}

export function createSpaceInvadersMod(params: SpaceInvadersModParams): SpaceInvadersMod {
  const state: SpaceInvadersState = createSpaceInvadersState()

  const getModifier = () => params.getModifier()
  const getDimensions = () => params.getArenaDimensions()
  const getSwapSides = () => params.getAreSidesSwapped()

  const maintainState = () => {
    maintainSpaceInvadersState(state, getModifier(), getDimensions(), getSwapSides())
  }

  const resetState = () => {
    resetSpaceInvadersState(state, getModifier(), getDimensions(), getSwapSides())
  }

  const clearState = () => {
    clearSpaceInvadersState(state)
  }

  return {
    key: 'spaceInvaders',
    isEnabled: () => Boolean(getModifier().enabled),
    onEnabled() {
      maintainState()
      resetState()
    },
    onTick() {
      maintainState()
    },
    onBallReset() {
      maintainState()
      resetState()
    },
    onDisabled() {
      clearState()
    },
    onReset() {
      clearState()
    },
    onDraw() {
      drawSpaceInvadersBarricades(params.getContext(), state, getModifier(), {
        backgroundRgb: params.getBackgroundRgb(),
      })
    },
    resetBarricades() {
      resetState()
    },
    clearBarricades() {
      clearState()
    },
    resolveCollision(ball) {
      return resolveSpaceInvadersCollision(state, getModifier(), ball)
    },
  }
}
