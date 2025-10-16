/*
 * Copyright (c) 2025. CrossBread Tech All rights reserved.
 */

import type { SearchLightModifier } from '../../../devtools'
import type { ArenaDimensions } from '../shared'
import { clamp } from '../shared'
import { clampByte, parseColorToRgb, type RGBColor } from '../../ball/shared'
import {
  getSearchLightBeamColor,
  getSearchLightConeLength,
  getSearchLightConeWidth,
} from './searchLightModifier'

export interface SearchLightPaddleSnapshot {
  side: 'left' | 'right'
  x: number
  y: number
  height: number
}

interface DrawSearchLightOptions {
  paddleWidth: number
}

export function drawSearchLightBeams(
  ctx: CanvasRenderingContext2D,
  paddles: SearchLightPaddleSnapshot[],
  modifier: SearchLightModifier,
  dimensions: ArenaDimensions,
  options: DrawSearchLightOptions,
) {
  if (!modifier.enabled) return

  const coneLength = getSearchLightConeLength(modifier)
  const coneWidth = getSearchLightConeWidth(modifier)
  if (coneLength <= 0 || coneWidth <= 0) return

  const beamColor = getSearchLightBeamColor(modifier)
  const colorRgb = parseColorToRgb(beamColor, DEFAULT_BEAM_COLOR)
  const startAlpha = 0.7
  const midAlpha = 0.25
  const halfWidth = coneWidth / 2
  const { width, height } = dimensions
  const { paddleWidth } = options

  ctx.save()
  ctx.globalCompositeOperation = 'lighter'
  for (const paddle of paddles) {
    if (paddle.height <= 0) continue
    const originX = paddle.x + paddleWidth / 2
    const originY = paddle.y + paddle.height / 2
    const direction = paddle.side === 'left' ? 1 : -1
    const farX = clamp(originX + direction * coneLength, 0, width)
    const farTopY = clamp(originY - halfWidth, 0, height)
    const farBottomY = clamp(originY + halfWidth, 0, height)
    const startHalfWidth = Math.min(paddle.height / 2, coneWidth * 0.25)
    const startTopY = clamp(originY - startHalfWidth, 0, height)
    const startBottomY = clamp(originY + startHalfWidth, 0, height)

    const gradient = ctx.createLinearGradient(originX, originY, farX, originY)
    gradient.addColorStop(0, rgbaString(colorRgb, startAlpha))
    gradient.addColorStop(0.6, rgbaString(colorRgb, midAlpha))
    gradient.addColorStop(1, rgbaString(colorRgb, 0))
    ctx.fillStyle = gradient

    ctx.beginPath()
    ctx.moveTo(originX, startTopY)
    ctx.lineTo(farX, farTopY)
    ctx.lineTo(farX, farBottomY)
    ctx.lineTo(originX, startBottomY)
    ctx.closePath()
    ctx.fill()
  }
  ctx.restore()
}

const DEFAULT_BEAM_COLOR: RGBColor = { r: 51, g: 65, b: 85 }

function rgbaString(color: RGBColor, alpha: number): string {
  const clampedAlpha = Math.max(0, Math.min(1, alpha))
  return `rgba(${clampByte(color.r)}, ${clampByte(color.g)}, ${clampByte(color.b)}, ${clampedAlpha})`
}
