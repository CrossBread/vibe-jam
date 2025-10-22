/*
 * Copyright (c) 2025. CrossBread Tech All rights reserved.
 */

import defaultDevConfig from './devConfig.json'

export const GRAVITY_WELL_KEYS = [
  'blackHole',
  'blackMole',
  'ceres',
  'divots',
  'drinkMe',
  'fogOfWar',
  'gopher',
  'ireland',
  'jupiter',
  'madHatter',
  'minesweeper',
  'russianRoulette',
  'searchLight',
  'secondChances',
  'spaceInvaders',
  'superMassive',
  'teaParty',
  'threeBodyProblem',
  'vortex',
  'whiteDwarf',
  'wonderland',
  'wormhole',
] as const

export type GravityWellKey = (typeof GRAVITY_WELL_KEYS)[number]

export const BALL_MODIFIER_KEYS = [
  'bumShuffle',
  'kite',
  'meteor',
  'pollok',
  'snowball',
] as const
export const PADDLE_MODIFIER_KEYS = [
  'angry',
  'apparition',
  'bendy',
  'brokePhysics',
  'buckTooth',
  'bungee',
  'charlotte',
  'chilly',
  'crabby',
  'dizzy',
  'dundee',
  'foosball',
  'frisbee',
  'hadron',
  'inchworm',
  'missileCommander',
  'outOfBody',
  'osteoWhat',
  'slinky',
] as const

export type BallModifierKey = (typeof BALL_MODIFIER_KEYS)[number]
export type PaddleModifierKey = (typeof PADDLE_MODIFIER_KEYS)[number]

export interface ModifierBase {
  name: string
  description: string
  enabled: boolean
  includeInRandom: boolean
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
  illusionFadeDistance?: number
  illusionFadeSpeed?: number
  fogExpansionSpeed?: number
  fogMaxRadius?: number
  fogMaxOpacity?: number
  snowflakeCount?: number
  snowflakeSize?: number
  snowflakeSpeed?: number
  snowOpacity?: number
}

export interface ThreeBodyProblemModifier extends GravityWellModifier {
  orbitGravityStrength: number
  orbitGravityFalloff: number
  orbitRadius: number
  orbitDistance: number
  orbitSpeed: number
  orbitPositiveTint: string
  orbitNegativeTint: string
}

export interface PaddlePotionModifier extends GravityWellModifier {
  objectRadius?: number
  spawnCount?: number
  shrinkAmount?: number
  growAmount?: number
  objectColor?: string
}

export type DrinkMeModifier = PaddlePotionModifier

export type TeaPartyModifier = PaddlePotionModifier

export type ArenaModifiers = {
  [K in GravityWellKey]: K extends 'searchLight'
    ? SearchLightModifier
    : K extends 'threeBodyProblem'
      ? ThreeBodyProblemModifier
      : GravityWellModifier
}

export interface SecondChancesModifier extends GravityWellModifier {
  maxHits?: number
}

export interface SpaceInvadersModifier extends GravityWellModifier {
  barricadeHealth?: number
  barricadeCount?: number
  barricadeSpacing?: number
  barricadeDistance?: number
}

export interface MinesweeperModifier extends GravityWellModifier {
  gridSpacing?: number
  squareSize?: number
  rows?: number
  columns?: number
}

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

export interface SearchLightModifier extends GravityWellModifier {
  beamColor: string
  coneLength: number
  coneWidth: number
  ballBrightness: number
}

export interface ChillyModifier extends ModifierBase {
  startingHeight: number
  shrinkAmount: number
  minimumHeight: number
  paddleSizeMultiplier: number
}

export interface ApparitionModifier extends ModifierBase {
  minOpacity: number
  fadeDuration: number
  visibleHoldDuration: number
  hiddenHoldDuration: number
  paddleSizeMultiplier: number
}

export interface OutOfBodyModifier extends ModifierBase {
  paddleOpacity: number
  trailLength: number
  sampleInterval: number
  trailFade: number
  paddleSizeMultiplier: number
}

export interface BendyModifier extends ModifierBase {
  paddleSizeMultiplier: number
  maxOffset: number
  oscillationSpeed: number
  speedForMaxBend: number
}

export interface BuckToothModifier extends ModifierBase {
  gapSize: number
  paddleSizeMultiplier: number
}

export interface CrabbyModifier extends ModifierBase {
  gapSize: number
  clawRatio: number
  clawAdvantage: number
  swapSides: boolean
  paddleSizeMultiplier: number
}

export interface OsteoWhatModifier extends ModifierBase {
  segmentCount: number
  gapSize: number
  hitsBeforeBreak: number
  paddleSizeMultiplier: number
  strongColor: string
  weakColor: string
}

