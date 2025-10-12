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

export const BALL_MODIFIER_KEYS = ['kite', 'bumShuffle', 'pollok', 'snowball', 'meteor'] as const
export const PADDLE_MODIFIER_KEYS = [
  'chilly',
  'buckTooth',
  'osteoWhat',
  'brokePhysics',
  'hadron',
  'foosball',
] as const

export type BallModifierKey = (typeof BALL_MODIFIER_KEYS)[number]
export type PaddleModifierKey = (typeof PADDLE_MODIFIER_KEYS)[number]

export interface ModifierBase {
  name: string
  description: string
  enabled: boolean
}

export interface GravityWellModifier extends ModifierBase {
  gravityStrength: number
  gravityFalloff: number
  radius: number
  positiveTint: string
  negativeTint: string
  wanderWidthPercentage?: number
  pauseDuration?: number
  wanderSpeed?: number
}

export type ArenaModifiers = Record<GravityWellKey, GravityWellModifier>

export interface KiteModifier extends ModifierBase {
  tailLength: number
}

export interface BumShuffleModifier extends ModifierBase {
  trailLength: number
}

export interface PollokModifier extends ModifierBase {
  trailLength: number
  leftColor: string
  rightColor: string
  neutralColor: string
}

export interface SnowballModifier extends ModifierBase {
  minRadius: number
  maxRadius: number
  growthRate: number
}

export interface MeteorModifier extends ModifierBase {
  startRadius: number
  minRadius: number
  shrinkRate: number
}

export type BallModifiers = {
  kite: KiteModifier
  bumShuffle: BumShuffleModifier
  pollok: PollokModifier
  snowball: SnowballModifier
  meteor: MeteorModifier
}

export interface ChillyModifier extends ModifierBase {
  startingHeight: number
  shrinkAmount: number
  minimumHeight: number
}

export interface BuckToothModifier extends ModifierBase {
  gapSize: number
}

export interface OsteoWhatModifier extends ModifierBase {
  segmentCount: number
  gapSize: number
  hitsBeforeBreak: number
}

export interface BrokePhysicsModifier extends ModifierBase {
  centerAngle: number
  edgeAngle: number
}

export interface HadronModifier extends ModifierBase {
  splitAngle: number
  armedColor: string
  disarmedColor: string
}

export interface FoosballModifier extends ModifierBase {
  gapSize: number
}

export type PaddleModifiers = {
  chilly: ChillyModifier
  buckTooth: BuckToothModifier
  osteoWhat: OsteoWhatModifier
  brokePhysics: BrokePhysicsModifier
  hadron: HadronModifier
  foosball: FoosballModifier
}

export interface ModifiersConfig {
  arena: ArenaModifiers
  ball: BallModifiers
  paddle: PaddleModifiers
}

export interface DoublesConfig {
  enabled: boolean
  insideOffset: number
}

export interface DevConfig {
  paddleSpeed: number
  leftPaddleSpeedMultiplier: number
  rightPaddleSpeedMultiplier: number
  leftPaddleSizeMultiplier: number
  rightPaddleSizeMultiplier: number
  baseBallSpeed: number
  minHorizontalRatio: number
  speedIncreaseOnHit: number
  doubles: DoublesConfig
  modifiers: ModifiersConfig
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

export function getBallModifiersEntries(
  ball: BallModifiers,
): [BallModifierKey, BallModifiers[BallModifierKey]][] {
  return BALL_MODIFIER_KEYS.map(key => [key, ball[key]])
}

export function getPaddleModifiersEntries(
  paddle: PaddleModifiers,
): [PaddleModifierKey, PaddleModifiers[PaddleModifierKey]][] {
  return PADDLE_MODIFIER_KEYS.map(key => [key, paddle[key]])
}
