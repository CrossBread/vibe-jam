import type { GravityWellModifier } from '../../../devtools'
import type { ManagedMod } from '../../modManager'
import type { ArenaDimensions } from '../shared'
import {
  createFogOfWarState,
  resetFogOfWarState,
  updateFogOfWarState,
  type FogOfWarState,
} from './fogOfWarModifier'
import { drawFogOfWarOverlay } from './fogOfWarView'

interface FogOfWarModParams {
  getModifier(): GravityWellModifier
  getArenaDimensions(): ArenaDimensions
  getContext(): CanvasRenderingContext2D
}

export interface FogOfWarMod extends ManagedMod {
  resetState(): void
}

export function createFogOfWarMod(params: FogOfWarModParams): FogOfWarMod {
  const state: FogOfWarState = createFogOfWarState()

  const getModifier = () => params.getModifier()
  const getDimensions = () => params.getArenaDimensions()

  const resetState = () => {
    resetFogOfWarState(state)
  }

  return {
    key: 'fogOfWar',
    isEnabled: () => Boolean(getModifier().enabled),
    onEnabled() {
      resetState()
    },
    onTick(dt: number) {
      updateFogOfWarState(state, getModifier(), dt, getDimensions())
    },
    onDisabled() {
      resetState()
    },
    onReset() {
      resetState()
    },
    onDraw() {
      drawFogOfWarOverlay(params.getContext(), state, getModifier(), getDimensions())
    },
    resetState,
  }
}
