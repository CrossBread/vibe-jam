/*
 * Copyright (c) 2025. CrossBread Tech All rights reserved.
 */

import type { SecondChancesModifier } from '../../../devtools'
import type { RGBColor } from '../../ball/shared'
import { clampByte, parseColorToRgb } from '../../ball/shared'
import type { SecondChancesState, ShieldInstance } from './secondChancesModifier'

export interface SecondChancesDrawOptions {
  arenaWidth: number
  arenaHeight: number
  backgroundRgb: RGBColor
  swapSides?: boolean
}

const LEFT_FALLBACK: RGBColor = { r: 56, g: 189, b: 248 }
const RIGHT_FALLBACK: RGBColor = { r: 244, g: 114, b: 182 }
const DARK_RGB: RGBColor = { r: 15, g: 23, b: 42 }
const SHIELD_THICKNESS = 14

export function drawSecondChanceShields(
  ctx: CanvasRenderingContext2D,
  state: SecondChancesState,
  modifier: SecondChancesModifier,
  options: SecondChancesDrawOptions,
) {
  if (!modifier.enabled) return

  const swapSides = Boolean(options.swapSides)

  if (state.left) {
    const x = swapSides
      ? Math.max(0, options.arenaWidth - SHIELD_THICKNESS)
      : 0
    drawShield(ctx, state.left, {
      x,
      width: SHIELD_THICKNESS,
      height: options.arenaHeight,
      color: parseColorToRgb(modifier.positiveTint, LEFT_FALLBACK),
      background: options.backgroundRgb,
    })
  }

  if (state.right) {
    const x = swapSides ? 0 : Math.max(0, options.arenaWidth - SHIELD_THICKNESS)
    drawShield(ctx, state.right, {
      x,
      width: SHIELD_THICKNESS,
      height: options.arenaHeight,
      color: parseColorToRgb(modifier.negativeTint, RIGHT_FALLBACK),
      background: options.backgroundRgb,
    })
  }
}

interface ShieldDrawConfig {
  x: number
  width: number
  height: number
  color: RGBColor
  background: RGBColor
}

function drawShield(
  ctx: CanvasRenderingContext2D,
  shield: ShieldInstance,
  config: ShieldDrawConfig,
) {
  if (shield.hitsRemaining <= 0) return

  const ratio = clamp01(shield.hitsRemaining / Math.max(1, shield.maxHits))
  const fill = mixRgb(config.color, DARK_RGB, 1 - ratio * 0.75)
  const alpha = 0.25 + 0.5 * ratio

  ctx.save()
  ctx.fillStyle = rgbaString(fill, alpha)
  ctx.fillRect(config.x, 0, config.width, config.height)

  const highlight = mixRgb(config.color, config.background, 0.35)
  ctx.fillStyle = rgbaString(highlight, Math.max(0.1, alpha * 0.4))
  ctx.fillRect(config.x, 0, config.width, config.height * 0.2)
  ctx.fillRect(config.x, config.height * 0.8, config.width, config.height * 0.2)
  ctx.restore()
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
