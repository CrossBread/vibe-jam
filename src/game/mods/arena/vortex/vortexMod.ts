import type { GravityWellModifier } from '../../../devtools'
import type { RGBColor } from '../../ball/shared'
import type { ManagedMod, BallLike } from '../../modManager'
import type { ArenaDimensions } from '../shared'
import {
  clearVortexState,
  createVortexState,
  maintainVortexState,
  resetVortexState,
  tryResolveVortexTeleport,
  updateVortexState,
  type VortexState,
} from './vortexModifier'
import { drawVortexPortals } from './vortexView'

interface VortexModParams {
  getModifier(): GravityWellModifier
  getArenaDimensions(): ArenaDimensions
  getContext(): CanvasRenderingContext2D
  getBackgroundRgb(): RGBColor
}

export function createVortexMod(params: VortexModParams): ManagedMod {
  const state: VortexState = createVortexState()

  const getModifier = () => params.getModifier()
  const getDimensions = () => params.getArenaDimensions()

  const maintainState = () => {
    maintainVortexState(state, getModifier(), getDimensions())
  }

  const resetState = () => {
    resetVortexState(state, getModifier(), getDimensions())
  }

  return {
    key: 'vortex',
    isEnabled: () => Boolean(getModifier().enabled),
    onInit() {
      maintainState()
    },
    onEnabled() {
      maintainState()
      resetState()
    },
    onDisabled() {
      clearVortexState(state)
    },
    onReset() {
      clearVortexState(state)
    },
    onTick(dt) {
      maintainState()
      updateVortexState(state, getModifier(), dt)
    },
    onBallReset() {
      maintainState()
      resetState()
    },
    onBallStep(ball: BallLike) {
      return tryResolveVortexTeleport(state, getModifier(), getDimensions(), ball)
    },
    onDraw() {
      drawVortexPortals(params.getContext(), state, getModifier(), {
        backgroundRgb: params.getBackgroundRgb(),
      })
    },
  }
}
