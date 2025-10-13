export interface TrailPoint {
  x: number
  y: number
  radius?: number
}

export interface ColoredTrailPoint extends TrailPoint {
  color: string
}

export interface RGBColor {
  r: number
  g: number
  b: number
}

export function clampTrailLength(value: number | undefined, min: number, max: number) {
  if (!Number.isFinite(value)) return min
  const length = Math.floor(value as number)
  return Math.max(min, Math.min(max, length))
}

export function addTrailPoint(
  points: TrailPoint[],
  x: number,
  y: number,
  maxLength: number,
  minDistanceSq = 0,
  radius?: number,
) {
  if (!Number.isFinite(x) || !Number.isFinite(y)) return
  const last = points[points.length - 1]
  if (last && minDistanceSq > 0) {
    const dx = last.x - x
    const dy = last.y - y
    if (dx * dx + dy * dy < minDistanceSq) {
      last.x = x
      last.y = y
      if (radius !== undefined) last.radius = radius
      return
    }
  }
  const nextPoint: TrailPoint = { x, y }
  if (radius !== undefined) nextPoint.radius = radius
  points.push(nextPoint)
  if (points.length > maxLength) {
    points.splice(0, points.length - maxLength)
  }
}

export function addColoredTrailPoint(
  points: ColoredTrailPoint[],
  x: number,
  y: number,
  color: string,
  maxLength: number,
  minDistanceSq = 0,
  radius?: number,
) {
  if (!Number.isFinite(x) || !Number.isFinite(y)) return
  const last = points[points.length - 1]
  if (last && minDistanceSq > 0) {
    const dx = last.x - x
    const dy = last.y - y
    if (dx * dx + dy * dy < minDistanceSq) {
      last.x = x
      last.y = y
      last.color = color
      if (radius !== undefined) last.radius = radius
      return
    }
  }
  const nextPoint: ColoredTrailPoint = { x, y, color }
  if (radius !== undefined) nextPoint.radius = radius
  points.push(nextPoint)
  if (points.length > maxLength) {
    points.splice(0, points.length - maxLength)
  }
}

export function clampByte(value: number) {
  return Math.max(0, Math.min(255, Math.round(value)))
}

export function parseColorToRgb(color: string, fallback: RGBColor): RGBColor {
  if (typeof color !== 'string') return fallback
  const trimmed = color.trim()
  if (trimmed.length === 0) return fallback
  if (trimmed.startsWith('#')) {
    return hexToRgb(trimmed)
  }

  const rgbMatch = trimmed.match(/^rgba?\(([^)]+)\)$/i)
  if (rgbMatch) {
    const parts = rgbMatch[1]
      .split(',')
      .map(part => Number.parseFloat(part.trim()))
      .filter(Number.isFinite)
    if (parts.length >= 3) {
      return {
        r: clampByte(parts[0]),
        g: clampByte(parts[1]),
        b: clampByte(parts[2]),
      }
    }
  }

  return fallback
}

function hexToRgb(hex: string): RGBColor {
  const normalized = hex.replace('#', '')
  if (normalized.length !== 6) return fallbackRgb()
  const r = Number.parseInt(normalized.slice(0, 2), 16)
  const g = Number.parseInt(normalized.slice(2, 4), 16)
  const b = Number.parseInt(normalized.slice(4, 6), 16)
  if ([r, g, b].some(value => Number.isNaN(value))) {
    return fallbackRgb()
  }
  return { r, g, b }
}

function fallbackRgb(): RGBColor {
  return { r: 0, g: 0, b: 0 }
}
