import defaultDevConfig from './devConfig.json'

export const GRAVITY_WELL_KEYS = [
  'blackHole',
  'blackMole',
  'gopher',
  'superMassive',
  'whiteDwarf',
  'divots',
  'ireland',
] as const

export type GravityWellKey = (typeof GRAVITY_WELL_KEYS)[number]

export interface ModifierBase {
  name: string
  description: string
  enabled: boolean
}

export interface GravityWellModifier extends ModifierBase {
  gravityStrength: number
  gravityFalloff: number
  radius: number
  wanderWidthPercentage?: number
  pauseDuration?: number
  wanderSpeed?: number
}

export type ArenaModifiers = Record<GravityWellKey, GravityWellModifier>

export interface ModifiersConfig {
  arena: ArenaModifiers
  ball: Record<string, unknown>
  paddle: Record<string, unknown>
}

export interface DevConfig {
  paddleSpeed: number
  baseBallSpeed: number
  minHorizontalRatio: number
  speedIncreaseOnHit: number
  modifiers: ModifiersConfig
}

interface GravityWellVisual {
  inner: string
  mid: string
  outer: string
}

export const GRAVITY_WELL_VISUALS: Record<GravityWellKey, GravityWellVisual> = {
  blackHole: {
    inner: 'rgba(148, 163, 184, 0.75)',
    mid: 'rgba(148, 163, 184, 0.35)',
    outer: 'rgba(15, 23, 42, 0)',
  },
  blackMole: {
    inner: 'rgba(45, 212, 191, 0.65)',
    mid: 'rgba(34, 197, 94, 0.3)',
    outer: 'rgba(15, 23, 42, 0)',
  },
  gopher: {
    inner: 'rgba(244, 114, 182, 0.65)',
    mid: 'rgba(236, 72, 153, 0.3)',
    outer: 'rgba(15, 23, 42, 0)',
  },
  superMassive: {
    inner: 'rgba(96, 165, 250, 0.45)',
    mid: 'rgba(59, 130, 246, 0.25)',
    outer: 'rgba(15, 23, 42, 0)',
  },
  whiteDwarf: {
    inner: 'rgba(226, 232, 240, 0.8)',
    mid: 'rgba(241, 245, 249, 0.45)',
    outer: 'rgba(15, 23, 42, 0)',
  },
  divots: {
    inner: 'rgba(251, 191, 36, 0.6)',
    mid: 'rgba(250, 204, 21, 0.32)',
    outer: 'rgba(15, 23, 42, 0)',
  },
  ireland: {
    inner: 'rgba(74, 222, 128, 0.55)',
    mid: 'rgba(34, 197, 94, 0.28)',
    outer: 'rgba(15, 23, 42, 0)',
  },
}

const DEFAULT_DEV_CONFIG: DevConfig = defaultDevConfig as DevConfig

export function createDevConfig(): DevConfig {
  return deepClone(DEFAULT_DEV_CONFIG)
}

export function deepClone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value))
}

export function getGravityWellsEntries(
  arena: ArenaModifiers,
): [GravityWellKey, GravityWellModifier][] {
  return GRAVITY_WELL_KEYS.map(key => [key, arena[key]])
}
