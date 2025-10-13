import type { MinesweeperModifier } from '../../../devtools'
import type { RGBColor } from '../../ball/shared'
import { clampByte, parseColorToRgb } from '../../ball/shared'
import type { MinesweeperState } from './minesweeperModifier'

const SAFE_FALLBACK: RGBColor = { r: 148, g: 163, b: 184 }
const MINE_FALLBACK: RGBColor = { r: 239, g: 68, b: 68 }
const OUTLINE_FALLBACK: RGBColor = { r: 71, g: 85, b: 105 }

export function drawMinesweeperSquares(
  ctx: CanvasRenderingContext2D,
  state: MinesweeperState,
  modifier: MinesweeperModifier,
) {
  if (!modifier.enabled) return

  const safeRgb = parseColorToRgb(modifier.positiveTint, SAFE_FALLBACK)
  const mineRgb = parseColorToRgb(modifier.negativeTint, MINE_FALLBACK)
  const outlineRgb = mixRgb(safeRgb, OUTLINE_FALLBACK, 0.5)

  for (const cell of state.cells) {
    if (cell.state === 'cleared') continue

    const isTriggered = cell.state === 'triggered'
    const fillRgb = isTriggered ? mineRgb : safeRgb
    const fillAlpha = isTriggered ? 0.85 : 0.45

    ctx.save()
    ctx.fillStyle = rgbaString(fillRgb, fillAlpha)
    ctx.fillRect(cell.x, cell.y, cell.size, cell.size)

    const borderRgb = isTriggered ? mineRgb : outlineRgb
    const borderAlpha = isTriggered ? 0.95 : 0.6
    ctx.strokeStyle = rgbaString(borderRgb, borderAlpha)
    ctx.lineWidth = 2
    ctx.strokeRect(cell.x + 0.5, cell.y + 0.5, Math.max(0, cell.size - 1), Math.max(0, cell.size - 1))

    if (isTriggered) {
      ctx.strokeStyle = rgbaString({ r: 255, g: 255, b: 255 }, 0.65)
      ctx.lineWidth = 1.5
      ctx.beginPath()
      ctx.moveTo(cell.x + 4, cell.y + 4)
      ctx.lineTo(cell.x + cell.size - 4, cell.y + cell.size - 4)
      ctx.moveTo(cell.x + cell.size - 4, cell.y + 4)
      ctx.lineTo(cell.x + 4, cell.y + cell.size - 4)
      ctx.stroke()
    } else {
      const highlightHeight = Math.min(cell.size * 0.35, 8)
      const highlightRgb = mixRgb(fillRgb, { r: 255, g: 255, b: 255 }, 0.35)
      ctx.fillStyle = rgbaString(highlightRgb, fillAlpha * 0.6)
      ctx.fillRect(cell.x, cell.y, cell.size, highlightHeight)
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
  return `rgba(${clampByte(color.r)}, ${clampByte(color.g)}, ${clampByte(color.b)}, ${clamp01(alpha)})`
}

function clamp01(value: number): number {
  if (!Number.isFinite(value)) return 0
  return Math.max(0, Math.min(1, value))
}
