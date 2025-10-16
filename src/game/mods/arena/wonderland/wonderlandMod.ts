import type { GravityWellModifier } from '../../../devtools'
import type { ManagedMod } from '../../modManager'
import type { ArenaDimensions } from '../shared'
import {
  createWonderlandState,
  resetWonderlandState,
  updateWonderlandState,
  type WonderlandState,
} from './wonderlandModifier'
import { drawWonderlandSnow } from './wonderlandView'

interface WonderlandModParams {
  getModifier(): GravityWellModifier
  getArenaDimensions(): ArenaDimensions
  getContext(): CanvasRenderingContext2D
  getSnowColor(): string
}

export interface WonderlandMod extends ManagedMod {
  resetState(): void
}

export function createWonderlandMod(params: WonderlandModParams): WonderlandMod {
  const state: WonderlandState = createWonderlandState()

  const getModifier = () => params.getModifier()
  const getDimensions = () => params.getArenaDimensions()

  const resetState = () => {
    resetWonderlandState(state)
  }

  return {
    key: 'wonderland',
    isEnabled: () => Boolean(getModifier().enabled),
    onEnabled() {
      resetState()
    },
    onTick(dt: number) {
      updateWonderlandState(state, getModifier(), dt, getDimensions())
    },
    onDisabled() {
      resetState()
    },
    onReset() {
      resetState()
    },
    onDraw() {
      drawWonderlandSnow(params.getContext(), state, getModifier(), params.getSnowColor())
    },
    resetState,
  }
}
