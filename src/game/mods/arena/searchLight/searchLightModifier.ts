import type { SearchLightModifier } from '../../../devtools'

const DEFAULT_BEAM_COLOR = '#334155'
const DEFAULT_CONE_LENGTH = 240
const DEFAULT_CONE_WIDTH = 220
const DEFAULT_BALL_BRIGHTNESS = 1

export function getSearchLightBeamColor(modifier: SearchLightModifier): string {
  if (modifier && typeof modifier.beamColor === 'string') {
    const trimmed = modifier.beamColor.trim()
    if (trimmed.length > 0) {
      return trimmed
    }
  }
  return DEFAULT_BEAM_COLOR
}

export function getSearchLightConeLength(modifier: SearchLightModifier): number {
  const value = Number(modifier?.coneLength)
  if (Number.isFinite(value)) {
    return Math.max(0, value)
  }
  return DEFAULT_CONE_LENGTH
}

export function getSearchLightConeWidth(modifier: SearchLightModifier): number {
  const value = Number(modifier?.coneWidth)
  if (Number.isFinite(value)) {
    return Math.max(0, value)
  }
  return DEFAULT_CONE_WIDTH
}

export function getSearchLightBallBrightness(modifier: SearchLightModifier): number {
  const value = Number(modifier?.ballBrightness)
  if (Number.isFinite(value)) {
    return Math.max(0, Math.min(2, value))
  }
  return DEFAULT_BALL_BRIGHTNESS
}
