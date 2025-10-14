import type { GravityWellModifier } from '../../../devtools'
import type { ArenaDimensions } from '../shared'
import { clamp, randomRange } from '../shared'

export interface PortalEndpoint {
  x: number
  y: number
  radius: number
}

export interface PortalPair {
  id: number
  entry: PortalEndpoint
  exit: PortalEndpoint
}

interface PortalConfigSnapshot {
  pairCount: number
  radius: number
  margin: number
  cooldown: number
  rotationSpeed: number
}

export interface PortalState {
  pairs: PortalPair[]
  lastConfig: PortalConfigSnapshot | null
  rotation: number
}

export interface PortalConfigDefaults {
  pairCount: number
  radius: number
  margin: number
  cooldown: number
  rotationSpeed: number
}

const DEFAULTS: PortalConfigDefaults = {
  pairCount: 2,
  radius: 36,
  margin: 96,
  cooldown: 0.18,
  rotationSpeed: 0,
}

type PortalModifierConfig = GravityWellModifier & {
  portalPairs?: number
  portalRadius?: number
  portalMargin?: number
  portalCooldown?: number
  portalRotationSpeed?: number
}

interface BallLike {
  x: number
  y: number
  vx: number
  vy: number
  radius: number
  portalCooldown?: number
}

export function createPortalState(): PortalState {
  return {
    pairs: [],
    lastConfig: null,
    rotation: 0,
  }
}

export function clearPortalState(state: PortalState) {
  state.pairs.length = 0
  state.lastConfig = null
  state.rotation = 0
}

export function maintainPortalState(
  state: PortalState,
  modifier: GravityWellModifier,
  dimensions: ArenaDimensions,
  defaults: Partial<PortalConfigDefaults> = {},
) {
  if (!modifier.enabled) {
    clearPortalState(state)
    return
  }

  const config = sanitizePortalConfig(modifier, dimensions, defaults)
  if (!state.lastConfig || state.pairs.length === 0) {
    rebuildPortalPairs(state, config, dimensions)
    state.lastConfig = config
    return
  }

  const previous = state.lastConfig
  const needsRebuild =
    previous.pairCount !== config.pairCount ||
    previous.radius !== config.radius ||
    previous.margin !== config.margin ||
    previous.cooldown !== config.cooldown

  state.lastConfig = config

  if (needsRebuild) {
    rebuildPortalPairs(state, config, dimensions)
  }
}

export function resetPortalState(
  state: PortalState,
  modifier: GravityWellModifier,
  dimensions: ArenaDimensions,
  defaults: Partial<PortalConfigDefaults> = {},
) {
  if (!modifier.enabled) {
    clearPortalState(state)
    return
  }

  const config = sanitizePortalConfig(modifier, dimensions, defaults)
  rebuildPortalPairs(state, config, dimensions)
  state.lastConfig = config
  normalizeRotation(state)
}

export function updatePortalState(
  state: PortalState,
  modifier: GravityWellModifier,
  dt: number,
) {
  if (!modifier.enabled) return
  const config = state.lastConfig
  if (!config) return
  if (!Number.isFinite(config.rotationSpeed) || config.rotationSpeed === 0) return

  state.rotation += config.rotationSpeed * dt
  normalizeRotation(state)
}

export function tryResolvePortalTeleport(
  state: PortalState,
  modifier: GravityWellModifier,
  dimensions: ArenaDimensions,
  ball: BallLike,
  defaults: Partial<PortalConfigDefaults> = {},
): boolean {
  if (!modifier.enabled) return false
  if (state.pairs.length === 0) return false

  const cooldown = Math.max(0, state.lastConfig?.cooldown ?? sanitizePortalConfig(modifier, dimensions, defaults).cooldown)
  if ((ball.portalCooldown ?? 0) > 0) return false

  for (const pair of state.pairs) {
    if (tryEndpointTeleport(ball, pair.entry, pair.exit, dimensions, state.rotation, cooldown)) {
      return true
    }
    if (tryEndpointTeleport(ball, pair.exit, pair.entry, dimensions, state.rotation, cooldown)) {
      return true
    }
  }

  return false
}

function tryEndpointTeleport(
  ball: BallLike,
  source: PortalEndpoint,
  target: PortalEndpoint,
  dimensions: ArenaDimensions,
  fallbackAngle: number,
  cooldown: number,
): boolean {
  const dx = ball.x - source.x
  const dy = ball.y - source.y
  const distance = Math.hypot(dx, dy)
  const threshold = source.radius + Math.max(4, ball.radius * 0.5)
  if (distance > threshold) return false

  const speed = Math.hypot(ball.vx, ball.vy)
  let nx = 0
  let ny = 0
  if (speed > 0) {
    nx = ball.vx / speed
    ny = ball.vy / speed
  } else {
    nx = Math.cos(fallbackAngle)
    ny = Math.sin(fallbackAngle)
  }

  const exitRadius = target.radius + ball.radius + 4
  ball.x = clamp(target.x + nx * exitRadius, ball.radius, dimensions.width - ball.radius)
  ball.y = clamp(target.y + ny * exitRadius, ball.radius, dimensions.height - ball.radius)
  if (speed <= 0) {
    ball.vx = Math.cos(fallbackAngle) * 0
    ball.vy = Math.sin(fallbackAngle) * 0
  }
  ball.portalCooldown = cooldown
  return true
}

