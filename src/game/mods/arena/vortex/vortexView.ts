import type { GravityWellModifier } from '../../../devtools'
import type { RGBColor } from '../../ball/shared'
import { drawPortals } from '../portal/portalView'
import type { VortexState } from './vortexModifier'

interface VortexDrawOptions {
  backgroundRgb: RGBColor
}

export function drawVortexPortals(
  ctx: CanvasRenderingContext2D,
  state: VortexState,
  modifier: GravityWellModifier,
  options: VortexDrawOptions,
) {
  drawPortals(ctx, state, modifier, {
    backgroundRgb: options.backgroundRgb,
    connectionColor: '#a855f74d',
    showExitDirection: true,
    arrowColor: '#f472b6',
    arrowLength: 42,
    arrowWidth: 16,
  })
}

