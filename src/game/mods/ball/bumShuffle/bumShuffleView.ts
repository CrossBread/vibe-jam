import type { BumShuffleModifier } from '../../../devtools'
import type { BumShuffleState } from './bumShuffleModifier'

interface DrawOptions {
  baseColor: string
  getBallRadius(): number
}

export function drawBumShuffleTrail(
  ctx: CanvasRenderingContext2D,
  state: BumShuffleState,
  modifier: BumShuffleModifier,
  options: DrawOptions,
) {
  if (!modifier.enabled || state.trail.length < 2) return

  const { baseColor, getBallRadius } = options
  const latestRadius = state.trail[state.trail.length - 1]?.radius ?? getBallRadius()

  ctx.save()
  ctx.lineWidth = Math.max(1, latestRadius * 1.35)
  ctx.lineCap = 'round'
  ctx.lineJoin = 'round'
  ctx.strokeStyle = baseColor
  ctx.beginPath()
  ctx.moveTo(state.trail[0].x, state.trail[0].y)
  for (let i = 1; i < state.trail.length; i++) {
    ctx.lineTo(state.trail[i].x, state.trail[i].y)
  }
  ctx.stroke()
  ctx.restore()
}
