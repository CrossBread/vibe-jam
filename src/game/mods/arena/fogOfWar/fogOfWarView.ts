import type { GravityWellModifier } from '../../../devtools'
import type { ArenaDimensions } from '../shared'
import { getFogMaxOpacity, getFogMaxRadius, type FogOfWarState } from './fogOfWarModifier'

export function drawFogOfWarOverlay(
  ctx: CanvasRenderingContext2D,
  state: FogOfWarState,
  modifier: GravityWellModifier,
  dimensions: ArenaDimensions,
) {
  if (!modifier.enabled) return

  const maxRadius = getFogMaxRadius(modifier, dimensions)
  const radius = Math.max(0, Math.min(maxRadius, state.radius))
  if (radius <= 0) return

  const maxOpacity = getFogMaxOpacity(modifier)
  if (maxOpacity <= 0) return

  const centerX = dimensions.width / 2
  const centerY = dimensions.height / 2
  const innerRadius = radius * 0.25

  const gradient = ctx.createRadialGradient(centerX, centerY, innerRadius, centerX, centerY, radius)
  gradient.addColorStop(0, `rgba(2, 6, 23, ${maxOpacity})`)
  gradient.addColorStop(0.55, `rgba(15, 23, 42, ${maxOpacity * 0.85})`)
  gradient.addColorStop(1, 'rgba(15, 23, 42, 0)')

  ctx.save()
  ctx.fillStyle = gradient
  ctx.fillRect(0, 0, dimensions.width, dimensions.height)
  ctx.restore()
}
