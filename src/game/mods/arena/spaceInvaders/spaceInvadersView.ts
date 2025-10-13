import type { SpaceInvadersModifier } from '../../../devtools'
import type { RGBColor } from '../../ball/shared'
import { clampByte, parseColorToRgb } from '../../ball/shared'
import type {
  SpaceInvadersBarricade,
  SpaceInvadersState,
} from './spaceInvadersModifier'

export interface SpaceInvadersDrawOptions {
  backgroundRgb: RGBColor
}

const LEFT_FALLBACK: RGBColor = { r: 250, g: 204, b: 21 }
const RIGHT_FALLBACK: RGBColor = { r: 52, g: 211, b: 153 }
const DAMAGE_RGB: RGBColor = { r: 30, g: 41, b: 59 }

export function drawSpaceInvadersBarricades(
  ctx: CanvasRenderingContext2D,
  state: SpaceInvadersState,
  modifier: SpaceInvadersModifier,
  options: SpaceInvadersDrawOptions,
) {
  if (!modifier.enabled) return

  drawColumn(ctx, state.left, parseColorToRgb(modifier.positiveTint, LEFT_FALLBACK), options)
  drawColumn(ctx, state.right, parseColorToRgb(modifier.negativeTint, RIGHT_FALLBACK), options)
}

function drawColumn(
  ctx: CanvasRenderingContext2D,
  barricades: SpaceInvadersBarricade[],
  baseColor: RGBColor,
  options: SpaceInvadersDrawOptions,
) {
  for (const barricade of barricades) {
    if (barricade.hitsRemaining <= 0) continue

    const ratio = clamp01(barricade.hitsRemaining / Math.max(1, barricade.maxHits))
    const fillColor = mixRgb(baseColor, DAMAGE_RGB, 1 - ratio)
    const alpha = 0.3 + 0.55 * ratio

    ctx.save()
    ctx.fillStyle = rgbaString(fillColor, alpha)
    ctx.fillRect(barricade.x, barricade.y, barricade.width, barricade.height)

    const highlight = mixRgb(baseColor, options.backgroundRgb, 0.35)
    const highlightHeight = Math.min(8, barricade.height * 0.22)
    ctx.fillStyle = rgbaString(highlight, Math.max(0.1, alpha * 0.45))
    ctx.fillRect(barricade.x, barricade.y, barricade.width, highlightHeight)

    const damageHeight = Math.max(2, barricade.height * (1 - ratio) * 0.5)
    if (damageHeight > 2) {
      ctx.fillStyle = rgbaString(DAMAGE_RGB, 0.25 + 0.25 * (1 - ratio))
      ctx.fillRect(
        barricade.x,
        barricade.y + barricade.height - damageHeight,
        barricade.width,
        damageHeight,
      )
    }

    ctx.restore()
  }
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