export interface BrokePhysicsModifier extends ModifierBase {
  centerAngle: number
  edgeAngle: number
  paddleSizeMultiplier: number
}

export interface HadronModifier extends ModifierBase {
  splitAngle: number
  armedColor: string
  disarmedColor: string
  paddleSizeMultiplier: number
}

export interface FoosballModifier extends ModifierBase {
  gapSize: number
  paddleSizeMultiplier: number
}

export interface DizzyModifier extends ModifierBase {
  paddleSizeMultiplier: number
}

export interface BungeeModifier extends ModifierBase {
  paddleSizeMultiplier: number
  returnSpeed: number
}

export interface AngryModifier extends ModifierBase {
  paddleSizeMultiplier: number
  stretchSpeed: number
  maxStretch: number
  releaseSpeed: number
  moveSpeedMultiplier: number
}

export interface InchwormModifier extends ModifierBase {
  paddleSizeMultiplier: number
  shrinkAmount: number
  minimumHeight: number
  shrinkSpeed: number
  extendSpeed: number
}

export interface SlinkyModifier extends ModifierBase {
  paddleSizeMultiplier: number
  flopRate: number
}

export interface MissileCommanderModifier extends ModifierBase {
  paddleSizeMultiplier: number
  launchSpeed: number
  cooldown: number
  missileHeight: number
  missileLifetime: number
}

export interface FrisbeeModifier extends ModifierBase {
  paddleSizeMultiplier: number
  throwSpeed: number
}

export interface DundeeModifier extends ModifierBase {
  paddleSizeMultiplier: number
  baseSpeed: number
  acceleration: number
  maxSpeed: number
}

export interface CharlotteModifier extends ModifierBase {
  paddleSizeMultiplier: number
  webWidthMultiplier: number
  maxWebLengthMultiplier: number
}

export type PaddleModifiers = {
  apparition: ApparitionModifier
  outOfBody: OutOfBodyModifier
  bendy: BendyModifier
  chilly: ChillyModifier
  buckTooth: BuckToothModifier
  crabby: CrabbyModifier
  osteoWhat: OsteoWhatModifier
  brokePhysics: BrokePhysicsModifier
  hadron: HadronModifier
  foosball: FoosballModifier
  dizzy: DizzyModifier
  bungee: BungeeModifier
  angry: AngryModifier
  inchworm: InchwormModifier
  slinky: SlinkyModifier
  missileCommander: MissileCommanderModifier
  frisbee: FrisbeeModifier
  dundee: DundeeModifier
  charlotte: CharlotteModifier
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

export type AnimationCurve =
  | 'linear'
  | 'ease-in'
  | 'ease-out'
  | 'ease-in-out'
  | 'ease-out-back'

export interface UITypographySettings {
  primaryFont: string
  secondaryFont: string
  scoreFontSize: number
  countdownFontScale: number
  countdownMinFontSize: number
  announcementSingleLineSize: number
  announcementDoubleLineSize: number
  announcementTripleLineSize: number
  votingOptionFontSize: number
  votingRandomFontSize: number
  votingIndicatorFontSize: number
  shotClockFontSize: number
}

export interface UIScalingSettings {
  countdownCardScale: number
  returnMeterScale: number
  returnMeterSpacing: number
  scoreOffset: number
  halfcourtLineThickness: number
  halfcourtLineColor: string
}

export interface UIAnimationSettings {
  countdownFadeSeconds: number
  countdownFadeCurve: AnimationCurve
  votingPanelFadeSeconds: number
  votingPanelCurve: AnimationCurve
  announcementFadeCurve: AnimationCurve
  modTitleHoldSeconds: number
  modTitleFadeSeconds: number
}

export interface UISettings {
  typography: UITypographySettings
  scaling: UIScalingSettings
  animations: UIAnimationSettings
}

export const ANIMATION_CURVE_OPTIONS: AnimationCurve[] = [
  'linear',
  'ease-in',
  'ease-out',
  'ease-in-out',
  'ease-out-back',
]

export interface DevConfig {
  inMotionServe: boolean
  serveCarryDistance: number
  paddleSpeed: number
  leftPaddleSpeedMultiplier: number
  rightPaddleSpeedMultiplier: number
  leftPaddleSizeMultiplier: number
  rightPaddleSizeMultiplier: number
  baseBallSpeed: number
  minHorizontalRatio: number
  speedIncreaseOnHit: number
  shotClockSeconds: number
  maxAiMisalignment: number
  lockMods: boolean
  doubles: DoublesConfig
  modifiers: ModifiersConfig
  ui: UISettings
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
