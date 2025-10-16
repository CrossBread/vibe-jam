/*
 * Copyright (c) 2025. CrossBread Tech All rights reserved.
 */

import type { GravityWellModifier } from '../../../devtools'
import type { RGBColor } from '../../ball/shared'
import { clampByte, parseColorToRgb } from '../../ball/shared'
import type { PortalState } from './portalModifier'

export interface PortalDrawOptions {
  backgroundRgb: RGBColor
  entryColor?: string
  exitColor?: string
  connectionColor?: string
  showExitDirection?: boolean
  arrowColor?: string
  arrowLength?: number
  arrowWidth?: number
}

export function drawPortals(
  ctx: CanvasRenderingContext2D,
  state: PortalState,
  modifier: GravityWellModifier,
  options: PortalDrawOptions,
) {
  if (!modifier.enabled) return
  if (state.pairs.length === 0) return

  const entryColor = parseColor(modifier.positiveTint, options.entryColor, '#38bdf8', options.backgroundRgb)
  const exitColor = parseColor(modifier.negativeTint, options.exitColor, '#f472b6', options.backgroundRgb)
  const extras = modifier as GravityWellModifier & { connectionColor?: string; arrowColor?: string }
  const connectionColor = parseColor(
    extras.connectionColor,
    options.connectionColor,
    '#38bdf866',
    options.backgroundRgb,
  )
  const arrowColor = parseColor(extras.arrowColor, options.arrowColor, exitColor, options.backgroundRgb)
  const arrowLength = Number.isFinite(options.arrowLength) ? Number(options.arrowLength) : 32
  const arrowWidth = Number.isFinite(options.arrowWidth) ? Number(options.arrowWidth) : 12

  ctx.save()
  ctx.lineWidth = 4
  ctx.lineCap = 'round'
  ctx.lineJoin = 'round'

  for (const pair of state.pairs) {
    if (connectionColor) {
      ctx.strokeStyle = connectionColor
      ctx.beginPath()
      ctx.moveTo(pair.entry.x, pair.entry.y)
      ctx.lineTo(pair.exit.x, pair.exit.y)
      ctx.stroke()
    }

    drawPortalRing(ctx, pair.entry.x, pair.entry.y, pair.entry.radius, entryColor)
    drawPortalRing(ctx, pair.exit.x, pair.exit.y, pair.exit.radius, exitColor)

    if (options.showExitDirection) {
      drawPortalArrow(
        ctx,
        pair.exit.x,
        pair.exit.y,
        pair.exit.radius,
        arrowColor,
        state.rotation + pair.id * Math.PI * 0.5,
        arrowLength,
        arrowWidth,
      )
    }
  }

  ctx.restore()
}

function drawPortalRing(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  radius: number,
  color: string,
) {
  const gradient = ctx.createRadialGradient(x, y, radius * 0.3, x, y, radius)
  const innerRgb = parseHex(color)
  const outerRgb = parseHex(color)
  gradient.addColorStop(0, rgbaString(innerRgb, 0.8))
  gradient.addColorStop(0.6, rgbaString(innerRgb, 0.35))
  gradient.addColorStop(1, rgbaString(outerRgb, 0))

  ctx.fillStyle = gradient
  ctx.beginPath()
  ctx.arc(x, y, radius, 0, Math.PI * 2)
  ctx.fill()

  ctx.strokeStyle = rgbaString(innerRgb, 0.8)
  ctx.beginPath()
  ctx.arc(x, y, radius, 0, Math.PI * 2)
  ctx.stroke()
}

function drawPortalArrow(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  radius: number,
  color: string,
  angle: number,
  length: number,
  width: number,
) {
  ctx.save()
  ctx.translate(x, y)
  ctx.rotate(angle)
  ctx.strokeStyle = color
  ctx.fillStyle = color

  const clampedLength = Math.max(radius + 6, length)
  const headLength = Math.max(10, width * 1.5)
  const shaftLength = clampedLength - headLength
  const halfWidth = Math.max(4, width / 2)

  ctx.lineWidth = Math.max(4, width * 0.35)
  ctx.beginPath()
  ctx.moveTo(0, 0)
  ctx.lineTo(shaftLength, 0)
  ctx.stroke()

  ctx.beginPath()
  ctx.moveTo(shaftLength, 0)
  ctx.lineTo(shaftLength - headLength, halfWidth)
  ctx.lineTo(shaftLength - headLength, -halfWidth)
  ctx.closePath()
  ctx.fill()

  ctx.restore()
}

function parseColor(
  modifierColor: unknown,
  optionColor: string | undefined,
  fallback: string,
  background: RGBColor,
): string {
  if (typeof modifierColor === 'string' && modifierColor.trim()) return modifierColor
  if (typeof optionColor === 'string' && optionColor.trim()) return optionColor
  return rgbaString(parseColorToRgb(fallback, background), 1)
}

function parseHex(hex: string): RGBColor {
  return parseColorToRgb(hex, { r: 255, g: 255, b: 255 })
}

function rgbaString(color: RGBColor, alpha: number): string {
  return `rgba(${clampByte(color.r)}, ${clampByte(color.g)}, ${clampByte(color.b)}, ${Math.max(0, Math.min(1, alpha))})`
}

