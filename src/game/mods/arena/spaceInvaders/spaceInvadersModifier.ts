import type { SpaceInvadersModifier } from '../../../devtools'
import type { ArenaDimensions } from '../shared'
import { clamp } from '../shared'

type BarricadeSide = 'left' | 'right'

interface BallLike {
  x: number
  y: number
  vx: number
  vy: number
  radius: number
}

export interface SpaceInvadersBarricade {
  x: number
  y: number
  width: number
  height: number
  hitsRemaining: number
  maxHits: number
}

interface SpaceInvadersConfigSnapshot {
  count: number
  spacing: number
  distance: number
  health: number
  width: number
  height: number
}

export interface SpaceInvadersState {
  left: SpaceInvadersBarricade[]
  right: SpaceInvadersBarricade[]
  lastConfig: SpaceInvadersConfigSnapshot | null
}

const BASE_BARRICADE_WIDTH = 26
const BASE_BARRICADE_HEIGHT = 56
const MIN_BARRICADE_HEIGHT = 18
const COLLISION_EPSILON = 0.5

export function createSpaceInvadersState(): SpaceInvadersState {
  return {
    left: [],
    right: [],
    lastConfig: null,
  }
}

export function clearSpaceInvadersState(state: SpaceInvadersState) {
  state.left.length = 0
  state.right.length = 0
  state.lastConfig = null
}

export function maintainSpaceInvadersState(
  state: SpaceInvadersState,
  modifier: SpaceInvadersModifier,
  dimensions: ArenaDimensions,
) {
  if (!modifier.enabled) {
    clearSpaceInvadersState(state)
    return
  }

  const config = sanitizeConfig(modifier, dimensions)
  if (!state.lastConfig || !isSameConfig(state.lastConfig, config)) {
    rebuildBarricades(state, config, dimensions)
    state.lastConfig = config
  }
}

export function resetSpaceInvadersState(
  state: SpaceInvadersState,
  modifier: SpaceInvadersModifier,
  dimensions: ArenaDimensions,
) {
  if (!modifier.enabled) {
    clearSpaceInvadersState(state)
    return
  }

  const config = sanitizeConfig(modifier, dimensions)
  rebuildBarricades(state, config, dimensions)
  state.lastConfig = config
}

export function resolveSpaceInvadersCollision(
  state: SpaceInvadersState,
  modifier: SpaceInvadersModifier,
  ball: BallLike,
): boolean {
  if (!modifier.enabled) return false

  const sides: BarricadeSide[] = ['left', 'right']
  for (const side of sides) {
    const barricades = side === 'left' ? state.left : state.right
    for (let i = 0; i < barricades.length; i++) {
      const barricade = barricades[i]
      if (barricade.hitsRemaining <= 0) continue
      if (!resolveCircleRectCollision(ball, barricade)) continue

      barricade.hitsRemaining = Math.max(0, barricade.hitsRemaining - 1)
      if (barricade.hitsRemaining <= 0) {
        barricades.splice(i, 1)
      }
      return true
    }
  }

  return false
}

function rebuildBarricades(
  state: SpaceInvadersState,
  config: SpaceInvadersConfigSnapshot,
  dimensions: ArenaDimensions,
) {
  state.left.length = 0
  state.right.length = 0

  const totalHeight = config.count * config.height + (config.count - 1) * config.spacing
  const startY = Math.max(0, (dimensions.height - totalHeight) / 2)

  const leftX = computeColumnX('left', config, dimensions)
  const rightX = computeColumnX('right', config, dimensions)

  for (let i = 0; i < config.count; i++) {
    const y = startY + i * (config.height + config.spacing)
    const barricade = createBarricade(leftX, y, config)
    state.left.push(barricade)
  }

  for (let i = 0; i < config.count; i++) {
    const y = startY + i * (config.height + config.spacing)
    const barricade = createBarricade(rightX, y, config)
    state.right.push(barricade)
  }
}

function createBarricade(
  x: number,
  y: number,
  config: SpaceInvadersConfigSnapshot,
): SpaceInvadersBarricade {
  return {
    x,
    y,
    width: config.width,
    height: config.height,
    hitsRemaining: config.health,
    maxHits: config.health,
  }
}

