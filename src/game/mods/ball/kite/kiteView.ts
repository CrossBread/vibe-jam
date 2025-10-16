/*
 * Copyright (c) 2025. CrossBread Tech All rights reserved.
 */

import type { KiteModifier } from '../../../devtools'
import type { KiteState } from './kiteModifier'

interface DrawOptions {
  baseColor: string
  applyAlpha(color: string, alpha: number): string
  getBallRadius(): number
}

export function drawKiteTrail(
  ctx: CanvasRenderingContext2D,
  state: KiteState,
  modifier: KiteModifier,
  options: DrawOptions,
) {
  if (!modifier.enabled || state.trail.length === 0) return

  const { baseColor, applyAlpha, getBallRadius } = options

  ctx.save()
  const length = state.trail.length
  for (let i = 0; i < length; i++) {
    const point = state.trail[i]
    const alpha = ((i + 1) / length) * 0.8
    ctx.fillStyle = applyAlpha(baseColor, Math.min(1, alpha))
    ctx.beginPath()
    const radius = point.radius ?? getBallRadius()
    ctx.arc(point.x, point.y, radius, 0, Math.PI * 2)
    ctx.fill()
  }
  ctx.restore()
}
