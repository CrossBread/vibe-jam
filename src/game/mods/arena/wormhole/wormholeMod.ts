import type { GravityWellModifier } from '../../../devtools'
import type { RGBColor } from '../../ball/shared'
import type { ManagedMod, BallLike } from '../../modManager'
import type { ArenaDimensions } from '../shared'
import {
  clearWormholeState,
  createWormholeState,
  maintainWormholeState,
  resetWormholeState,
  tryResolveWormholeTeleport,
  type WormholeState,
} from './wormholeModifier'
import { drawWormholes } from './wormholeView'

interface WormholeModParams {
  getModifier(): GravityWellModifier
  getArenaDimensions(): ArenaDimensions
  getContext(): CanvasRenderingContext2D
  getBackgroundRgb(): RGBColor
}

export function createWormholeMod(params: WormholeModParams): ManagedMod {
  const state: WormholeState = createWormholeState()

  const getModifier = () => params.getModifier()
  const getDimensions = () => params.getArenaDimensions()

  const maintainState = () => {
    maintainWormholeState(state, getModifier(), getDimensions())
  }

  const resetState = () => {
    resetWormholeState(state, getModifier(), getDimensions())
  }

  return {
    key: 'wormhole',
    isEnabled: () => Boolean(getModifier().enabled),
    onInit() {
      maintainState()
    },
    onEnabled() {
      maintainState()
      resetState()
    },
    onDisabled() {
      clearWormholeState(state)
    },
    onReset() {
      clearWormholeState(state)
    },
    onTick() {
      maintainState()
    },
    onBallReset() {
      maintainState()
      resetState()
    },
    onBallStep(ball: BallLike) {
      return tryResolveWormholeTeleport(state, getModifier(), getDimensions(), ball)
    },
    onDraw() {
      drawWormholes(params.getContext(), state, getModifier(), {
        backgroundRgb: params.getBackgroundRgb(),
      })
    },
  }
}
