/*
 * Copyright (c) 2025. CrossBread Tech All rights reserved.
 */

import type { GravityWellModifier } from '../../../devtools'
import type { RGBColor } from '../../ball/shared'
import { drawPortals } from '../portal/portalView'
import type { WormholeState } from './wormholeModifier'

interface WormholeDrawOptions {
  backgroundRgb: RGBColor
}

export function drawWormholes(
  ctx: CanvasRenderingContext2D,
  state: WormholeState,
  modifier: GravityWellModifier,
  options: WormholeDrawOptions,
) {
  drawPortals(ctx, state, modifier, {
    backgroundRgb: options.backgroundRgb,
    connectionColor: '#38bdf855',
    showExitDirection: false,
    arrowLength: 0,
    arrowWidth: 0,
  })
}

