import type { RGBColor } from '../../ball/shared'
import type { ActiveGravityWell } from '../shared'
import { clampByte, parseColorToRgb } from '../../ball/shared'

export interface GravityWellDrawOptions {
  backgroundRgb: RGBColor
  blackRgb: RGBColor
  whiteRgb: RGBColor
  maxVisualStrength: number
}

export function drawGravityWells(
  ctx: CanvasRenderingContext2D,
  wells: ActiveGravityWell[],
  options: GravityWellDrawOptions,
) {
  for (const well of wells) {
    const gradient = createGravityWellGradient(ctx, well, options)
    ctx.fillStyle = gradient
    ctx.beginPath()
    ctx.arc(well.x, well.y, well.radius, 0, Math.PI * 2)
    ctx.fill()
  }
}

function createGravityWellGradient(
  context: CanvasRenderingContext2D,
  well: ActiveGravityWell,
  options: GravityWellDrawOptions,
): CanvasGradient {
  const gradient = context.createRadialGradient(
    well.x,
    well.y,
    0,
    well.x,
    well.y,
    well.radius,
  )

  const magnitude = clamp01(Math.abs(well.gravityStrength) / options.maxVisualStrength)
  const tintHex = well.gravityStrength >= 0 ? well.positiveTint : well.negativeTint
  const tint = parseColorToRgb(tintHex, options.backgroundRgb)

  if (well.gravityStrength >= 0) {
    const innerColor = mixRgb(tint, options.blackRgb, 0.6 + 0.4 * magnitude)
    const midColor = mixRgb(tint, options.whiteRgb, 0.3 + 0.35 * magnitude)
    const innerAlpha = 0.35 + 0.45 * magnitude
    const midAlpha = 0.18 + 0.22 * magnitude
    gradient.addColorStop(0, rgbaString(innerColor, innerAlpha))
    gradient.addColorStop(0.45, rgbaString(midColor, midAlpha))
  } else {
    const innerColor = mixRgb(tint, options.whiteRgb, 0.55 + 0.45 * magnitude)
    const midColor = mixRgb(tint, options.backgroundRgb, 0.1 + 0.25 * magnitude)
    const innerAlpha = 0.45 + 0.45 * magnitude
    const midAlpha = 0.25 + 0.25 * magnitude
    gradient.addColorStop(0, rgbaString(innerColor, innerAlpha))
    gradient.addColorStop(0.45, rgbaString(midColor, midAlpha))
  }

  gradient.addColorStop(1, rgbaString(options.backgroundRgb, 0))
  return gradient
}

function mixRgb(a: RGBColor, b: RGBColor, t: number): RGBColor {
  const amount = clamp01(t)
  return {
    r: a.r + (b.r - a.r) * amount,
    g: a.g + (b.g - a.g) * amount,
    b: a.b + (b.b - a.b) * amount,
  }
}

function rgbaString(color: RGBColor, alpha: number): string {
  const clampedAlpha = clamp01(alpha)
  return `rgba(${clampByte(color.r)}, ${clampByte(color.g)}, ${clampByte(color.b)}, ${clampedAlpha})`
}

function clamp01(value: number): number {
  if (!Number.isFinite(value)) return 0
  return Math.max(0, Math.min(1, value))
}
