import type { GravityWellModifier } from '../../../devtools'
import { getSnowOpacity, type WonderlandState } from './wonderlandModifier'

export function drawWonderlandSnow(
  ctx: CanvasRenderingContext2D,
  state: WonderlandState,
  modifier: GravityWellModifier,
  ballColor: string,
) {
  if (!modifier.enabled) return
  if (state.snowflakes.length === 0) return

  const opacity = getSnowOpacity(modifier)
  if (opacity <= 0) return

  ctx.save()
  ctx.fillStyle = ballColor
  ctx.globalAlpha *= opacity

  for (const flake of state.snowflakes) {
    ctx.beginPath()
    ctx.arc(flake.x, flake.y, flake.radius, 0, Math.PI * 2)
    ctx.fill()
  }

  ctx.restore()
}