function computeColumnX(
  side: BarricadeSide,
  config: SpaceInvadersConfigSnapshot,
  dimensions: ArenaDimensions,
): number {
  const centerOffset = side === 'left' ? -config.distance : config.distance
  const centerX = dimensions.width / 2 + centerOffset
  const minX = 0
  const maxX = Math.max(0, dimensions.width - config.width)
  return clamp(centerX - config.width / 2, minX, maxX)
}

function sanitizeConfig(
  modifier: SpaceInvadersModifier,
  dimensions: ArenaDimensions,
): SpaceInvadersConfigSnapshot {
  const rawCount = Number(modifier.barricadeCount)
  const count = Math.max(1, Math.floor(Number.isFinite(rawCount) ? rawCount : 4))

  const rawHealth = Number(modifier.barricadeHealth)
  const health = Math.max(1, Math.floor(Number.isFinite(rawHealth) ? rawHealth : 3))

  const rawSpacing = Number(modifier.barricadeSpacing)
  const unclampedSpacing = Number.isFinite(rawSpacing) ? rawSpacing : 24
  const maxSpacing = count > 1
    ? Math.max(0, (dimensions.height - MIN_BARRICADE_HEIGHT * count) / (count - 1))
    : 0
  const spacing = clamp(unclampedSpacing, 0, maxSpacing)

  const rawDistance = Number(modifier.barricadeDistance)
  const maxDistance = Math.max(0, dimensions.width / 2 - BASE_BARRICADE_WIDTH / 2)
  const distance = clamp(Number.isFinite(rawDistance) ? rawDistance : 120, 0, maxDistance)

  const availableHeight = Math.max(
    dimensions.height - spacing * (count - 1),
    MIN_BARRICADE_HEIGHT * count,
  )
  const height = clamp(availableHeight / count, MIN_BARRICADE_HEIGHT, BASE_BARRICADE_HEIGHT)

  return {
    count,
    spacing,
    distance,
    health,
    width: BASE_BARRICADE_WIDTH,
    height,
  }
}

function isSameConfig(
  a: SpaceInvadersConfigSnapshot,
  b: SpaceInvadersConfigSnapshot,
): boolean {
  return (
    a.count === b.count &&
    a.spacing === b.spacing &&
    a.distance === b.distance &&
    a.health === b.health &&
    a.width === b.width &&
    a.height === b.height
  )
}

function resolveCircleRectCollision(ball: BallLike, rect: SpaceInvadersBarricade): boolean {
  const radius = Math.max(1, ball.radius)
  const left = rect.x
  const right = rect.x + rect.width
  const top = rect.y
  const bottom = rect.y + rect.height

  const closestX = clamp(ball.x, left, right)
  const closestY = clamp(ball.y, top, bottom)
  const diffX = ball.x - closestX
  const diffY = ball.y - closestY
  const distSq = diffX * diffX + diffY * diffY

  if (distSq > radius * radius) {
    return false
  }

  if (distSq === 0) {
    const distances = [
      { axis: 'left' as const, value: Math.abs(ball.x - left) },
      { axis: 'right' as const, value: Math.abs(right - ball.x) },
      { axis: 'top' as const, value: Math.abs(ball.y - top) },
      { axis: 'bottom' as const, value: Math.abs(bottom - ball.y) },
    ]
    distances.sort((a, b) => a.value - b.value)
    const nearest = distances[0]

    switch (nearest.axis) {
      case 'left':
        ball.x = left - radius - COLLISION_EPSILON
        if (ball.vx > 0) ball.vx *= -1
        break
      case 'right':
        ball.x = right + radius + COLLISION_EPSILON
        if (ball.vx < 0) ball.vx *= -1
        break
      case 'top':
        ball.y = top - radius - COLLISION_EPSILON
        if (ball.vy > 0) ball.vy *= -1
        break
      case 'bottom':
        ball.y = bottom + radius + COLLISION_EPSILON
        if (ball.vy < 0) ball.vy *= -1
        break
    }

    return true
  }

  const dist = Math.sqrt(distSq)
  const nx = diffX / dist
  const ny = diffY / dist
  const penetration = radius - dist + COLLISION_EPSILON

  ball.x += nx * penetration
  ball.y += ny * penetration

  const dot = ball.vx * nx + ball.vy * ny
  if (dot < 0) {
    ball.vx -= 2 * dot * nx
    ball.vy -= 2 * dot * ny
  }

  return true
}
