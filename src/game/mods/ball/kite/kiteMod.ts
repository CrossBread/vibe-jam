import type { KiteModifier } from '../../../devtools'
import type { ManagedMod } from '../../modManager'
import {
  clearKiteTrail,
  createKiteState,
  updateKiteTrail,
  type KiteState,
} from './kiteModifier'
import { drawKiteTrail } from './kiteView'

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
