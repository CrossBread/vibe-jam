/*
 * Copyright (c) 2025. CrossBread Tech All rights reserved.
 */

import type { PollokModifier } from '../../../devtools'
import type { PollokState } from './pollokModifier'

interface DrawOptions {
  getBallRadius(): number
}

export function drawPollokTrail(
  ctx: CanvasRenderingContext2D,
  state: PollokState,
  modifier: PollokModifier,
  options: DrawOptions,
) {
  if (!modifier.enabled || state.trail.length < 2) return

  const { getBallRadius } = options

  ctx.save()
  ctx.lineCap = 'round'
  ctx.lineJoin = 'round'

  const fallbackRadius = getBallRadius()
  for (let i = 1; i < state.trail.length; i++) {
    const prev = state.trail[i - 1]
    const current = state.trail[i]
    if (prev.x === current.x && prev.y === current.y) continue
    const prevRadius = prev.radius ?? fallbackRadius
    const currentRadius = current.radius ?? fallbackRadius
    const averageRadius = (prevRadius + currentRadius) * 0.5
    ctx.lineWidth = Math.max(1, averageRadius * 1.45)
    ctx.strokeStyle = current.color
    ctx.beginPath()
    ctx.moveTo(prev.x, prev.y)
    ctx.lineTo(current.x, current.y)
    ctx.stroke()
  }

  ctx.restore()
}