function rebuildPortalPairs(
  state: PortalState,
  config: PortalConfigSnapshot,
  dimensions: ArenaDimensions,
) {
  state.pairs.length = 0

  const endpoints: PortalEndpoint[] = []
  const minX = config.margin
  const maxX = Math.max(config.margin, dimensions.width - config.margin)
  const minY = config.margin
  const maxY = Math.max(config.margin, dimensions.height - config.margin)

  const minDistance = config.radius * 2.6
  for (let i = 0; i < config.pairCount; i++) {
    const entry = placeEndpoint(endpoints, config.radius, minX, maxX, minY, maxY, minDistance, dimensions)
    endpoints.push(entry)
    const exit = placeEndpoint(endpoints, config.radius, minX, maxX, minY, maxY, minDistance, dimensions)
    endpoints.push(exit)
    state.pairs.push({ id: i, entry, exit })
  }

  normalizeRotation(state)
}

function placeEndpoint(
  existing: PortalEndpoint[],
  radius: number,
  minX: number,
  maxX: number,
  minY: number,
  maxY: number,
  minDistance: number,
  dimensions: ArenaDimensions,
): PortalEndpoint {
  const clampedMinX = clamp(minX, radius, dimensions.width - radius)
  const clampedMaxX = clamp(maxX, radius, dimensions.width - radius)
  const clampedMinY = clamp(minY, radius, dimensions.height - radius)
  const clampedMaxY = clamp(maxY, radius, dimensions.height - radius)

  for (let attempt = 0; attempt < 32; attempt++) {
    const x = randomRange(clampedMinX, clampedMaxX)
    const y = randomRange(clampedMinY, clampedMaxY)
    if (existing.every(endpoint => Math.hypot(endpoint.x - x, endpoint.y - y) >= minDistance)) {
      return { x, y, radius }
    }
  }

  const fallbackX = clamp(dimensions.width / 2 + randomRange(-radius, radius), radius, dimensions.width - radius)
  const fallbackY = clamp(dimensions.height / 2 + randomRange(-radius, radius), radius, dimensions.height - radius)
  return { x: fallbackX, y: fallbackY, radius }
}

function sanitizePortalConfig(
  modifier: GravityWellModifier,
  dimensions: ArenaDimensions,
  defaults: Partial<PortalConfigDefaults> = {},
): PortalConfigSnapshot {
  const resolvedDefaults = { ...DEFAULTS, ...defaults }
  const portalModifier = modifier as PortalModifierConfig
  const maxPairs = 6
  const rawPairs = Number(portalModifier.portalPairs)
  const pairCount = clamp(
    Number.isFinite(rawPairs) ? Math.floor(rawPairs) : resolvedDefaults.pairCount,
    1,
    maxPairs,
  )

  const rawRadius = Number(portalModifier.portalRadius)
  const fallbackRadius = Number.isFinite(modifier.radius)
    ? Number(modifier.radius)
    : resolvedDefaults.radius
  const maxRadius = Math.min(dimensions.width, dimensions.height) / 3 || resolvedDefaults.radius
  const radius = clamp(
    Number.isFinite(rawRadius) ? rawRadius : fallbackRadius,
    12,
    Math.max(12, maxRadius),
  )

  const rawMargin = Number(portalModifier.portalMargin)
  const minMargin = radius + 24
  const maxMargin = Math.min(dimensions.width, dimensions.height) / 2 || resolvedDefaults.margin
  const margin = clamp(
    Number.isFinite(rawMargin) ? rawMargin : resolvedDefaults.margin,
    minMargin,
    Math.max(minMargin, maxMargin),
  )

  const rawCooldown = Number(portalModifier.portalCooldown)
  const cooldown = Math.max(0, Number.isFinite(rawCooldown) ? rawCooldown : resolvedDefaults.cooldown)

  const rawRotation = Number(portalModifier.portalRotationSpeed)
  const rotationSpeed = Number.isFinite(rawRotation) ? rawRotation : resolvedDefaults.rotationSpeed

  return { pairCount, radius, margin, cooldown, rotationSpeed }
}

function normalizeRotation(state: PortalState) {
  const tau = Math.PI * 2
  state.rotation = ((state.rotation % tau) + tau) % tau
}

