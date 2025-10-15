import {
  GRAVITY_WELL_KEYS,
  createDevConfig,
  deepClone,
  getGravityWellsEntries,
  type ArenaModifiers,
  type GravityWellKey,
  type GravityWellModifier,
  type SearchLightModifier,
  type SecondChancesModifier,
  type SpaceInvadersModifier,
  type MinesweeperModifier,
} from './devtools'
import { createDevOverlay, showOverlay, toggleOverlay } from './devOverlay'
import type { RGBColor } from './mods/ball/shared'
import { clampByte } from './mods/ball/shared'
import {
  clearBumShuffleTrail,
  createBumShuffleState,
  type BumShuffleState,
  updateBumShuffleTrail,
} from './mods/ball/bumShuffle/bumShuffleModifier'
import { drawBumShuffleTrail } from './mods/ball/bumShuffle/bumShuffleView'
import {
  clearKiteTrail,
  createKiteState,
  type KiteState,
  updateKiteTrail,
} from './mods/ball/kite/kiteModifier'
import { drawKiteTrail } from './mods/ball/kite/kiteView'
import {
  clearPollokTrail,
  createPollokState,
  getPollokColor,
  registerPollokReturn,
  type PollokState,
  updatePollokTrail,
} from './mods/ball/pollok/pollokModifier'
import { drawPollokTrail } from './mods/ball/pollok/pollokView'
import { applyMeteorShrink } from './mods/ball/meteor/meteorModifier'
import { applySnowballGrowth } from './mods/ball/snowball/snowballModifier'
import type { ActiveGravityWell, ArenaDimensions } from './mods/arena/shared'
import { drawGravityWells } from './mods/arena/gravityWell/gravityWellView'
import { drawSearchLightBeams, type SearchLightPaddleSnapshot } from './mods/arena/searchLight/searchLightView'
import { getSearchLightBallBrightness } from './mods/arena/searchLight/searchLightModifier'
import {
  createDivotsState,
  clearDivots,
  spawnDivotWell as addDivotWell,
  updateDivotsState as maintainDivotsState,
  type DivotsState,
} from './mods/arena/divots/divotsModifier'
import { getDivotsWells } from './mods/arena/divots/divotsView'
import {
  createIrelandState,
  clearIrelandWells,
  ensureIrelandWells,
  markIrelandNeedsRegeneration,
  regenerateIrelandWells as rebuildIrelandWells,
  type IrelandState,
} from './mods/arena/ireland/irelandModifier'
import { getIrelandWells } from './mods/arena/ireland/irelandView'
import {
  createBlackMoleState,
  resetBlackMoleState,
  updateBlackMoleState,
  type BlackMoleState,
} from './mods/arena/blackMole/blackMoleModifier'
import { getBlackMoleWells } from './mods/arena/blackMole/blackMoleView'
import {
  createGopherState,
  resetGopherState,
  updateGopherState,
  type GopherState,
} from './mods/arena/gopher/gopherModifier'
import { getGopherWells } from './mods/arena/gopher/gopherView'
import {
  createCeresState,
  resetCeresState,
  updateCeresState,
  type CeresState,
} from './mods/arena/ceres/ceresModifier'
import { getCeresWells } from './mods/arena/ceres/ceresView'
import {
  clearDrinkMeState,
  createDrinkMeState,
  maintainDrinkMeState,
  respawnDrinkMeObject,
  type DrinkMeState,
} from './mods/arena/drinkMe/drinkMeModifier'
import { getDrinkMeObjects } from './mods/arena/drinkMe/drinkMeView'
import {
  clearTeaPartyState,
  createTeaPartyState,
  maintainTeaPartyState,
  respawnTeaPartyObject,
  type TeaPartyState,
} from './mods/arena/teaParty/teaPartyModifier'
import { getTeaPartyObjects } from './mods/arena/teaParty/teaPartyView'
import { getBlackHoleWells } from './mods/arena/blackHole/blackHoleView'
import { getSuperMassiveWells } from './mods/arena/superMassive/superMassiveView'
import { getWhiteDwarfWells } from './mods/arena/whiteDwarf/whiteDwarfView'
import {
  createFogOfWarState,
  resetFogOfWarState,
  updateFogOfWarState,
  type FogOfWarState,
} from './mods/arena/fogOfWar/fogOfWarModifier'
import { drawFogOfWarOverlay } from './mods/arena/fogOfWar/fogOfWarView'
import {
  createWonderlandState,
  resetWonderlandState,
  updateWonderlandState,
  type WonderlandState,
} from './mods/arena/wonderland/wonderlandModifier'
import { drawWonderlandSnow } from './mods/arena/wonderland/wonderlandView'
import {
  createJupiterState,
  resetJupiterState,
  updateJupiterState,
  type JupiterState,
} from './mods/arena/jupiter/jupiterModifier'
import { getJupiterWells } from './mods/arena/jupiter/jupiterView'
import {
  clearSecondChancesState,
  createSecondChancesState,
  maintainSecondChancesState,
  reflectBallWithSecondChanceShields,
  resetSecondChancesShields,
  type SecondChancesState,
} from './mods/arena/secondChances/secondChancesModifier'
import { drawSecondChanceShields } from './mods/arena/secondChances/secondChancesView'
import {
  clearSpaceInvadersState,
  createSpaceInvadersState,
  maintainSpaceInvadersState,
  resetSpaceInvadersState,
  resolveSpaceInvadersCollision,
  type SpaceInvadersState,
} from './mods/arena/spaceInvaders/spaceInvadersModifier'
import { drawSpaceInvadersBarricades } from './mods/arena/spaceInvaders/spaceInvadersView'
import {
  clearMinesweeperState,
  createMinesweeperState,
  maintainMinesweeperState,
  resetMinesweeperState,
  resolveMinesweeperCollision,
  type MinesweeperState,
} from './mods/arena/minesweeper/minesweeperModifier'
import { drawMinesweeperSquares } from './mods/arena/minesweeper/minesweeperView'
import {
  clearWormholeState,
  createWormholeState,
  maintainWormholeState,
  resetWormholeState,
  tryResolveWormholeTeleport,
  type WormholeState,
} from './mods/arena/wormhole/wormholeModifier'
import { drawWormholes } from './mods/arena/wormhole/wormholeView'
import {
  clearVortexState,
  createVortexState,
  maintainVortexState,
  resetVortexState,
  tryResolveVortexTeleport,
  updateVortexState,
  type VortexState,
} from './mods/arena/vortex/vortexModifier'
import { drawVortexPortals } from './mods/arena/vortex/vortexView'
import {
  createApparitionState,
  resetApparitionStates as resetApparitionStateMap,
  updateApparitionStates as updateApparitionStateMap,
  type ApparitionState,
} from './mods/paddle/apparition/apparitionModifier'
import { getApparitionOpacity } from './mods/paddle/apparition/apparitionView'

export interface PongState {
  leftScore: number
  rightScore: number
  ballX: number
  ballY: number
  ballRadius: number
  vx: number
  vy: number
  balls: BallState[]
  leftY: number
  rightY: number
  leftInnerY: number
  rightInnerY: number
  leftPaddleHeight: number
  rightPaddleHeight: number
  leftInnerPaddleHeight: number
  rightInnerPaddleHeight: number
  paused: boolean
  winner: 'left' | 'right' | null
  currentPips: number
  totalPips: number
  totalBites: number
  completedBitesSinceLastPoint: number
}

export interface PongAPI {
  state: PongState

  reset(): void

  tick(dt: number): void
}

export interface PongOptions {
  /**
   * Automatically start the internal requestAnimationFrame loop.
   * Disable for headless/unit testing environments.
   */
  autoStart?: boolean

  /**
   * Duration in seconds before an announcement begins to fade.
   */
  announcementHoldDuration?: number

  /**
   * Duration in seconds for an announcement fade out effect.
   */
  announcementFadeDuration?: number

  /**
   * Duration in seconds that the serve countdown should last.
   */
  serveCountdownDuration?: number

  /**
   * Delay in seconds before a countdown begins when revealing the active mod.
   */
  modRevealDelay?: number
}

type KeySet = Record<string, boolean>

interface Announcement {
  lines: string[]
  elapsed: number
  holdDuration: number
  fadeDuration: number
}

interface PaddleHeightOptions {
  center?: boolean
  preserveCenter?: boolean
}

interface BallState {
  x: number
  y: number
  vx: number
  vy: number
  radius: number
  travelDistance: number
  isReal: boolean
  opacity: number
  lastPaddleHit: 'left' | 'right' | null
  portalCooldown: number
}

type PaddleLane = 'outer' | 'inner' | 'missile'

interface PhysicalPaddle {
  side: 'left' | 'right'
  physicalSide: 'left' | 'right'
  lane: PaddleLane
  x: number
  y: number
  height: number
}

interface PaddleSegment {
  paddle: PhysicalPaddle
  index: number
  x: number
  y: number
  width: number
  height: number
  osteoIndex?: number
  cracked?: boolean
  broken?: boolean
}

type CharlotteAnchor = 'top' | 'bottom' | null

interface CharlotteWebState {
  anchor: CharlotteAnchor
}

interface OutOfBodyTrailPoint {
  y: number
  height: number
}

interface OutOfBodyTrailState {
  points: OutOfBodyTrailPoint[]
  sampleTimer: number
}

interface PaddleMotionSample {
  previousY: number
  velocity: number
}

interface PaddleMotionMap {
  outer: PaddleMotionSample
  inner: PaddleMotionSample
}

interface BendyState {
  phase: number
  intensity: number
  amplitude: number
  wave: number
}

interface OsteoSegmentState {
  hits: number
  broken: boolean
}

interface ActiveMissilePaddle {
  side: 'left' | 'right'
  y: number
  height: number
  vy: number
  age: number
  lifetime: number
}

interface PaddleControlState {
  direction: number
  relativeDelta: number
  hasDirectionalInput: boolean
  upRequested: boolean
  downRequested: boolean
}

export function createPong(
  canvas: HTMLCanvasElement,
  options: PongOptions = {},
): PongAPI {
  const context = canvas.getContext('2d')
  if (!context) throw new Error('Canvas 2D context is required')
  const ctx = context

  const {
    autoStart = true,
    announcementHoldDuration = 3.5,
    announcementFadeDuration = 1.35,
    serveCountdownDuration: serveCountdownDurationOption = 3,
    modRevealDelay: modRevealDelayOption = 2,
  } = options
  const serveCountdownDuration = Math.max(0, serveCountdownDurationOption)
  const modRevealDelayDuration = Math.max(0, modRevealDelayOption)
  const W = canvas.width
  const H = canvas.height
  const BASE_PADDLE_H = 90
  const PADDLE_W = 12
  const BALL_R = 8
  const WIN_SCORE = 11
  const PIPS_PER_BITE = 8
  const ARENA_BACKGROUND = '#10172a'
  const ANNOUNCEMENT_COLOR = '#203275'
  const HIGHLIGHT_COLOR = '#e7ecf3'
  const MAX_KITE_HISTORY = 240
  const MAX_BUM_SHUFFLE_HISTORY = 4000
  const MAX_POLLOK_HISTORY = 6000
  const BUM_SHUFFLE_DISTANCE_SQ = 4
  const POLLOK_DISTANCE_SQ = 9
  const MAX_GRAVITY_VISUAL_STRENGTH = 8_000_000
  const ARENA_BACKGROUND_RGB = hexToRgb(ARENA_BACKGROUND)
  const BLACK_RGB: RGBColor = { r: 0, g: 0, b: 0 }
  const WHITE_RGB: RGBColor = { r: 255, g: 255, b: 255 }
  const LEFT_PADDLE_EDGE_COLOR = '#38bdf8'
  const RIGHT_PADDLE_EDGE_COLOR = '#ef4444'
  const PADDLE_EDGE_WIDTH = 4
  const CHARLOTTE_PADDLE_COLOR = '#6b7280'
  const CHARLOTTE_EDGE_COLOR = '#4b5563'
  const MIN_CHARLOTTE_WEB_LENGTH = 6
  const MIN_POTION_PADDLE_HEIGHT = 36

  const defaults = createDevConfig()
  const config = deepClone(defaults)
  const container = canvas.parentElement
  container?.classList.add('dev-overlay-container')

  const overlay = createDevOverlay(config, defaults, {
    onDockChange: () => syncOverlayLayout(),
  })
  container?.appendChild(overlay)
  syncOverlayLayout()

  type TouchSide = 'left' | 'right'
  type TouchMode = 'direct' | 'relative'

  interface ActiveTouchControl {
    id: number
    side: TouchSide
    mode: TouchMode
    directDirection: -1 | 0 | 1
    lastCanvasY: number
    canvasX: number
    canvasY: number
  }

  const activeTouches = new Map<number, ActiveTouchControl>()
  const touchControls: Record<TouchSide, { direction: number; relativeDelta: number }> = {
    left: { direction: 0, relativeDelta: 0 },
    right: { direction: 0, relativeDelta: 0 },
  }
  let tripleTouchTimeout: number | null = null

  canvas.style.touchAction = 'none'

  canvas.addEventListener('touchstart', handleTouchStart, { passive: false })
  canvas.addEventListener('touchmove', handleTouchMove, { passive: false })
  canvas.addEventListener('touchend', handleTouchEnd)
  canvas.addEventListener('touchcancel', handleTouchEnd)

  const keys: KeySet = {}
  let leftAIEnabled = true
  let rightAIEnabled = true
  let pendingServeToLeft: boolean | null = null
  let serveCountdownRemaining = 0
  let preServeDelayRemaining = 0
  let modRevealDelayPending = false

  interface GamepadInput {
    leftAxis: number
    leftUp: boolean
    leftDown: boolean
    rightAxis: number
    rightUp: boolean
    rightDown: boolean
  }

  const GAMEPAD_DEADZONE = 0.2

  const defaultGamepadInput: GamepadInput = {
    leftAxis: 0,
    leftUp: false,
    leftDown: false,
    rightAxis: 0,
    rightUp: false,
    rightDown: false,
  }

  function withDeadzone(value: number, deadzone = GAMEPAD_DEADZONE): number {
    return Math.abs(value) < deadzone ? 0 : value
  }

  function getGamepadInput(): GamepadInput {
    if (typeof navigator === 'undefined' || !navigator.getGamepads) {
      return defaultGamepadInput
    }

    const pads = navigator.getGamepads()
    let activePad: Gamepad | null = null
    for (const pad of pads) {
      if (pad && pad.mapping === 'standard') {
        activePad = pad
        break
      }
      if (!activePad && pad) {
        activePad = pad
      }
    }

    if (!activePad) {
      return defaultGamepadInput
    }

    const axes = activePad.axes ?? []
    const buttons = activePad.buttons ?? []

    return {
      leftAxis: withDeadzone(axes[1] ?? 0),
      leftUp: Boolean(buttons[12]?.pressed),
      leftDown: Boolean(buttons[13]?.pressed),
      rightAxis: withDeadzone(axes[3] ?? 0),
      rightUp: Boolean(buttons[3]?.pressed),
      rightDown: Boolean(buttons[0]?.pressed),
    }
  }

  function toGravityFalloffValue(range: number): number {
    const radius = Number.isFinite(range) ? Math.max(0, range) : 0
    return radius * radius
  }

  if (typeof window !== 'undefined') {
    window.addEventListener('keydown', (e) => {
      if (e.key === '`' && !e.repeat) {
        toggleOverlay(overlay)
        syncOverlayLayout()
        e.preventDefault()
        return
      }
      keys[e.key] = true
      const key = e.key.toLowerCase()
      if (key === 'w' || key === 's') {
        if (config.doubles.enabled) rightAIEnabled = false
        else leftAIEnabled = false
      }
      if (key === 'arrowup' || key === 'arrowdown') rightAIEnabled = false
    })
    window.addEventListener('keyup', (e) => (keys[e.key] = false))
  }

  const initialLeftHeight = getBasePaddleHeight('left')
  const initialRightHeight = getBasePaddleHeight('right')

  function handleTouchStart(event: TouchEvent) {
    if (event.cancelable) event.preventDefault()
    const rect = canvas.getBoundingClientRect()
    const scaleX = rect.width !== 0 ? W / rect.width : 1
    const scaleY = rect.height !== 0 ? H / rect.height : 1

    for (let i = 0; i < event.changedTouches.length; i++) {
      const touch = event.changedTouches.item(i)
      if (!touch) continue
      const x = (touch.clientX - rect.left) * scaleX
      const y = (touch.clientY - rect.top) * scaleY
      const control = createTouchControl(touch.identifier, x, y)
      if (!control) continue
      activeTouches.set(touch.identifier, control)
      if (control.side === 'left') leftAIEnabled = false
      else rightAIEnabled = false
    }

    recalculateDirectDirections()
    updateTripleTouchHold()
  }

  function handleTouchMove(event: TouchEvent) {
    if (event.cancelable) event.preventDefault()
    const rect = canvas.getBoundingClientRect()
    const scaleX = rect.width !== 0 ? W / rect.width : 1
    const scaleY = rect.height !== 0 ? H / rect.height : 1
    let leftNeedsUpdate = false
    let rightNeedsUpdate = false

    for (let i = 0; i < event.changedTouches.length; i++) {
      const touch = event.changedTouches.item(i)
      if (!touch) continue
      const control = activeTouches.get(touch.identifier)
      if (!control) continue
      const x = (touch.clientX - rect.left) * scaleX
      const y = (touch.clientY - rect.top) * scaleY
      control.canvasX = x
      control.canvasY = y
      if (control.mode === 'direct') {
        const nextDirection = getDirectDirection(y)
        if (nextDirection !== control.directDirection) {
          control.directDirection = nextDirection
          if (control.side === 'left') leftNeedsUpdate = true
          else rightNeedsUpdate = true
        }
      } else {
        const delta = y - control.lastCanvasY
        if (delta !== 0) {
          touchControls[control.side].relativeDelta += delta
          control.lastCanvasY = y
        }
      }
    }

    if (leftNeedsUpdate) recalculateDirectDirection('left')
    if (rightNeedsUpdate) recalculateDirectDirection('right')
    updateTripleTouchHold()
  }

  function handleTouchEnd(event: TouchEvent) {
    if (event.cancelable) event.preventDefault()
    let leftNeedsUpdate = false
    let rightNeedsUpdate = false

    for (let i = 0; i < event.changedTouches.length; i++) {
      const touch = event.changedTouches.item(i)
      if (!touch) continue
      const control = activeTouches.get(touch.identifier)
      if (!control) continue
      activeTouches.delete(touch.identifier)
      if (control.side === 'left') leftNeedsUpdate = true
      else rightNeedsUpdate = true
    }

    if (leftNeedsUpdate) recalculateDirectDirection('left')
    if (rightNeedsUpdate) recalculateDirectDirection('right')
    updateTripleTouchHold()
  }

  function createTouchControl(
    id: number,
    x: number,
    y: number,
  ): ActiveTouchControl | null {
    const leftBoundary = W / 3
    const rightBoundary = (2 * W) / 3

    if (x < leftBoundary) {
      return {
        id,
        side: 'left',
        mode: 'direct',
        directDirection: getDirectDirection(y),
        lastCanvasY: y,
        canvasX: x,
        canvasY: y,
      }
    }

    if (x > rightBoundary) {
      return {
        id,
        side: 'right',
        mode: 'direct',
        directDirection: getDirectDirection(y),
        lastCanvasY: y,
        canvasX: x,
        canvasY: y,
      }
    }

    const side: TouchSide = x < W / 2 ? 'left' : 'right'
    return {
      id,
      side,
      mode: 'relative',
      directDirection: 0,
      lastCanvasY: y,
      canvasX: x,
      canvasY: y,
    }
  }

  function getDirectDirection(y: number): -1 | 0 | 1 {
    const upper = H / 3
    const lower = (2 * H) / 3
    if (y < upper) return -1
    if (y > lower) return 1
    return 0
  }

  function recalculateDirectDirections() {
    recalculateDirectDirection('left')
    recalculateDirectDirection('right')
  }

  function recalculateDirectDirection(side: TouchSide) {
    let direction = 0
    for (const control of activeTouches.values()) {
      if (control.side !== side || control.mode !== 'direct') continue
      direction += control.directDirection
    }
    touchControls[side].direction = Math.max(-1, Math.min(1, direction))
  }

  function updateTripleTouchHold() {
    const shouldHold = hasThreeCenterTouches()
    if (!shouldHold && tripleTouchTimeout !== null) {
      window.clearTimeout(tripleTouchTimeout)
      tripleTouchTimeout = null
    }

    if (
      shouldHold &&
      tripleTouchTimeout === null &&
      !overlay.classList.contains('dev-overlay--visible')
    ) {
      tripleTouchTimeout = window.setTimeout(() => {
        tripleTouchTimeout = null
        showOverlay(overlay)
        syncOverlayLayout()
      }, 3000)
    }
  }

  function hasThreeCenterTouches() {
    const leftBoundary = W / 3
    const rightBoundary = (2 * W) / 3
    let count = 0
    for (const control of activeTouches.values()) {
      if (control.canvasX >= leftBoundary && control.canvasX <= rightBoundary) {
        count += 1
      }
      if (count >= 3) return true
    }
    return false
  }

  const state: PongState = {
    leftScore: 0,
    rightScore: 0,
    ballX: W * 0.5,
    ballY: H * 0.5,
    ballRadius: BALL_R,
    vx: 0,
    vy: 0,
    balls: [],
    leftY: H * 0.5 - initialLeftHeight / 2,
    rightY: H * 0.5 - initialRightHeight / 2,
    leftInnerY: H * 0.5 - initialLeftHeight / 2,
    rightInnerY: H * 0.5 - initialRightHeight / 2,
    leftPaddleHeight: initialLeftHeight,
    rightPaddleHeight: initialRightHeight,
    leftInnerPaddleHeight: initialLeftHeight,
    rightInnerPaddleHeight: initialRightHeight,
    paused: false,
    winner: null,
    currentPips: 0,
    totalPips: 0,
    totalBites: 0,
    completedBitesSinceLastPoint: 0,
  }

  let leftPaddleHeight = state.leftPaddleHeight
  let rightPaddleHeight = state.rightPaddleHeight
  let previousChillyEnabled = config.modifiers.paddle.chilly.enabled
  let previousApparitionEnabled = config.modifiers.paddle.apparition.enabled
  let previousOutOfBodyEnabled = config.modifiers.paddle.outOfBody.enabled
  let previousBendyEnabled = config.modifiers.paddle.bendy.enabled
  let previousLeftSizeMultiplier = getPaddleSizeMultiplier('left')
  let previousRightSizeMultiplier = getPaddleSizeMultiplier('right')
  let previousDoublesEnabled = config.doubles.enabled
  let previousCharlotteEnabled = config.modifiers.paddle.charlotte.enabled

  const balls: BallState[] = state.balls
  const MAX_ACTIVE_BALLS = 12
  const hadronStatus: Record<'left' | 'right', boolean> = { left: true, right: true }
  const osteoStates: Record<'left' | 'right', Record<PaddleLane, OsteoSegmentState[]>> = {
    left: { outer: [], inner: [], missile: [] },
    right: { outer: [], inner: [], missile: [] },
  }
  const charlotteStates: Record<'left' | 'right', Record<PaddleLane, CharlotteWebState>> = {
    left: {
      outer: createCharlotteState(),
      inner: createCharlotteState(),
      missile: createCharlotteState(),
    },
    right: {
      outer: createCharlotteState(),
      inner: createCharlotteState(),
      missile: createCharlotteState(),
    },
  }
  let previousOsteoSignature: string | null = null
  const missilePaddles: ActiveMissilePaddle[] = []
  const missileCooldowns: Record<'left' | 'right', number> = { left: 0, right: 0 }
  type InchwormPhase = 'idle' | 'contracting' | 'contracted' | 'extending'

  type OutOfBodyLaneKey = 'outer' | 'inner'
  const paddleApparitionStates: Record<'left' | 'right', ApparitionState> = {
    left: createApparitionState(),
    right: createApparitionState(),
  }
  const outOfBodyTrails: Record<'left' | 'right', Record<OutOfBodyLaneKey, OutOfBodyTrailState>> = {
    left: {
      outer: createOutOfBodyTrailState(),
      inner: createOutOfBodyTrailState(),
    },
    right: {
      outer: createOutOfBodyTrailState(),
      inner: createOutOfBodyTrailState(),
    },
  }
  const paddleMotion: Record<'left' | 'right', PaddleMotionMap> = {
    left: {
      outer: { previousY: state.leftY, velocity: 0 },
      inner: { previousY: state.leftInnerY, velocity: 0 },
    },
    right: {
      outer: { previousY: state.rightY, velocity: 0 },
      inner: { previousY: state.rightInnerY, velocity: 0 },
    },
  }
  const bendyStates: Record<'left' | 'right', BendyState> = {
    left: createInitialBendyState(),
    right: createInitialBendyState(),
  }
  interface PaddleDynamicsState {
    velocity: number
    frisbeeFlying: boolean
    frisbeeDirection: -1 | 0 | 1
    angryStretch: number
    inchwormPhase: InchwormPhase
    inchwormDirection: -1 | 0 | 1
    inchwormBaseHeight: number
    inchwormTargetHeight: number
    inchwormPendingDirection: -1 | 0 | 1
    inchwormWasInput: boolean
    slinkyTimer: number
    slinkyDirection: -1 | 0 | 1
  }
  const paddleDynamics: Record<'left' | 'right', PaddleDynamicsState> = {
    left: {
      velocity: 0,
      frisbeeFlying: false,
      frisbeeDirection: 0,
      angryStretch: 0,
      inchwormPhase: 'idle',
      inchwormDirection: 0,
      inchwormBaseHeight: leftPaddleHeight,
      inchwormTargetHeight: leftPaddleHeight,
      inchwormPendingDirection: 0,
      inchwormWasInput: false,
      slinkyTimer: 0,
      slinkyDirection: 0,
    },
    right: {
      velocity: 0,
      frisbeeFlying: false,
      frisbeeDirection: 0,
      angryStretch: 0,
      inchwormPhase: 'idle',
      inchwormDirection: 0,
      inchwormBaseHeight: rightPaddleHeight,
      inchwormTargetHeight: rightPaddleHeight,
      inchwormPendingDirection: 0,
      inchwormWasInput: false,
      slinkyTimer: 0,
      slinkyDirection: 0,
    },
  }
  let previousMissileEnabled = config.modifiers.paddle.missileCommander.enabled
  let previousFrisbeeEnabled = config.modifiers.paddle.frisbee.enabled
  let previousDundeeEnabled = config.modifiers.paddle.dundee.enabled
  let previousAngryEnabled = config.modifiers.paddle.angry.enabled
  let previousInchwormEnabled = config.modifiers.paddle.inchworm.enabled
  let previousSlinkyEnabled = config.modifiers.paddle.slinky.enabled

  const arenaDimensions: ArenaDimensions = { width: W, height: H }
  const divotsState: DivotsState = createDivotsState()
  const irelandState: IrelandState = createIrelandState()
  const blackMoleState: BlackMoleState = createBlackMoleState(arenaDimensions)
  const gopherState: GopherState = createGopherState(arenaDimensions)
  const ceresState: CeresState = createCeresState(arenaDimensions)
  const fogOfWarState: FogOfWarState = createFogOfWarState()
  const wonderlandState: WonderlandState = createWonderlandState()
  const drinkMeState: DrinkMeState = createDrinkMeState()
  const teaPartyState: TeaPartyState = createTeaPartyState()
  const secondChancesState: SecondChancesState = createSecondChancesState()
  const spaceInvadersState: SpaceInvadersState = createSpaceInvadersState()
  const minesweeperState: MinesweeperState = createMinesweeperState()
  const jupiterState: JupiterState = createJupiterState(arenaDimensions)
  const wormholeState: WormholeState = createWormholeState()
  const vortexState: VortexState = createVortexState()
  let activeGravityWells: ActiveGravityWell[] = []
  let announcement: Announcement | null = null
  let lastEnabledArenaModifiers = new Set<GravityWellKey>(
    getEnabledArenaModifierKeys(config.modifiers.arena),
  )
  let activeModKey: GravityWellKey | null = null
  const kiteState: KiteState = createKiteState()
  const bumShuffleState: BumShuffleState = createBumShuffleState()
  const pollokState: PollokState = createPollokState()
  let completedBitesSinceLastPoint = 0
  maintainSecondChancesState(secondChancesState, getSecondChancesModifier())
  maintainSpaceInvadersState(
    spaceInvadersState,
    getSpaceInvadersModifier(),
    arenaDimensions,
    areSidesSwapped(),
  )
  maintainMinesweeperState(
    minesweeperState,
    getMinesweeperModifier(),
    arenaDimensions,
  )
  initializeActiveModState()
  resetBallSize()
  initializePaddleHeights(true)
  resetApparitionStateMap(paddleApparitionStates, config.modifiers.paddle.apparition, {
    randomize: true,
  })
  resetOutOfBodyTrails(true)
  resetBendyState(config.modifiers.paddle.bendy.enabled)
  syncPaddleMotionState()
  resetBall(Math.random() < 0.5)

  function createBall(toLeft: boolean): BallState {
    const direction = toLeft ? -1 : 1
    const vx = config.baseBallSpeed * direction
    const vy = (Math.random() * 2 - 1) * config.baseBallSpeed * 0.6
    return {
      x: W * 0.5,
      y: H * 0.5,
      vx,
      vy,
      radius: BALL_R,
      travelDistance: 0,
      isReal: true,
      opacity: 1,
      lastPaddleHit: null,
      portalCooldown: 0,
    }
  }

  function createRussianRouletteBall(
    angleOffset: number,
    direction: -1 | 1,
  ): BallState {
    const baseSpeed = config.baseBallSpeed
    const baseAngle = direction === 1 ? 0 : Math.PI
    const angle = baseAngle + angleOffset
    return {
      x: W * 0.5,
      y: H * 0.5,
      vx: Math.cos(angle) * baseSpeed,
      vy: Math.sin(angle) * baseSpeed,
      radius: BALL_R,
      travelDistance: 0,
      isReal: false,
      opacity: 1,
      lastPaddleHit: null,
      portalCooldown: 0,
    }
  }

  function spawnRussianRouletteBalls(toLeft: boolean) {
    const angleOffsets = [-0.32, 0, 0.32] as const
    const leftBalls = angleOffsets.map(offset => createRussianRouletteBall(offset, -1))
    const rightBalls = angleOffsets.map(offset => createRussianRouletteBall(offset, 1))

    const direction = toLeft ? -1 : 1
    const candidates = direction === -1 ? leftBalls : rightBalls
    const realIndex = Math.floor(Math.random() * candidates.length)
    const realBall = candidates[realIndex]
    realBall.isReal = true
    realBall.opacity = 1

    balls.push(realBall)

    for (const ball of [...leftBalls, ...rightBalls]) {
      if (ball === realBall) continue
      ball.isReal = false
      ball.opacity = 1
      balls.push(ball)
    }
  }

  function syncPrimaryBallState() {
    const primary = balls[0]
    if (primary) {
      state.ballX = primary.x
      state.ballY = primary.y
      state.vx = primary.vx
      state.vy = primary.vy
      state.ballRadius = primary.radius
      return
    }

    state.ballX = W * 0.5
    state.ballY = H * 0.5
    state.vx = 0
    state.vy = 0
    state.ballRadius = BALL_R
  }

  function syncStateIntoPrimaryBall() {
    const primary = balls[0]
    if (!primary) return

    if (Math.abs(state.ballX - primary.x) > 1e-3 || Math.abs(state.ballY - primary.y) > 1e-3) {
      primary.x = state.ballX
      primary.y = state.ballY
    }

    if (Math.abs(state.vx - primary.vx) > 1e-3 || Math.abs(state.vy - primary.vy) > 1e-3) {
      primary.vx = state.vx
      primary.vy = state.vy
    }

    if (Math.abs(state.ballRadius - primary.radius) > 1e-3) {
      primary.radius = Math.max(1, state.ballRadius)
    }
  }

  function resetBall(toLeft: boolean) {
    balls.length = 0
    resetSecondChancesShields(secondChancesState, getSecondChancesModifier())
    resetSpaceInvadersState(
      spaceInvadersState,
      getSpaceInvadersModifier(),
      arenaDimensions,
      areSidesSwapped(),
    )
    resetMinesweeperState(minesweeperState, getMinesweeperModifier(), arenaDimensions)
    resetSpaceInvadersState(spaceInvadersState, getSpaceInvadersModifier(), arenaDimensions)
    if (config.modifiers.arena.wormhole.enabled) {
      resetWormholeState(wormholeState, config.modifiers.arena.wormhole, arenaDimensions)
    }
    if (config.modifiers.arena.vortex.enabled) {
      resetVortexState(vortexState, config.modifiers.arena.vortex, arenaDimensions)
    }
    pollokState.lastReturner = null
    clearKiteTrail(kiteState)
    pendingServeToLeft = toLeft
    preServeDelayRemaining = modRevealDelayPending ? modRevealDelayDuration : 0
    serveCountdownRemaining = serveCountdownDuration
    modRevealDelayPending = false
    state.ballX = W * 0.5
    state.ballY = H * 0.5
    state.vx = 0
    state.vy = 0
    state.ballRadius = BALL_R
    syncPrimaryBallState()

    if (preServeDelayRemaining <= 0 && serveCountdownRemaining <= 0) {
      launchPendingServe()
    }
  }

  function launchPendingServe() {
    if (pendingServeToLeft === null) return

    const toLeft = pendingServeToLeft
    pendingServeToLeft = null
    preServeDelayRemaining = 0
    serveCountdownRemaining = 0

    if (config.modifiers.arena.russianRoulette.enabled) {
      spawnRussianRouletteBalls(toLeft)
    } else {
      balls.push(createBall(toLeft))
    }

    resetBallSize()
  }

  function updateServeTimers(dt: number) {
    if (pendingServeToLeft === null) return

    if (preServeDelayRemaining > 0) {
      preServeDelayRemaining = Math.max(0, preServeDelayRemaining - dt)
      if (preServeDelayRemaining > 0) {
        return
      }
    }

    if (serveCountdownRemaining > 0) {
      serveCountdownRemaining = Math.max(0, serveCountdownRemaining - dt)
      if (serveCountdownRemaining > 0) {
        return
      }
    }

    launchPendingServe()
  }

  function reset() {
    state.leftScore = 0
    state.rightScore = 0
    state.winner = null
    state.currentPips = 0
    state.totalPips = 0
    state.totalBites = 0
    state.completedBitesSinceLastPoint = 0
    completedBitesSinceLastPoint = 0
    leftAIEnabled = true
    rightAIEnabled = true
    resetBlackMoleState(blackMoleState, arenaDimensions)
    resetGopherState(gopherState, arenaDimensions)
    resetCeresState(ceresState, arenaDimensions)
    clearDivots(divotsState)
    clearIrelandWells(irelandState)
    resetFogOfWarState(fogOfWarState)
    resetWonderlandState(wonderlandState)
    clearDrinkMeState(drinkMeState)
    clearTeaPartyState(teaPartyState)
    clearSecondChancesState(secondChancesState)
    clearSpaceInvadersState(spaceInvadersState)
    clearMinesweeperState(minesweeperState)
    resetJupiterState(jupiterState, arenaDimensions)
    clearWormholeState(wormholeState)
    clearVortexState(vortexState)
    activeGravityWells = []
    announcement = null
    lastEnabledArenaModifiers = new Set<GravityWellKey>(
      getEnabledArenaModifierKeys(config.modifiers.arena),
    )
    clearKiteTrail(kiteState)
    clearBumShuffleTrail(bumShuffleState)
    clearPollokTrail(pollokState)
    rearmHadron()
    syncOsteoState(true)
    initializePaddleHeights(true)
    resetApparitionStateMap(paddleApparitionStates, config.modifiers.paddle.apparition, {
      randomize: true,
    })
    resetCharlotteStates()
    resetOutOfBodyTrails(true)
    resetBendyState(config.modifiers.paddle.bendy.enabled)
    syncPaddleMotionState()
    maintainSecondChancesState(secondChancesState, getSecondChancesModifier())
    maintainSpaceInvadersState(
      spaceInvadersState,
      getSpaceInvadersModifier(),
      arenaDimensions,
      areSidesSwapped(),
    )
    maintainMinesweeperState(
      minesweeperState,
      getMinesweeperModifier(),
      arenaDimensions,
    )
    modRevealDelayPending = true
    resetBall(Math.random() < 0.5)
  }

  if (typeof window !== 'undefined') {
    window.addEventListener('keypress', (e) => {
      if (e.key.toLowerCase() === 'r') reset()
    })
  }

  function syncOverlayLayout() {
    if (!container) return
    const docked = overlay.classList.contains('dev-overlay--docked')
    const visible = overlay.classList.contains('dev-overlay--visible')
    const isDockedAndVisible = docked && visible
    container.classList.toggle('dev-overlay-container--docked', isDockedAndVisible)
    container.dispatchEvent(
      new CustomEvent('pong:layout-changed', {
        bubbles: true,
        composed: true,
        detail: { docked: isDockedAndVisible },
      }),
    )
  }

  let last = performance.now()

  function loop(now: number) {
    const dt = Math.min(1 / 30, (now - last) / 1000)
    last = now
    tick(dt)
    draw()
    requestAnimationFrame(loop)
  }

  if (autoStart && typeof requestAnimationFrame === 'function') {
    requestAnimationFrame(loop)
  }

  function tick(dt: number) {
    updateAnnouncement(dt)
    checkModifierAnnouncements()
    updatePaddleModifierState()

    const gamepadInput = getGamepadInput()
    const doublesEnabled = Boolean(config.doubles.enabled)

    if (doublesEnabled !== previousDoublesEnabled) {
      syncDoublesState(doublesEnabled)
      previousDoublesEnabled = doublesEnabled
    }

    if (state.winner) {
      if (isRestartInputActive(gamepadInput)) {
        reset()
      }
      return
    }

    syncStateIntoPrimaryBall()

    updateBlackMoleState(
      blackMoleState,
      config.modifiers.arena.blackMole,
      dt,
      arenaDimensions,
    )
    updateGopherState(
      gopherState,
      config.modifiers.arena.gopher,
      dt,
      arenaDimensions,
    )
    updateJupiterState(
      jupiterState,
      config.modifiers.arena.jupiter,
      dt,
      arenaDimensions,
    )
    updateJupiterState(
      jupiterState,
      config.modifiers.arena.jupiter,
      dt,
      arenaDimensions,
    )
    maintainDivotsState(divotsState, config.modifiers.arena.divots)
    maintainDrinkMeState(drinkMeState, config.modifiers.arena.drinkMe, arenaDimensions)
    maintainTeaPartyState(teaPartyState, config.modifiers.arena.teaParty, arenaDimensions)
    ensureIrelandWells(irelandState, config.modifiers.arena.ireland, arenaDimensions)
    updateFogOfWarState(fogOfWarState, config.modifiers.arena.fogOfWar, dt, arenaDimensions)
    updateWonderlandState(
      wonderlandState,
      config.modifiers.arena.wonderland,
      dt,
      arenaDimensions,
    )
    maintainSecondChancesState(secondChancesState, getSecondChancesModifier())
    maintainSpaceInvadersState(
      spaceInvadersState,
      getSpaceInvadersModifier(),
      arenaDimensions,
      areSidesSwapped(),
    )
    maintainMinesweeperState(
      minesweeperState,
      getMinesweeperModifier(),
      arenaDimensions,
    )
    maintainWormholeState(wormholeState, config.modifiers.arena.wormhole, arenaDimensions)
    maintainVortexState(vortexState, config.modifiers.arena.vortex, arenaDimensions)
    updateVortexState(vortexState, config.modifiers.arena.vortex, dt)

    const leftGamepadActive =
      gamepadInput.leftAxis !== 0 || gamepadInput.leftUp || gamepadInput.leftDown
    const rightGamepadActive =
      gamepadInput.rightAxis !== 0 || gamepadInput.rightUp || gamepadInput.rightDown

    if (doublesEnabled) {
      if (leftGamepadActive || rightGamepadActive) leftAIEnabled = false
    } else {
      if (leftGamepadActive) leftAIEnabled = false
      if (rightGamepadActive) rightAIEnabled = false
    }

    // Controls
    const leftPaddleSpeed = config.paddleSpeed * getPaddleSpeedMultiplier('left')
    const rightPaddleSpeed = config.paddleSpeed * getPaddleSpeedMultiplier('right')

    if (leftAIEnabled) {
      const target = state.ballY - leftPaddleHeight / 2
      const maxStep = leftPaddleSpeed * dt
      const delta = clamp(target - state.leftY, -maxStep, maxStep)
      state.leftY += delta
      if (doublesEnabled) {
        const innerDelta = clamp(target - state.leftInnerY, -maxStep, maxStep)
        state.leftInnerY += innerDelta
      } else {
        state.leftInnerY = state.leftY
      }
    } else {
      const control = getPaddleControlState('left', doublesEnabled, gamepadInput)
      handleManualPaddle('left', dt, leftPaddleSpeed, control)

      if (doublesEnabled) {
        if (config.modifiers.paddle.missileCommander.enabled) {
          const target = clamp(
            H * 0.5 - state.leftInnerPaddleHeight / 2,
            0,
            H - state.leftInnerPaddleHeight,
          )
          state.leftInnerY = target
        } else {
          let innerGamepad = 0
          if (gamepadInput.rightAxis)
            innerGamepad += gamepadInput.rightAxis * config.paddleSpeed * dt
          if (gamepadInput.rightUp) innerGamepad -= config.paddleSpeed * dt
          if (gamepadInput.rightDown) innerGamepad += config.paddleSpeed * dt
          const innerDirection = clamp(innerGamepad, -1, 1)
          state.leftInnerY += innerDirection * config.paddleSpeed * dt
        }
      } else {
        state.leftInnerY = state.leftY
      }
    }

    if (rightAIEnabled) {
      const target = state.ballY - rightPaddleHeight / 2
      const maxStep = rightPaddleSpeed * dt
      const delta = clamp(target - state.rightY, -maxStep, maxStep)
      state.rightY += delta
      if (doublesEnabled) {
        const innerDelta = clamp(target - state.rightInnerY, -maxStep, maxStep)
        state.rightInnerY += innerDelta
      } else {
        state.rightInnerY = state.rightY
      }
    } else {
      const control = getPaddleControlState('right', doublesEnabled, gamepadInput)
      handleManualPaddle('right', dt, rightPaddleSpeed, control)

      if (doublesEnabled) {
        if (config.modifiers.paddle.missileCommander.enabled) {
          const target = clamp(
            H * 0.5 - state.rightInnerPaddleHeight / 2,
            0,
            H - state.rightInnerPaddleHeight,
          )
          state.rightInnerY = target
        } else {
          const innerKeyDirection = (keys['w'] ? -1 : 0) + (keys['s'] ? 1 : 0)
          const innerDirection = clamp(innerKeyDirection, -1, 1)
          state.rightInnerY += innerDirection * config.paddleSpeed * dt
        }
      } else {
        state.rightInnerY = state.rightY
      }
    }

    updateMissilePaddles(dt)

    state.leftY = clamp(state.leftY, 0, H - leftPaddleHeight)
    state.rightY = clamp(state.rightY, 0, H - rightPaddleHeight)
    if (doublesEnabled) {
      state.leftInnerY = clamp(state.leftInnerY, 0, H - state.leftInnerPaddleHeight)
      state.rightInnerY = clamp(state.rightInnerY, 0, H - state.rightInnerPaddleHeight)
    } else {
      state.leftInnerY = state.leftY
      state.rightInnerY = state.rightY
    }

    updateCharlotteAnchors()

    updatePaddleMotion(dt)
    updateOutOfBodyTrails(dt)
    updateApparitionStateMap(
      paddleApparitionStates,
      dt,
      config.modifiers.paddle.apparition,
    )
    updateBendyState(dt)

    updateServeTimers(dt)

    const paddles = getPhysicalPaddles()
    updateCeresState(
      ceresState,
      config.modifiers.arena.ceres,
      dt,
      arenaDimensions,
    )

    // Gravity well influence
    activeGravityWells = collectActiveGravityWells()
    let pointAwarded: 'left' | 'right' | null = null
    const rouletteModifier = config.modifiers.arena.russianRoulette
    const rouletteEnabled = Boolean(rouletteModifier.enabled)
    const fadeDistance = Number.isFinite(rouletteModifier.illusionFadeDistance)
      ? Math.max(0, Number(rouletteModifier.illusionFadeDistance))
      : 0
    const fadeSpeed = Number.isFinite(rouletteModifier.illusionFadeSpeed)
      ? Math.max(0, Number(rouletteModifier.illusionFadeSpeed))
      : 0

    for (let i = 0; i < balls.length; i++) {
      const ball = balls[i]
      const prevVx = ball.vx
      ball.portalCooldown = Math.max(0, (ball.portalCooldown ?? 0) - dt)

      for (const well of activeGravityWells) {
        const dx = well.x - ball.x
        const dy = well.y - ball.y
        const distSq = dx * dx + dy * dy
        const dist = Math.sqrt(distSq) || 1
        const force = well.gravityStrength / (distSq + well.gravityFalloff)
        const ax = (dx / dist) * force
        const ay = (dy / dist) * force
        ball.vx += ax * dt
        ball.vy += ay * dt
      }

      if (prevVx !== 0) {
        const direction = Math.sign(prevVx)
        const minHorizontalSpeed = config.baseBallSpeed * config.minHorizontalRatio
        const minSpeed = minHorizontalSpeed * direction
        if (ball.vx * direction < minHorizontalSpeed) {
          ball.vx = minSpeed
        }
      }

      const speed = Math.hypot(ball.vx, ball.vy)

      ball.x += ball.vx * dt
      ball.y += ball.vy * dt

      applyBallSizeModifiers(ball, speed * dt)

      const wormholeTeleported = tryResolveWormholeTeleport(
        wormholeState,
        config.modifiers.arena.wormhole,
        arenaDimensions,
        ball,
      )
      const vortexTeleported = tryResolveVortexTeleport(
        vortexState,
        config.modifiers.arena.vortex,
        arenaDimensions,
        ball,
      )

      let radius = ball.radius
      if (wormholeTeleported || vortexTeleported) {
        radius = ball.radius
      }

      if (ball.y < radius) {
        ball.y = radius
        ball.vy *= -1
      } else if (ball.y > H - radius) {
        ball.y = H - radius
        ball.vy *= -1
      }

      if (!ball.isReal) {
        if (rouletteEnabled) {
          updateRussianRouletteOpacity(ball, paddles, fadeDistance, fadeSpeed, dt)
        } else {
          ball.opacity = 1
        }

        const removalBuffer = PADDLE_W + radius
        if (ball.x < -radius - removalBuffer || ball.x > W + radius + removalBuffer) {
          balls.splice(i, 1)
          i -= 1
        }
        continue
      }

      ball.opacity = 1

      handlePotionCollisions(ball)

      const minesweeperResult = resolveMinesweeperCollision(
        minesweeperState,
        getMinesweeperModifier(),
        ball,
      )
      if (minesweeperResult) {
        radius = ball.radius
      }

      const hitBarricade = resolveSpaceInvadersCollision(
        spaceInvadersState,
        getSpaceInvadersModifier(),
        ball,
      )
      if (hitBarricade) {
        radius = ball.radius
      }

      const shieldSide = reflectBallWithSecondChanceShields(
        secondChancesState,
        getSecondChancesModifier(),
        ball,
        arenaDimensions.width,
        areSidesSwapped(),
      )
      if (shieldSide) {
        radius = ball.radius
      }

      if (resolvePaddleCollisions(ball, paddles)) {
        radius = ball.radius
      }

      if (ball.x < -radius) {
        pointAwarded = getPointAwardedForExit('left')
        break
      }
      if (ball.x > W + radius) {
        pointAwarded = getPointAwardedForExit('right')
        break
      }
    }

    syncPrimaryBallState()

    if (pointAwarded) {
      const nextServeToLeft = pointAwarded === 'left'
      if (pointAwarded === 'right') {
        state.rightScore++
        if (state.rightScore >= WIN_SCORE) state.winner = 'right'
      } else {
        state.leftScore++
        if (state.leftScore >= WIN_SCORE) state.winner = 'left'
      }
      clearDivotWells()
      const modChanged = handlePointScored()
      if (modChanged) {
        modRevealDelayPending = true
      }
      resetBall(nextServeToLeft)
      syncPrimaryBallState()
      return
    }

    updateBallTrails()
  }

  function isRestartInputActive(gamepadInput: GamepadInput): boolean {
    const leftKeyActive = Boolean(keys['w'] || keys['s'])
    const rightKeyActive = Boolean(keys['ArrowUp'] || keys['ArrowDown'])
    const leftTouchActive =
      touchControls.left.direction !== 0 || touchControls.left.relativeDelta !== 0
    const rightTouchActive =
      touchControls.right.direction !== 0 || touchControls.right.relativeDelta !== 0
    const leftGamepadActive =
      gamepadInput.leftAxis !== 0 || gamepadInput.leftUp || gamepadInput.leftDown
    const rightGamepadActive =
      gamepadInput.rightAxis !== 0 || gamepadInput.rightUp || gamepadInput.rightDown

    return (
      leftKeyActive ||
      rightKeyActive ||
      leftTouchActive ||
      rightTouchActive ||
      leftGamepadActive ||
      rightGamepadActive
    )
  }

  function updateAnnouncement(dt: number) {
    if (!announcement) return
    announcement.elapsed += dt
    const totalDuration = announcement.holdDuration + announcement.fadeDuration
    if (announcement.elapsed >= totalDuration) {
      announcement = null
    }
  }

  function checkModifierAnnouncements() {
    const enabledEntries = getEnabledArenaModifiers(config.modifiers.arena)
    const enabledKeys = new Set<GravityWellKey>()
    const newlyEnabled: string[] = []

    for (const [key, modifier] of enabledEntries) {
      enabledKeys.add(key)
      if (!lastEnabledArenaModifiers.has(key)) {
        newlyEnabled.push(modifier.name)
      }
    }

    if (newlyEnabled.length > 0) {
      showAnnouncement(newlyEnabled)
    }

    lastEnabledArenaModifiers = enabledKeys
  }

  function getSecondChancesModifier(): SecondChancesModifier {
    return config.modifiers.arena.secondChances as SecondChancesModifier
  }

  function getSpaceInvadersModifier(): SpaceInvadersModifier {
    return config.modifiers.arena.spaceInvaders as SpaceInvadersModifier
  }

  function getMinesweeperModifier(): MinesweeperModifier {
    return config.modifiers.arena.minesweeper as MinesweeperModifier
  }

  function getSearchLightModifier(): SearchLightModifier {
    return config.modifiers.arena.searchLight as SearchLightModifier
  }

  function showAnnouncement(lines: string[]) {
    const uppercased = lines
      .flatMap(line => line.trim().split(/\s+/))
      .filter(Boolean)
      .map(segment => segment.toUpperCase())
      .slice(0, 3)
    if (uppercased.length === 0) return

    announcement = {
      lines: uppercased,
      elapsed: 0,
      holdDuration: Math.max(0, announcementHoldDuration),
      fadeDuration: Math.max(0, announcementFadeDuration),
    }
  }

  function getEnabledArenaModifiers(
    arena: ArenaModifiers,
  ): [GravityWellKey, GravityWellModifier][] {
    return getGravityWellsEntries(arena).filter(([, modifier]) => modifier.enabled)
  }

  function getEnabledArenaModifierKeys(arena: ArenaModifiers): GravityWellKey[] {
    return getEnabledArenaModifiers(arena).map(([key]) => key)
  }

  function handlePaddleReturn(side: 'left' | 'right', ball: BallState) {
    ball.lastPaddleHit = side
    registerPollokReturn(pollokState, side)
    registerPipReturn()
    resetBallSize(ball)
    spawnDivotWell()
    applyChillyShrink(side)
    handleHadronSplit(side, ball)
  }

  function applyOsteoDamage(segment: PaddleSegment) {
    const modifier = config.modifiers.paddle.osteoWhat
    if (!modifier.enabled) return
    if (segment.osteoIndex === undefined) return

    const states = osteoStates[segment.paddle.side][segment.paddle.lane]
    const state = states[segment.osteoIndex]
    if (!state || state.broken) return

    const rawThreshold = Number.isFinite(modifier.hitsBeforeBreak)
      ? Math.floor(modifier.hitsBeforeBreak)
      : 2
    const threshold = Math.max(1, rawThreshold)

    state.hits += 1
    if (state.hits >= threshold) {
      state.broken = true
    }
  }

  function handleHadronSplit(side: 'left' | 'right', ball: BallState) {
    const modifier = config.modifiers.paddle.hadron
    if (!modifier.enabled) return
    if (!hadronStatus[side]) return

    const speed = Math.hypot(ball.vx, ball.vy)
    if (speed <= 0 || balls.length >= MAX_ACTIVE_BALLS) {
      hadronStatus[side] = false
      return
    }

    const rawOffset = Number.isFinite(modifier.splitAngle) ? modifier.splitAngle : 0.35
    const angleOffset = clamp(Math.abs(rawOffset), 0, Math.PI / 2)
    if (angleOffset === 0) {
      hadronStatus[side] = false
      return
    }

    hadronStatus[side] = false

    const baseAngle = Math.atan2(ball.vy, ball.vx)
    const halfOffset = angleOffset * 0.5
    const firstAngle = baseAngle - halfOffset
    const secondAngle = baseAngle + halfOffset

    ball.vx = Math.cos(firstAngle) * speed
    ball.vy = Math.sin(firstAngle) * speed

    if (balls.length >= MAX_ACTIVE_BALLS) return

    const newBall: BallState = {
      x: ball.x + Math.cos(secondAngle) * ball.radius,
      y: ball.y + Math.sin(secondAngle) * ball.radius,
      vx: Math.cos(secondAngle) * speed,
      vy: Math.sin(secondAngle) * speed,
      radius: ball.radius,
      travelDistance: ball.travelDistance,
      isReal: true,
      opacity: 1,
      lastPaddleHit: ball.lastPaddleHit,
      portalCooldown: 0,
    }

    balls.push(newBall)
  }

  function clearDivotWells() {
    clearDivots(divotsState)
  }

  function handlePointScored(): boolean {
    let modChanged = false
    rearmHadron()
    syncOsteoState(true)
    initializePaddleHeights(true)
    if (completedBitesSinceLastPoint > 0) {
      const previousActive = activeModKey
      disableAllMods()
      let excludeKey = previousActive
      for (let i = 0; i < completedBitesSinceLastPoint; i++) {
        const nextKey = pickRandomMod(excludeKey)
        if (setActiveMod(nextKey)) {
          modChanged = true
        }
        excludeKey = activeModKey
      }
      completedBitesSinceLastPoint = 0
      state.completedBitesSinceLastPoint = 0
    }

    markIrelandNeedsRegeneration(irelandState)
    clearBumShuffleTrail(bumShuffleState)
    resetFogOfWarState(fogOfWarState)
    resetWonderlandState(wonderlandState)

    const modifier = config.modifiers.arena.ireland
    if (!modifier.enabled) {
      clearIrelandWells(irelandState)
      activeGravityWells = collectActiveGravityWells()
      return modChanged
    }

    rebuildIrelandWells(irelandState, modifier, arenaDimensions)
    activeGravityWells = collectActiveGravityWells()
    return modChanged
  }

  function initializePaddleHeights(center: boolean) {
    const { chilly } = config.modifiers.paddle
    const options: PaddleHeightOptions = { center }
    if (chilly.enabled) {
      const leftSettings = getChillySettingsForSide('left', chilly)
      const rightSettings = getChillySettingsForSide('right', chilly)
      setPaddleHeight('left', leftSettings.startingHeight, options)
      setPaddleHeight('right', rightSettings.startingHeight, options)
      previousChillyEnabled = true
    } else {
      setPaddleHeight('left', getBasePaddleHeight('left'), options)
      setPaddleHeight('right', getBasePaddleHeight('right'), options)
      previousChillyEnabled = false
    }
    previousLeftSizeMultiplier = getPaddleSizeMultiplier('left')
    previousRightSizeMultiplier = getPaddleSizeMultiplier('right')
    clampPaddlePosition('left')
    clampPaddlePosition('right')
    state.leftInnerPaddleHeight = state.leftPaddleHeight
    state.rightInnerPaddleHeight = state.rightPaddleHeight
    state.leftInnerY = state.leftY
    state.rightInnerY = state.rightY
    resetMissilePaddles()
    resetPaddleDynamics()
    resetCharlotteStates()
  }

  function syncDoublesState(enabled: boolean) {
    state.leftInnerPaddleHeight = state.leftPaddleHeight
    state.rightInnerPaddleHeight = state.rightPaddleHeight
    if (enabled) {
      state.leftInnerY = clamp(state.leftInnerY, 0, H - state.leftInnerPaddleHeight)
      state.rightInnerY = clamp(state.rightInnerY, 0, H - state.rightInnerPaddleHeight)
    } else {
      state.leftInnerY = state.leftY
      state.rightInnerY = state.rightY
    }
    updateCharlotteAnchors()
  }

  function updatePaddleModifierState() {
    const modifier = config.modifiers.paddle.chilly
    const leftMultiplier = getPaddleSizeMultiplier('left')
    const rightMultiplier = getPaddleSizeMultiplier('right')
    const multiplierChanged =
      leftMultiplier !== previousLeftSizeMultiplier || rightMultiplier !== previousRightSizeMultiplier

    if (modifier.enabled) {
      const leftSettings = getChillySettingsForSide('left', modifier)
      const rightSettings = getChillySettingsForSide('right', modifier)
      if (!previousChillyEnabled || multiplierChanged) {
        setPaddleHeight('left', leftSettings.startingHeight, { preserveCenter: true })
        setPaddleHeight('right', rightSettings.startingHeight, { preserveCenter: true })
      } else {
        const clampedLeft = clamp(
          leftPaddleHeight,
          leftSettings.minimumHeight,
          leftSettings.startingHeight,
        )
        const clampedRight = clamp(
          rightPaddleHeight,
          rightSettings.minimumHeight,
          rightSettings.startingHeight,
        )
        if (clampedLeft !== leftPaddleHeight) {
          setPaddleHeight('left', clampedLeft, { preserveCenter: true })
        }
        if (clampedRight !== rightPaddleHeight) {
          setPaddleHeight('right', clampedRight, { preserveCenter: true })
        }
      }
      previousChillyEnabled = true
    } else {
      const leftBase = getBasePaddleHeight('left')
      const rightBase = getBasePaddleHeight('right')
      if (previousChillyEnabled || leftPaddleHeight !== leftBase || multiplierChanged) {
        setPaddleHeight('left', leftBase, { preserveCenter: true })
      }
      if (previousChillyEnabled || rightPaddleHeight !== rightBase || multiplierChanged) {
        setPaddleHeight('right', rightBase, { preserveCenter: true })
      }
      previousChillyEnabled = false
    }

    previousLeftSizeMultiplier = leftMultiplier
    previousRightSizeMultiplier = rightMultiplier

    const missileEnabled = config.modifiers.paddle.missileCommander.enabled
    if (missileEnabled !== previousMissileEnabled) {
      resetMissilePaddles()
      resetPaddleDynamics()
      if (missileEnabled) {
        centerPaddle('left')
        centerPaddle('right')
      }
      previousMissileEnabled = missileEnabled
    }

    const frisbeeEnabled = config.modifiers.paddle.frisbee.enabled
    if (frisbeeEnabled !== previousFrisbeeEnabled) {
      resetPaddleDynamics()
      previousFrisbeeEnabled = frisbeeEnabled
    }

    const dundeeModifier = config.modifiers.paddle.dundee
    const dundeeEnabled = dundeeModifier.enabled
    if (dundeeEnabled !== previousDundeeEnabled) {
      resetPaddleDynamics()
      if (dundeeEnabled) {
        const base = clamp(
          Number.isFinite(dundeeModifier.baseSpeed) ? dundeeModifier.baseSpeed : 0,
          -Math.abs(dundeeModifier.maxSpeed || 0),
          Math.abs(dundeeModifier.maxSpeed || 0),
        )
        paddleDynamics.left.velocity = base
        paddleDynamics.right.velocity = base
      }
      previousDundeeEnabled = dundeeEnabled
    }

    const apparitionEnabled = config.modifiers.paddle.apparition.enabled
    if (apparitionEnabled !== previousApparitionEnabled) {
      resetApparitionStateMap(paddleApparitionStates, config.modifiers.paddle.apparition, {
        randomize: apparitionEnabled,
      })
      previousApparitionEnabled = apparitionEnabled
    }

    const outOfBodyEnabled = config.modifiers.paddle.outOfBody.enabled
    if (outOfBodyEnabled !== previousOutOfBodyEnabled) {
      resetOutOfBodyTrails(true)
      previousOutOfBodyEnabled = outOfBodyEnabled
    }

    const bendyEnabled = config.modifiers.paddle.bendy.enabled
    if (bendyEnabled !== previousBendyEnabled) {
      resetBendyState(bendyEnabled)
      previousBendyEnabled = bendyEnabled
    }

    const angryEnabled = config.modifiers.paddle.angry.enabled
    if (angryEnabled !== previousAngryEnabled) {
      resetAngryState()
      previousAngryEnabled = angryEnabled
    }

    const inchwormEnabled = config.modifiers.paddle.inchworm.enabled
    if (inchwormEnabled !== previousInchwormEnabled) {
      resetInchwormState({
        restoreHeight:
          !inchwormEnabled && !config.modifiers.paddle.chilly.enabled,
      })
      previousInchwormEnabled = inchwormEnabled
    }

    const slinkyEnabled = config.modifiers.paddle.slinky.enabled
    if (slinkyEnabled !== previousSlinkyEnabled) {
      resetSlinkyState()
      previousSlinkyEnabled = slinkyEnabled
    }

    const charlotteEnabled = config.modifiers.paddle.charlotte.enabled
    if (charlotteEnabled !== previousCharlotteEnabled) {
      resetCharlotteStates()
      previousCharlotteEnabled = charlotteEnabled
    }

    clampPaddlePosition('left')
    clampPaddlePosition('right')
    state.leftPaddleHeight = leftPaddleHeight
    state.rightPaddleHeight = rightPaddleHeight
    state.leftInnerPaddleHeight = leftPaddleHeight
    state.rightInnerPaddleHeight = rightPaddleHeight
    if (config.doubles.enabled) {
      state.leftInnerY = clamp(state.leftInnerY, 0, H - state.leftInnerPaddleHeight)
      state.rightInnerY = clamp(state.rightInnerY, 0, H - state.rightInnerPaddleHeight)
    } else {
      state.leftInnerY = state.leftY
      state.rightInnerY = state.rightY
    }

    syncOsteoState()

    if (!config.modifiers.paddle.hadron.enabled) {
      rearmHadron()
    }
  }

  function resetMissilePaddles() {
    missilePaddles.length = 0
    missileCooldowns.left = 0
    missileCooldowns.right = 0
  }

  function resetPaddleDynamics() {
    paddleDynamics.left.velocity = 0
    paddleDynamics.left.frisbeeFlying = false
    paddleDynamics.left.frisbeeDirection = 0
    paddleDynamics.right.velocity = 0
    paddleDynamics.right.frisbeeFlying = false
    paddleDynamics.right.frisbeeDirection = 0
    resetAngryState()
    resetInchwormState()
    resetSlinkyState()
  }

  function resetAngryState() {
    paddleDynamics.left.angryStretch = 0
    paddleDynamics.right.angryStretch = 0
  }

  function resetInchwormState(options: { restoreHeight?: boolean } = {}) {
    const { restoreHeight = false } = options
    for (const side of ['left', 'right'] as const) {
      const dynamics = paddleDynamics[side]
      dynamics.inchwormPhase = 'idle'
      dynamics.inchwormDirection = 0
      const currentHeight = side === 'left' ? leftPaddleHeight : rightPaddleHeight
      dynamics.inchwormBaseHeight = currentHeight
      dynamics.inchwormTargetHeight = currentHeight
      dynamics.inchwormPendingDirection = 0
      dynamics.inchwormWasInput = false
    }

    if (restoreHeight) {
      setPaddleHeight('left', getBasePaddleHeight('left'), { preserveCenter: true })
      setPaddleHeight('right', getBasePaddleHeight('right'), { preserveCenter: true })
    }
  }

  function resetSlinkyState() {
    paddleDynamics.left.slinkyTimer = 0
    paddleDynamics.left.slinkyDirection = 0
    paddleDynamics.right.slinkyTimer = 0
    paddleDynamics.right.slinkyDirection = 0
  }

  function centerPaddle(side: 'left' | 'right') {
    const height = side === 'left' ? leftPaddleHeight : rightPaddleHeight
    const y = clamp(H * 0.5 - height / 2, 0, H - height)
    if (side === 'left') {
      state.leftY = y
      if (!config.doubles.enabled || config.modifiers.paddle.missileCommander.enabled) {
        state.leftInnerY = y
      }
    } else {
      state.rightY = y
      if (!config.doubles.enabled || config.modifiers.paddle.missileCommander.enabled) {
        state.rightInnerY = y
      }
    }
    syncPaddleMotionForSide(side)
  }

  function createOutOfBodyTrailState(): OutOfBodyTrailState {
    return { points: [], sampleTimer: 0 }
  }

  function createCharlotteState(): CharlotteWebState {
    return { anchor: null }
  }

  function getLaneSnapshot(side: 'left' | 'right', lane: OutOfBodyLaneKey) {
    if (side === 'left') {
      if (lane === 'outer') {
        return { y: state.leftY, height: leftPaddleHeight }
      }
      return { y: state.leftInnerY, height: state.leftInnerPaddleHeight }
    }
    if (lane === 'outer') {
      return { y: state.rightY, height: rightPaddleHeight }
    }
    return { y: state.rightInnerY, height: state.rightInnerPaddleHeight }
  }

  function resetOutOfBodyTrails(populate = false) {
    for (const side of ['left', 'right'] as const) {
      for (const lane of ['outer', 'inner'] as const) {
        const trail = outOfBodyTrails[side][lane]
        trail.points = []
        trail.sampleTimer = 0
        if (populate) {
          const snapshot = getLaneSnapshot(side, lane)
          const height = Math.max(0, Math.min(snapshot.height, H))
          const y = clamp(snapshot.y, 0, H - height)
          trail.points.push({ y, height })
        }
      }
    }
  }

  function updateOutOfBodyTrails(dt: number) {
    const modifier = config.modifiers.paddle.outOfBody
    const rawLength = Number.isFinite(modifier.trailLength)
      ? Math.floor(modifier.trailLength)
      : 6
    const maxPoints = Math.max(2, rawLength)
    const intervalRaw = Number.isFinite(modifier.sampleInterval)
      ? modifier.sampleInterval
      : 0.05
    const interval = Math.max(intervalRaw, 1 / 240)

    for (const side of ['left', 'right'] as const) {
      for (const lane of ['outer', 'inner'] as const) {
        const trail = outOfBodyTrails[side][lane]
        const snapshot = getLaneSnapshot(side, lane)
        const height = Math.max(0, Math.min(snapshot.height, H))
        const y = clamp(snapshot.y, 0, H - height)
        const currentPoint = { y, height }

        if (trail.points.length === 0) {
          trail.points.push({ ...currentPoint })
        } else {
          trail.points[0] = { ...currentPoint }
        }

        if (!modifier.enabled) {
          trail.sampleTimer = 0
          if (trail.points.length > 1) {
            trail.points.length = 1
          }
          continue
        }

        trail.sampleTimer += dt
        while (trail.sampleTimer >= interval) {
          trail.sampleTimer -= interval
          trail.points.splice(1, 0, { ...currentPoint })
        }

        if (trail.points.length > maxPoints) {
          trail.points.length = maxPoints
        }
      }
    }
  }

  function getOutOfBodyTrailForPaddle(paddle: PhysicalPaddle) {
    if (paddle.lane === 'missile') return null
    const lane: OutOfBodyLaneKey = paddle.lane === 'inner' ? 'inner' : 'outer'
    return outOfBodyTrails[paddle.side][lane]
  }

  function getOutOfBodyCollisionRect(
    side: 'left' | 'right',
    lane: OutOfBodyLaneKey,
  ): OutOfBodyTrailPoint | null {
    const trail = outOfBodyTrails[side][lane]
    if (!trail || trail.points.length === 0) return null
    const useTail = config.modifiers.paddle.outOfBody.enabled && trail.points.length > 1
    const index = useTail ? trail.points.length - 1 : 0
    const point = trail.points[index]
    const height = Math.max(0, Math.min(point.height, H))
    const y = clamp(point.y, 0, H - height)
    return { y, height }
  }

  function getPaddleOpacity(paddle: PhysicalPaddle) {
    let opacity = getApparitionOpacity(
      paddleApparitionStates,
      paddle.side,
      config.modifiers.paddle.apparition,
    )
    if (config.modifiers.paddle.outOfBody.enabled && paddle.lane !== 'missile') {
      const modifier = config.modifiers.paddle.outOfBody
      const base = Number.isFinite(modifier.paddleOpacity) ? modifier.paddleOpacity : 0.2
      opacity *= clamp01(base)
    }
    return clamp01(opacity)
  }

  function drawOutOfBodyTrail(
    paddle: PhysicalPaddle,
    baseHex: string,
    crackedColor: string,
    tailOpacity: number,
  ) {
    const modifier = config.modifiers.paddle.outOfBody
    if (!modifier.enabled) return
    const trail = getOutOfBodyTrailForPaddle(paddle)
    if (!trail) return
    if (trail.points.length <= 1) return

    const fadeStrength = clamp01(
      Number.isFinite(modifier.trailFade) ? modifier.trailFade : 0.7,
    )
    const baseOpacity = clamp01(tailOpacity)
    const edgeColor = paddle.side === 'left' ? LEFT_PADDLE_EDGE_COLOR : RIGHT_PADDLE_EDGE_COLOR

    for (let i = trail.points.length - 1; i >= 0; i--) {
      const point = trail.points[i]
      const fadeIndex = trail.points.length - 1 - i
      const alpha = clamp01(baseOpacity * Math.pow(fadeStrength, fadeIndex))
      if (alpha <= 0.001) continue

      const ghostPaddle: PhysicalPaddle = {
        side: paddle.side,
        physicalSide: paddle.physicalSide,
        lane: paddle.lane,
        x: paddle.x,
        y: point.y,
        height: point.height,
      }
      const segments = buildPaddleSegments(ghostPaddle)

      ctx.save()
      ctx.globalAlpha = alpha
      for (const segment of segments) {
        if (segment.height <= 0 || segment.broken) continue
        const fillColor = segment.cracked ? crackedColor : baseHex
        const offset = getBendyOffset(segment.paddle, segment)
        const rectX = segment.x + offset
        ctx.fillStyle = fillColor
        ctx.fillRect(rectX, segment.y, segment.width, segment.height)
        ctx.fillStyle = edgeColor
        if (segment.paddle.physicalSide === 'left') {
          ctx.fillRect(rectX, segment.y, PADDLE_EDGE_WIDTH, segment.height)
        } else {
          ctx.fillRect(
            rectX + segment.width - PADDLE_EDGE_WIDTH,
            segment.y,
            PADDLE_EDGE_WIDTH,
            segment.height,
          )
        }
      }
      ctx.restore()
    }
  }

  function drawCharlottePaddleBase(paddle: PhysicalPaddle, opacity: number) {
    if (opacity <= 0) return
    ctx.save()
    ctx.globalAlpha = opacity
    ctx.fillStyle = CHARLOTTE_PADDLE_COLOR
    ctx.fillRect(paddle.x, paddle.y, PADDLE_W, paddle.height)
    ctx.fillStyle = CHARLOTTE_EDGE_COLOR
    if (paddle.physicalSide === 'left') {
      ctx.fillRect(paddle.x, paddle.y, PADDLE_EDGE_WIDTH, paddle.height)
    } else {
      ctx.fillRect(
        paddle.x + PADDLE_W - PADDLE_EDGE_WIDTH,
        paddle.y,
        PADDLE_EDGE_WIDTH,
        paddle.height,
      )
    }
    ctx.restore()
  }

  function updatePaddleMotion(dt: number) {
    const safeDt = Math.max(dt, 1e-6)
    for (const side of ['left', 'right'] as const) {
      const motion = paddleMotion[side]
      const outerY = side === 'left' ? state.leftY : state.rightY
      const innerY = side === 'left' ? state.leftInnerY : state.rightInnerY
      motion.outer.velocity = (outerY - motion.outer.previousY) / safeDt
      motion.inner.velocity = (innerY - motion.inner.previousY) / safeDt
      motion.outer.previousY = outerY
      motion.inner.previousY = innerY
    }
  }

  function syncPaddleMotionForSide(side: 'left' | 'right') {
    const motion = paddleMotion[side]
    if (side === 'left') {
      motion.outer.previousY = state.leftY
      motion.inner.previousY = state.leftInnerY
    } else {
      motion.outer.previousY = state.rightY
      motion.inner.previousY = state.rightInnerY
    }
    motion.outer.velocity = 0
    motion.inner.velocity = 0
  }

  function syncPaddleMotionState() {
    syncPaddleMotionForSide('left')
    syncPaddleMotionForSide('right')
  }

  function createInitialBendyState(): BendyState {
    return { phase: Math.random() * Math.PI * 2, intensity: 0, amplitude: 0, wave: 0 }
  }

  function resetBendyState(enabled: boolean) {
    for (const side of ['left', 'right'] as const) {
      const state = bendyStates[side]
      state.intensity = 0
      state.amplitude = 0
      state.wave = 0
      state.phase = enabled ? Math.random() * Math.PI * 2 : 0
    }
  }

  function updateBendyState(dt: number) {
    const modifier = config.modifiers.paddle.bendy
    const maxOffset = Math.max(
      0,
      Number.isFinite(modifier.maxOffset) ? modifier.maxOffset : 0,
    )
    const speedForMax = Math.max(
      1,
      Number.isFinite(modifier.speedForMaxBend)
        ? modifier.speedForMaxBend
        : config.paddleSpeed,
    )
    const oscillationSpeed = Math.max(
      0,
      Number.isFinite(modifier.oscillationSpeed) ? modifier.oscillationSpeed : 5,
    )
    const smoothingRate = 8

    if (!modifier.enabled || maxOffset <= 0) {
      const decay = 1 - Math.exp(-smoothingRate * dt)
      for (const side of ['left', 'right'] as const) {
        const state = bendyStates[side]
        state.intensity += (0 - state.intensity) * decay
        state.amplitude = 0
        state.wave = 0
      }
      return
    }

    const decay = 1 - Math.exp(-smoothingRate * dt)
    const angularSpeed = oscillationSpeed * Math.PI * 2

    for (const side of ['left', 'right'] as const) {
      const state = bendyStates[side]
      const outerSpeed = Math.abs(paddleMotion[side].outer.velocity)
      const innerSpeed = Math.abs(paddleMotion[side].inner.velocity)
      const speed = Math.max(outerSpeed, innerSpeed)
      const normalized = clamp01(speed / speedForMax)
      state.intensity += (normalized - state.intensity) * decay
      state.phase += angularSpeed * dt
      if (!Number.isFinite(state.phase)) {
        state.phase = 0
      } else {
        state.phase %= Math.PI * 2
      }
      state.wave = Math.sin(state.phase)
      state.amplitude = state.intensity * maxOffset
    }
  }

  function getBendyOffset(paddle: PhysicalPaddle, segment: PaddleSegment) {
    if (!config.modifiers.paddle.bendy.enabled) return 0
    if (config.modifiers.paddle.charlotte.enabled) return 0
    if (paddle.lane === 'missile') return 0
    const state = bendyStates[paddle.side]
    const amplitude = state.amplitude
    if (amplitude <= 0) return 0
    const totalHeight = paddle.height || segment.height
    if (!totalHeight || totalHeight <= 0) return 0
    const center = segment.y + segment.height / 2
    const relative = clamp((center - paddle.y) / totalHeight, 0, 1)
    const distance = Math.min(1, Math.abs(relative - 0.5) * 2)
    if (distance <= 0) return 0
    const direction = relative < 0.5 ? -1 : 1
    let offset = state.wave * amplitude * distance * direction
    if (paddle.side === 'right') offset *= -1
    return offset
  }

  function getPaddleControlState(
    side: 'left' | 'right',
    doublesEnabled: boolean,
    gamepadInput: GamepadInput,
  ): PaddleControlState {
    let direction = 0
    let upPressed = false
    let downPressed = false
    let analogUsed = false

    if (side === 'left') {
      if (!doublesEnabled) {
        if (keys['w']) {
          direction -= 1
          upPressed = true
        }
        if (keys['s']) {
          direction += 1
          downPressed = true
        }
      }

      const axis = withDeadzone(gamepadInput.leftAxis)
      if (axis !== 0) {
        direction += axis
        analogUsed = true
      }
      if (gamepadInput.leftUp) {
        direction -= 1
        upPressed = true
      }
      if (gamepadInput.leftDown) {
        direction += 1
        downPressed = true
      }
    } else {
      if (keys['ArrowUp']) {
        direction -= 1
        upPressed = true
      }
      if (keys['ArrowDown']) {
        direction += 1
        downPressed = true
      }

      if (!doublesEnabled) {
        const axis = withDeadzone(gamepadInput.rightAxis)
        if (axis !== 0) {
          direction += axis
          analogUsed = true
        }
        if (gamepadInput.rightUp) {
          direction -= 1
          upPressed = true
        }
        if (gamepadInput.rightDown) {
          direction += 1
          downPressed = true
        }
      }
    }

    const touchDirection = touchControls[side].direction
    if (touchDirection !== 0) {
      direction += touchDirection
    }

    let relativeDelta = touchControls[side].relativeDelta
    touchControls[side].relativeDelta = 0

    const dizzyModifier = config.modifiers.paddle.dizzy
    if (dizzyModifier.enabled) {
      direction *= -1
      relativeDelta *= -1
      const originalUp = upPressed
      upPressed = downPressed
      downPressed = originalUp
    }

    direction = clamp(direction, -1, 1)

    const hasDirectionalInput =
      Math.abs(direction) > 1e-3 ||
      Math.abs(relativeDelta) > 1e-3 ||
      upPressed ||
      downPressed ||
      analogUsed ||
      touchDirection !== 0

    return {
      direction,
      relativeDelta,
      hasDirectionalInput,
      upRequested: upPressed || direction < -0.25,
      downRequested: downPressed || direction > 0.25,
    }
  }

  function applyStandardMovement(
    side: 'left' | 'right',
    dt: number,
    paddleSpeed: number,
    control: PaddleControlState,
  ) {
    const delta = control.direction * paddleSpeed * dt + control.relativeDelta
    if (side === 'left') {
      state.leftY += delta
    } else {
      state.rightY += delta
    }
  }

  function applyBungeeReturn(
    side: 'left' | 'right',
    dt: number,
    modifier = config.modifiers.paddle.bungee,
  ) {
    const speed = Number.isFinite(modifier.returnSpeed)
      ? Math.max(0, modifier.returnSpeed)
      : 0
    if (speed <= 0) return
    const height = side === 'left' ? leftPaddleHeight : rightPaddleHeight
    const target = clamp(H * 0.5 - height / 2, 0, H - height)
    const current = side === 'left' ? state.leftY : state.rightY
    const delta = target - current
    const maxStep = speed * dt
    const step = clamp(delta, -maxStep, maxStep)
    if (side === 'left') {
      state.leftY += step
    } else {
      state.rightY += step
    }
  }

  function handleMissileCommander(
    side: 'left' | 'right',
    dt: number,
    control: PaddleControlState,
    modifier = config.modifiers.paddle.missileCommander,
  ) {
    const height = side === 'left' ? leftPaddleHeight : rightPaddleHeight
    const centerY = clamp(H * 0.5 - height / 2, 0, H - height)
    if (side === 'left') {
      state.leftY = centerY
    } else {
      state.rightY = centerY
    }

    missileCooldowns[side] = Math.max(0, missileCooldowns[side] - dt)

    const launchSpeed = Number.isFinite(modifier.launchSpeed)
      ? modifier.launchSpeed
      : 0
    const cooldown = Math.max(0, Number.isFinite(modifier.cooldown) ? modifier.cooldown : 0)

    const threshold = 0.2
    if (control.direction < -threshold && missileCooldowns[side] <= 0 && launchSpeed !== 0) {
      spawnMissilePaddle(side, -Math.abs(launchSpeed), modifier)
      missileCooldowns[side] = cooldown
    } else if (control.direction > threshold && missileCooldowns[side] <= 0 && launchSpeed !== 0) {
      spawnMissilePaddle(side, Math.abs(launchSpeed), modifier)
      missileCooldowns[side] = cooldown
    }
  }

  function spawnMissilePaddle(
    side: 'left' | 'right',
    velocity: number,
    modifier = config.modifiers.paddle.missileCommander,
  ) {
    const baseHeight = side === 'left' ? leftPaddleHeight : rightPaddleHeight
    const missileHeightRaw = Number.isFinite(modifier.missileHeight)
      ? modifier.missileHeight
      : baseHeight
    const missileHeight = clamp(missileHeightRaw, 10, H)
    const paddleY = side === 'left' ? state.leftY : state.rightY
    const y = clamp(paddleY + baseHeight / 2 - missileHeight / 2, 0, H - missileHeight)
    const lifetime = Math.max(0.1, Number.isFinite(modifier.missileLifetime) ? modifier.missileLifetime : 1)
    missilePaddles.push({
      side,
      y,
      height: missileHeight,
      vy: velocity,
      age: 0,
      lifetime,
    })
  }

  function updateMissilePaddles(dt: number) {
    for (let i = missilePaddles.length - 1; i >= 0; i--) {
      const missile = missilePaddles[i]
      missile.age += dt
      missile.y += missile.vy * dt
      if (missile.y + missile.height < 0 || missile.y > H || missile.age >= missile.lifetime) {
        missilePaddles.splice(i, 1)
      } else {
        missile.y = clamp(missile.y, 0, Math.max(0, H - missile.height))
      }
    }
  }

  function handleFrisbeePaddle(
    side: 'left' | 'right',
    dt: number,
    control: PaddleControlState,
    modifier = config.modifiers.paddle.frisbee,
  ) {
    const dynamics = paddleDynamics[side]
    const height = side === 'left' ? leftPaddleHeight : rightPaddleHeight
    const throwSpeed = Math.max(0, Number.isFinite(modifier.throwSpeed) ? modifier.throwSpeed : 0)

    if (!dynamics.frisbeeFlying) {
      if (throwSpeed > 0 && control.upRequested) {
        dynamics.frisbeeFlying = true
        dynamics.frisbeeDirection = -1
        dynamics.velocity = -throwSpeed
        if (side === 'left') {
          state.leftY = H - height
        } else {
          state.rightY = H - height
        }
      } else if (throwSpeed > 0 && control.downRequested) {
        dynamics.frisbeeFlying = true
        dynamics.frisbeeDirection = 1
        dynamics.velocity = throwSpeed
        if (side === 'left') {
          state.leftY = 0
        } else {
          state.rightY = 0
        }
      } else {
        dynamics.velocity = 0
      }
      return
    }

    if (side === 'left') {
      state.leftY += dynamics.velocity * dt
      if (dynamics.velocity < 0 && state.leftY <= 0) {
        state.leftY = 0
        dynamics.velocity = 0
        dynamics.frisbeeFlying = false
        dynamics.frisbeeDirection = 0
      } else if (dynamics.velocity > 0 && state.leftY >= H - height) {
        state.leftY = H - height
        dynamics.velocity = 0
        dynamics.frisbeeFlying = false
        dynamics.frisbeeDirection = 0
      }
      return
    }

    state.rightY += dynamics.velocity * dt
    if (dynamics.velocity < 0 && state.rightY <= 0) {
      state.rightY = 0
      dynamics.velocity = 0
      dynamics.frisbeeFlying = false
      dynamics.frisbeeDirection = 0
    } else if (dynamics.velocity > 0 && state.rightY >= H - height) {
      state.rightY = H - height
      dynamics.velocity = 0
      dynamics.frisbeeFlying = false
      dynamics.frisbeeDirection = 0
    }
  }

  function handleDundeePaddle(
    side: 'left' | 'right',
    dt: number,
    control: PaddleControlState,
    modifier = config.modifiers.paddle.dundee,
  ) {
    const dynamics = paddleDynamics[side]
    const acceleration = Number.isFinite(modifier.acceleration) ? modifier.acceleration : 0
    const maxSpeed = Math.max(0, Number.isFinite(modifier.maxSpeed) ? modifier.maxSpeed : 0)
    const height = side === 'left' ? leftPaddleHeight : rightPaddleHeight

    dynamics.velocity += control.direction * acceleration * dt
    dynamics.velocity = clamp(dynamics.velocity, -maxSpeed, maxSpeed)
    if (side === 'left') {
      state.leftY += dynamics.velocity * dt
      if (state.leftY <= 0) {
        state.leftY = 0
        dynamics.velocity = Math.abs(dynamics.velocity)
      } else if (state.leftY >= H - height) {
        state.leftY = H - height
        dynamics.velocity = -Math.abs(dynamics.velocity)
      }
      return
    }

    state.rightY += dynamics.velocity * dt
    if (state.rightY <= 0) {
      state.rightY = 0
      dynamics.velocity = Math.abs(dynamics.velocity)
    } else if (state.rightY >= H - height) {
      state.rightY = H - height
      dynamics.velocity = -Math.abs(dynamics.velocity)
    }
  }

  function handleAngryPaddle(
    side: 'left' | 'right',
    dt: number,
    paddleSpeed: number,
    control: PaddleControlState,
    modifier = config.modifiers.paddle.angry,
  ) {
    const dynamics = paddleDynamics[side]
    const stretchSpeed = Math.max(
      0,
      Number.isFinite(modifier.stretchSpeed) ? modifier.stretchSpeed : 0,
    )
    const maxStretch = Math.max(
      0,
      Number.isFinite(modifier.maxStretch) ? modifier.maxStretch : 0,
    )
    const releaseSpeed = Math.max(
      0,
      Number.isFinite(modifier.releaseSpeed) ? modifier.releaseSpeed : 0,
    )
    const moveMultiplier = clamp(
      Number.isFinite(modifier.moveSpeedMultiplier) ? modifier.moveSpeedMultiplier : 1,
      0,
      1,
    )

    if (control.hasDirectionalInput) {
      const stretchDelta = clamp(
        control.direction * stretchSpeed * dt,
        -stretchSpeed * dt,
        stretchSpeed * dt,
      )
      dynamics.angryStretch = clamp(dynamics.angryStretch + stretchDelta, -maxStretch, maxStretch)
      applyStandardMovement(side, dt, paddleSpeed * moveMultiplier, control)
      clampPaddlePosition(side)
      return
    }

    if (releaseSpeed <= 0 || Math.abs(dynamics.angryStretch) < 1e-3) {
      dynamics.angryStretch = 0
      return
    }

    const releaseStep = clamp(
      dynamics.angryStretch,
      -releaseSpeed * dt,
      releaseSpeed * dt,
    )
    dynamics.angryStretch -= releaseStep
    if (side === 'left') {
      state.leftY -= releaseStep
    } else {
      state.rightY -= releaseStep
    }
    clampPaddlePosition(side)
  }

  function handleInchwormPaddle(
    side: 'left' | 'right',
    dt: number,
    paddleSpeed: number,
    control: PaddleControlState,
    modifier = config.modifiers.paddle.inchworm,
  ) {
    const dynamics = paddleDynamics[side]
    const shrinkAmount = Math.max(
      0,
      Number.isFinite(modifier.shrinkAmount) ? modifier.shrinkAmount : 0,
    )
    const minimumHeight = Math.max(
      20,
      Number.isFinite(modifier.minimumHeight) ? modifier.minimumHeight : 40,
    )
    const shrinkSpeed = Math.max(
      0,
      Number.isFinite(modifier.shrinkSpeed) ? modifier.shrinkSpeed : paddleSpeed,
    )
    const extendSpeed = Math.max(
      0,
      Number.isFinite(modifier.extendSpeed) ? modifier.extendSpeed : paddleSpeed,
    )

    let inputDirection: -1 | 0 | 1 = 0
    if (control.downRequested || control.direction > 0.35) inputDirection = 1
    else if (control.upRequested || control.direction < -0.35) inputDirection = -1

    if (dynamics.inchwormPhase === 'idle') {
      const currentHeight = side === 'left' ? leftPaddleHeight : rightPaddleHeight
      dynamics.inchwormBaseHeight = Math.max(currentHeight, minimumHeight)
      dynamics.inchwormTargetHeight = dynamics.inchwormBaseHeight
    }

    if (
      inputDirection !== 0 &&
      dynamics.inchwormDirection !== 0 &&
      inputDirection !== dynamics.inchwormDirection &&
      (dynamics.inchwormPhase === 'contracting' || dynamics.inchwormPhase === 'contracted')
    ) {
      dynamics.inchwormPhase = 'extending'
      dynamics.inchwormPendingDirection = inputDirection
    }

    if (inputDirection !== 0 && !dynamics.inchwormWasInput) {
      if (dynamics.inchwormPhase === 'idle') {
        startInchwormContraction(side, inputDirection, shrinkAmount, minimumHeight)
      } else if (dynamics.inchwormPhase === 'contracted') {
        dynamics.inchwormPendingDirection = 0
        dynamics.inchwormPhase = 'extending'
      } else if (dynamics.inchwormPhase === 'extending') {
        dynamics.inchwormPendingDirection = inputDirection
      }
    }

    if (dynamics.inchwormPhase === 'contracting') {
      const targetHeight = Math.max(minimumHeight, dynamics.inchwormTargetHeight)
      const currentHeight = side === 'left' ? leftPaddleHeight : rightPaddleHeight
      const nextHeight = Math.max(targetHeight, currentHeight - shrinkSpeed * dt)
      const anchor = dynamics.inchwormDirection === -1 ? 'top' : 'bottom'
      setAnchoredPaddleHeight(side, nextHeight, anchor)
      const updatedHeight = side === 'left' ? leftPaddleHeight : rightPaddleHeight
      if (updatedHeight <= targetHeight + 0.5) {
        setAnchoredPaddleHeight(side, targetHeight, anchor)
        dynamics.inchwormPhase = 'contracted'
      }
    } else if (dynamics.inchwormPhase === 'extending') {
      const targetHeight = Math.max(minimumHeight, dynamics.inchwormBaseHeight)
      const currentHeight = side === 'left' ? leftPaddleHeight : rightPaddleHeight
      const nextHeight = Math.min(targetHeight, currentHeight + extendSpeed * dt)
      const anchor = dynamics.inchwormDirection === -1 ? 'bottom' : 'top'
      setAnchoredPaddleHeight(side, nextHeight, anchor)
      const updatedHeight = side === 'left' ? leftPaddleHeight : rightPaddleHeight
      if (updatedHeight >= targetHeight - 0.5) {
        setAnchoredPaddleHeight(side, targetHeight, anchor)
        dynamics.inchwormPhase = 'idle'
        dynamics.inchwormDirection = 0
        dynamics.inchwormBaseHeight = targetHeight
        dynamics.inchwormTargetHeight = targetHeight
        const pending = dynamics.inchwormPendingDirection
        dynamics.inchwormPendingDirection = 0
        if (pending !== 0) {
          startInchwormContraction(side, pending, shrinkAmount, minimumHeight)
        }
      }
    }

    dynamics.inchwormWasInput = inputDirection !== 0
  }

  function startInchwormContraction(
    side: 'left' | 'right',
    direction: -1 | 1,
    shrinkAmount: number,
    minimumHeight: number,
  ) {
    const dynamics = paddleDynamics[side]
    const currentHeight = side === 'left' ? leftPaddleHeight : rightPaddleHeight
    const baseHeight = Math.max(currentHeight, minimumHeight)
    dynamics.inchwormBaseHeight = baseHeight
    const target = Math.max(minimumHeight, baseHeight - shrinkAmount)
    dynamics.inchwormTargetHeight = target
    dynamics.inchwormDirection = direction
    dynamics.inchwormPendingDirection = 0
    if (baseHeight - target < 1e-3) {
      dynamics.inchwormPhase = 'contracted'
      return
    }
    dynamics.inchwormPhase = 'contracting'
  }

  function setAnchoredPaddleHeight(
    side: 'left' | 'right',
    height: number,
    anchor: 'top' | 'bottom',
  ) {
    const clampedHeight = clamp(height, 10, H)
    const prevTop = side === 'left' ? state.leftY : state.rightY
    const prevHeight = side === 'left' ? leftPaddleHeight : rightPaddleHeight
    const prevBottom = prevTop + prevHeight

    setPaddleHeight(side, clampedHeight, { preserveCenter: false })

    if (anchor === 'top') {
      const y = clamp(prevTop, 0, H - clampedHeight)
      if (side === 'left') {
        state.leftY = y
      } else {
        state.rightY = y
      }
    } else {
      const y = clamp(prevBottom - clampedHeight, 0, H - clampedHeight)
      if (side === 'left') {
        state.leftY = y
      } else {
        state.rightY = y
      }
    }

    clampPaddlePosition(side)
  }

  function handleSlinkyPaddle(
    side: 'left' | 'right',
    dt: number,
    control: PaddleControlState,
    modifier = config.modifiers.paddle.slinky,
  ) {
    const dynamics = paddleDynamics[side]
    const flopRate = Math.max(
      0,
      Number.isFinite(modifier.flopRate) ? modifier.flopRate : 0,
    )
    if (flopRate <= 0) {
      dynamics.slinkyTimer = 0
      dynamics.slinkyDirection = 0
      return
    }

    let direction: -1 | 0 | 1 = 0
    if (control.downRequested || control.direction > 0.35) direction = 1
    else if (control.upRequested || control.direction < -0.35) direction = -1

    if (direction === 0) {
      dynamics.slinkyTimer = 0
      dynamics.slinkyDirection = 0
      return
    }

    if (direction !== dynamics.slinkyDirection) {
      dynamics.slinkyDirection = direction
      dynamics.slinkyTimer = 0
    }

    const progressScale = Math.max(Math.abs(control.direction), control.hasDirectionalInput ? 1 : 0)
    const interval = flopRate > 0 ? 1 / flopRate : Infinity
    dynamics.slinkyTimer += dt * progressScale

    while (dynamics.slinkyTimer >= interval) {
      dynamics.slinkyTimer -= interval
      performSlinkyFlop(side, direction)
    }
  }

  function performSlinkyFlop(side: 'left' | 'right', direction: -1 | 1) {
    const height = side === 'left' ? leftPaddleHeight : rightPaddleHeight
    if (height <= 0) return

    if (direction < 0) {
      const top = side === 'left' ? state.leftY : state.rightY
      const targetTop = Math.max(0, top - height)
      if (side === 'left') {
        state.leftY = targetTop
      } else {
        state.rightY = targetTop
      }
    } else {
      const top = side === 'left' ? state.leftY : state.rightY
      const targetTop = Math.min(H - height, top + height)
      if (side === 'left') {
        state.leftY = targetTop
      } else {
        state.rightY = targetTop
      }
    }

    clampPaddlePosition(side)
  }

  function handleManualPaddle(
    side: 'left' | 'right',
    dt: number,
    paddleSpeed: number,
    control: PaddleControlState,
  ) {
    const paddleModifiers = config.modifiers.paddle
    if (paddleModifiers.missileCommander.enabled) {
      handleMissileCommander(side, dt, control, paddleModifiers.missileCommander)
      return
    }

    if (paddleModifiers.frisbee.enabled) {
      handleFrisbeePaddle(side, dt, control, paddleModifiers.frisbee)
      return
    }

    if (paddleModifiers.dundee.enabled) {
      handleDundeePaddle(side, dt, control, paddleModifiers.dundee)
      return
    }

    if (paddleModifiers.slinky.enabled) {
      handleSlinkyPaddle(side, dt, control, paddleModifiers.slinky)
      return
    }

    if (paddleModifiers.inchworm.enabled) {
      handleInchwormPaddle(side, dt, paddleSpeed, control, paddleModifiers.inchworm)
      return
    }

    if (paddleModifiers.angry.enabled) {
      handleAngryPaddle(side, dt, paddleSpeed, control, paddleModifiers.angry)
      return
    }

    applyStandardMovement(side, dt, paddleSpeed, control)
    if (paddleModifiers.bungee.enabled && !control.hasDirectionalInput) {
      applyBungeeReturn(side, dt, paddleModifiers.bungee)
    }
  }

  function applyChillyShrink(side: 'left' | 'right') {
    const modifier = config.modifiers.paddle.chilly
    if (!modifier.enabled) return
    const { shrinkAmount, minimumHeight } = getChillySettingsForSide(side, modifier)
    if (shrinkAmount <= 0) return

    const currentHeight = side === 'left' ? leftPaddleHeight : rightPaddleHeight
    const nextHeight = Math.max(minimumHeight, currentHeight - shrinkAmount)
    if (nextHeight === currentHeight) return

    setPaddleHeight(side, nextHeight, { preserveCenter: true })
    clampPaddlePosition(side)
    state.leftPaddleHeight = leftPaddleHeight
    state.rightPaddleHeight = rightPaddleHeight
  }

  function rearmHadron() {
    hadronStatus.left = true
    hadronStatus.right = true
  }

  function ensureOsteoArrayLength(target: OsteoSegmentState[], length: number) {
    if (target.length > length) {
      target.length = length
      return
    }
    while (target.length < length) {
      target.push({ hits: 0, broken: false })
    }
  }

  function syncOsteoState(forceReset = false) {
    const modifier = config.modifiers.paddle.osteoWhat
    if (!modifier.enabled) {
      osteoStates.left.outer = []
      osteoStates.left.inner = []
      osteoStates.left.missile = []
      osteoStates.right.outer = []
      osteoStates.right.inner = []
      osteoStates.right.missile = []
      previousOsteoSignature = null
      return
    }

    const rawCount = Number.isFinite(modifier.segmentCount)
      ? Math.floor(modifier.segmentCount)
      : 6
    const segmentCount = Math.max(1, rawCount)
    const rawHits = Number.isFinite(modifier.hitsBeforeBreak)
      ? Math.floor(modifier.hitsBeforeBreak)
      : 2
    const hitsBeforeBreak = Math.max(1, rawHits)
    const signature = `${segmentCount}:${hitsBeforeBreak}`

    if (forceReset || signature !== previousOsteoSignature) {
      previousOsteoSignature = signature
      const createSegments = () =>
        Array.from({ length: segmentCount }, () => ({ hits: 0, broken: false }))
      osteoStates.left.outer = createSegments()
      osteoStates.left.inner = createSegments()
      osteoStates.left.missile = []
      osteoStates.right.outer = createSegments()
      osteoStates.right.inner = createSegments()
      osteoStates.right.missile = []
      return
    }

    ensureOsteoArrayLength(osteoStates.left.outer, segmentCount)
    ensureOsteoArrayLength(osteoStates.left.inner, segmentCount)
    ensureOsteoArrayLength(osteoStates.right.outer, segmentCount)
    ensureOsteoArrayLength(osteoStates.right.inner, segmentCount)
  }

  function setPaddleHeight(
    side: 'left' | 'right',
    height: number,
    options: PaddleHeightOptions = {},
  ) {
    const { center = false, preserveCenter = true } = options
    const prevHeight = side === 'left' ? leftPaddleHeight : rightPaddleHeight
    const prevInnerHeight =
      side === 'left' ? state.leftInnerPaddleHeight : state.rightInnerPaddleHeight

    if (side === 'left') {
      leftPaddleHeight = height
      state.leftPaddleHeight = height
      state.leftInnerPaddleHeight = height
    } else {
      rightPaddleHeight = height
      state.rightPaddleHeight = height
      state.rightInnerPaddleHeight = height
    }

    if (center) {
      const y = clamp(H * 0.5 - height / 2, 0, H - height)
      if (side === 'left') {
        state.leftY = y
        state.leftInnerY = y
      } else {
        state.rightY = y
        state.rightInnerY = y
      }
      return
    }

    if (preserveCenter) {
      const currentY = side === 'left' ? state.leftY : state.rightY
      const centerY = currentY + prevHeight / 2
      const newY = clamp(centerY - height / 2, 0, H - height)
      const innerCurrentY = side === 'left' ? state.leftInnerY : state.rightInnerY
      const innerCenterY = innerCurrentY + prevInnerHeight / 2
      const newInnerY = clamp(innerCenterY - height / 2, 0, H - height)
      if (side === 'left') {
        state.leftY = newY
        state.leftInnerY = newInnerY
      } else {
        state.rightY = newY
        state.rightInnerY = newInnerY
      }
      return
    }

    clampPaddlePosition(side)
  }

  function clampPaddlePosition(side: 'left' | 'right') {
    const height = side === 'left' ? leftPaddleHeight : rightPaddleHeight
    if (side === 'left') {
      state.leftY = clamp(state.leftY, 0, H - height)
      state.leftInnerY = clamp(state.leftInnerY, 0, H - state.leftInnerPaddleHeight)
    } else {
      state.rightY = clamp(state.rightY, 0, H - height)
      state.rightInnerY = clamp(
        state.rightInnerY,
        0,
        H - state.rightInnerPaddleHeight,
      )
    }
  }

  function getPaddleSpeedMultiplier(side: 'left' | 'right') {
    const value =
      side === 'left' ? config.leftPaddleSpeedMultiplier : config.rightPaddleSpeedMultiplier
    const multiplier = Number.isFinite(value) ? value : 1
    return Math.max(0, multiplier)
  }

  function getPaddleSizeMultiplier(side: 'left' | 'right') {
    const value =
      side === 'left' ? config.leftPaddleSizeMultiplier : config.rightPaddleSizeMultiplier
    let multiplier = Number.isFinite(value) ? value : 1
    const paddleModifiers = config.modifiers.paddle
    const paddleModifierEntries = [
      paddleModifiers.apparition,
      paddleModifiers.outOfBody,
      paddleModifiers.bendy,
      paddleModifiers.chilly,
      paddleModifiers.crabby,
      paddleModifiers.buckTooth,
      paddleModifiers.osteoWhat,
      paddleModifiers.brokePhysics,
      paddleModifiers.hadron,
      paddleModifiers.foosball,
      paddleModifiers.dizzy,
      paddleModifiers.bungee,
      paddleModifiers.angry,
      paddleModifiers.inchworm,
      paddleModifiers.slinky,
      paddleModifiers.missileCommander,
      paddleModifiers.frisbee,
      paddleModifiers.dundee,
      paddleModifiers.charlotte,
    ]
    for (const modifier of paddleModifierEntries) {
      if (!modifier.enabled) continue
      const value = Number.isFinite(modifier.paddleSizeMultiplier)
        ? modifier.paddleSizeMultiplier
        : 1
      multiplier *= value
    }

    if (paddleModifiers.crabby.enabled) {
      const rawAdvantage = Number.isFinite(paddleModifiers.crabby.clawAdvantage)
        ? paddleModifiers.crabby.clawAdvantage
        : 0
      const advantage = clamp(rawAdvantage, 0, 0.9)
      if (advantage > 0) {
        const largerSide: 'left' | 'right' = paddleModifiers.crabby.swapSides ? 'right' : 'left'
        if (side === largerSide) {
          multiplier *= 1 + advantage
        } else {
          multiplier *= Math.max(0.2, 1 - advantage)
        }
      }
    }

    return Math.max(0.1, multiplier)
  }

  function getBasePaddleHeight(side: 'left' | 'right') {
    return BASE_PADDLE_H * getPaddleSizeMultiplier(side)
  }

  function getChillySettings(modifier = config.modifiers.paddle.chilly) {
    const maxHeight = H
    const startingHeight = clamp(
      Number.isFinite(modifier.startingHeight) ? modifier.startingHeight : BASE_PADDLE_H,
      40,
      maxHeight,
    )
    const minimumHeight = clamp(
      Number.isFinite(modifier.minimumHeight) ? modifier.minimumHeight : BASE_PADDLE_H * 0.75,
      20,
      startingHeight,
    )
    const shrinkAmount = Math.max(
      0,
      Number.isFinite(modifier.shrinkAmount) ? modifier.shrinkAmount : 0,
    )

    return { startingHeight, minimumHeight, shrinkAmount }
  }

  function getChillySettingsForSide(
    side: 'left' | 'right',
    modifier = config.modifiers.paddle.chilly,
  ) {
    const settings = getChillySettings(modifier)
    const multiplier = getPaddleSizeMultiplier(side)
    return {
      startingHeight: settings.startingHeight * multiplier,
      minimumHeight: settings.minimumHeight * multiplier,
      shrinkAmount: settings.shrinkAmount * multiplier,
    }
  }

  function registerPipReturn() {
    state.totalPips += 1
    state.currentPips = ((state.totalPips - 1) % PIPS_PER_BITE) + 1
    state.totalBites = Math.floor(state.totalPips / PIPS_PER_BITE)

    if (state.currentPips === PIPS_PER_BITE) {
      state.currentPips = 0
      completedBitesSinceLastPoint += 1
      state.completedBitesSinceLastPoint = completedBitesSinceLastPoint
      return
    }

    state.completedBitesSinceLastPoint = completedBitesSinceLastPoint
  }

  function disableAllMods() {
    let anyDisabled = false
    for (const key of GRAVITY_WELL_KEYS) {
      const modifier = config.modifiers.arena[key]
      if (!modifier.enabled) continue

      modifier.enabled = false
      anyDisabled = true

      if (key === 'divots') clearDivots(divotsState)
      if (key === 'ireland') clearIrelandWells(irelandState)
      if (key === 'blackMole') resetBlackMoleState(blackMoleState, arenaDimensions)
      if (key === 'gopher') resetGopherState(gopherState, arenaDimensions)
      if (key === 'ceres') resetCeresState(ceresState, arenaDimensions)
      if (key === 'fogOfWar') resetFogOfWarState(fogOfWarState)
      if (key === 'wonderland') resetWonderlandState(wonderlandState)
      if (key === 'drinkMe') clearDrinkMeState(drinkMeState)
      if (key === 'teaParty') clearTeaPartyState(teaPartyState)
      if (key === 'secondChances') clearSecondChancesState(secondChancesState)
      if (key === 'spaceInvaders') clearSpaceInvadersState(spaceInvadersState)
      if (key === 'minesweeper') clearMinesweeperState(minesweeperState)
      if (key === 'jupiter') resetJupiterState(jupiterState, arenaDimensions)
      if (key === 'wormhole') clearWormholeState(wormholeState)
      if (key === 'vortex') clearVortexState(vortexState)
    }

    if (anyDisabled) {
      activeGravityWells = collectActiveGravityWells()
    }

    activeModKey = null
  }

  function collectActiveGravityWells(): ActiveGravityWell[] {
    const arena = config.modifiers.arena
    const wells: ActiveGravityWell[] = []

    for (const key of GRAVITY_WELL_KEYS) {
      switch (key) {
        case 'blackHole':
          wells.push(...getBlackHoleWells(arena.blackHole, arenaDimensions))
          break
        case 'blackMole':
          wells.push(...getBlackMoleWells(blackMoleState, arena.blackMole))
          break
        case 'gopher':
          wells.push(...getGopherWells(gopherState, arena.gopher))
          break
        case 'ceres':
          wells.push(...getCeresWells(ceresState, arena.ceres))
          break
        case 'ceres':
          wells.push(...getCeresWells(ceresState, arena.ceres))
          break
        case 'superMassive':
          wells.push(...getSuperMassiveWells(arena.superMassive, arenaDimensions))
          break
        case 'jupiter':
          wells.push(...getJupiterWells(jupiterState, arena.jupiter))
          break
        case 'whiteDwarf':
          wells.push(...getWhiteDwarfWells(arena.whiteDwarf, arenaDimensions))
          break
        case 'divots':
          wells.push(...getDivotsWells(divotsState, arena.divots))
          break
        case 'fogOfWar':
        case 'wonderland':
          break
        case 'secondChances':
          break
        case 'spaceInvaders':
          break
        case 'minesweeper':
          break
        case 'ireland':
          wells.push(...getIrelandWells(irelandState, arena.ireland, arenaDimensions))
          break
        case 'russianRoulette':
          break
        case 'drinkMe':
        case 'teaParty':
          break
        case 'madHatter':
          break
        case 'wormhole':
        case 'vortex':
          break
      }
    }

    return wells
  }

  function getBallRadius(ball?: BallState) {
    if (ball) return ball.radius
    const primary = balls[0]
    return primary ? primary.radius : BALL_R
  }

  function resetBallSize(target?: BallState) {
    if (target) {
      target.travelDistance = 0
      applyBallSizeModifiers(target, 0)
      if (balls[0] === target) {
        state.ballRadius = target.radius
      }
      return
    }

    for (const ball of balls) {
      ball.travelDistance = 0
      applyBallSizeModifiers(ball, 0)
    }
    syncPrimaryBallState()
  }

  function applyBallSizeModifiers(ball: BallState, distanceDelta: number) {
    if (Number.isFinite(distanceDelta) && distanceDelta > 0) {
      ball.travelDistance += distanceDelta
    }

    const { snowball, meteor } = config.modifiers.ball
    let radius = BALL_R

    if (snowball.enabled) {
      radius = applySnowballGrowth(snowball, ball.travelDistance, BALL_R)
    }

    if (meteor.enabled) {
      radius = applyMeteorShrink(meteor, ball.travelDistance, BALL_R)
    }

    ball.radius = radius
    if (balls[0] === ball) {
      state.ballRadius = radius
    }
  }

  function updateBallTrails() {
    const { ball } = config.modifiers
    const x = state.ballX
    const y = state.ballY
    const radius = getBallRadius()

    updateKiteTrail(kiteState, ball.kite, x, y, radius)
    updateBumShuffleTrail(bumShuffleState, ball.bumShuffle, x, y, radius)
    updatePollokTrail(
      pollokState,
      ball.pollok,
      x,
      y,
      radius,
      getPollokColor(pollokState, ball.pollok),
    )
  }

  function spawnDivotWell() {
    const modifier = config.modifiers.arena.divots
    addDivotWell(divotsState, modifier, arenaDimensions)
  }

  function handlePotionCollisions(ball: BallState) {
    const lastHit = ball.lastPaddleHit
    if (!lastHit) return

    const opponent: 'left' | 'right' = lastHit === 'left' ? 'right' : 'left'
    const drinkMeModifier = config.modifiers.arena.drinkMe
    if (drinkMeModifier.enabled) {
      const index = findPotionCollision(drinkMeState, drinkMeModifier, ball)
      if (index !== -1) {
        const shrinkAmount = getPotionShrinkAmount(drinkMeModifier)
        if (shrinkAmount > 0) {
          modifyPaddleHeight(opponent, -shrinkAmount)
        }
        respawnDrinkMeObject(drinkMeState, index, drinkMeModifier, arenaDimensions, {
          x: ball.x,
          y: ball.y,
          radius: ball.radius,
        })
      }
    }

    const teaPartyModifier = config.modifiers.arena.teaParty
    if (teaPartyModifier.enabled) {
      const index = findPotionCollision(teaPartyState, teaPartyModifier, ball)
      if (index !== -1) {
        const shrinkAmount = getPotionShrinkAmount(teaPartyModifier)
        if (shrinkAmount > 0) {
          modifyPaddleHeight(opponent, -shrinkAmount)
        }
        const growAmount = getPotionGrowAmount(teaPartyModifier)
        if (growAmount > 0) {
          modifyPaddleHeight(lastHit, growAmount)
        }
        respawnTeaPartyObject(teaPartyState, index, teaPartyModifier, arenaDimensions, {
          x: ball.x,
          y: ball.y,
          radius: ball.radius,
        })
      }
    }
  }

  function findPotionCollision(
    state: DrinkMeState | TeaPartyState,
    modifier: GravityWellModifier & { objectRadius?: number },
    ball: BallState,
  ): number {
    if (!modifier.enabled || state.objects.length === 0) return -1
    for (let i = 0; i < state.objects.length; i++) {
      const object = state.objects[i]
      const combinedRadius = object.radius + ball.radius
      const dx = ball.x - object.x
      const dy = ball.y - object.y
      if (dx * dx + dy * dy <= combinedRadius * combinedRadius) {
        return i
      }
    }
    return -1
  }

  function getPotionShrinkAmount(modifier: GravityWellModifier & { shrinkAmount?: number }) {
    const raw = Number.isFinite(modifier.shrinkAmount) ? Number(modifier.shrinkAmount) : 0
    return Math.max(0, raw)
  }

  function getPotionGrowAmount(modifier: GravityWellModifier & { growAmount?: number }) {
    const raw = Number.isFinite(modifier.growAmount) ? Number(modifier.growAmount) : 0
    return Math.max(0, raw)
  }

  function modifyPaddleHeight(side: 'left' | 'right', delta: number) {
    if (!Number.isFinite(delta) || delta === 0) return

    const currentHeight = side === 'left' ? leftPaddleHeight : rightPaddleHeight
    let minimumHeight = MIN_POTION_PADDLE_HEIGHT
    const chillyModifier = config.modifiers.paddle.chilly
    if (chillyModifier.enabled) {
      const { minimumHeight: chillyMin } = getChillySettingsForSide(side, chillyModifier)
      minimumHeight = Math.max(minimumHeight, chillyMin)
    }

    const nextHeight = clamp(currentHeight + delta, minimumHeight, H)
    if (nextHeight === currentHeight) return

    setPaddleHeight(side, nextHeight, { preserveCenter: true })
    clampPaddlePosition(side)
    updateCharlotteAnchors()
  }

  function initializeActiveModState() {
    const enabledMods = GRAVITY_WELL_KEYS.filter(key => config.modifiers.arena[key].enabled)
    if (enabledMods.length === 0) {
      setActiveMod(pickRandomMod(null))
      modRevealDelayPending = true
      return
    }

    if (enabledMods.length === 1) {
      activeModKey = enabledMods[0]
      modRevealDelayPending = true
      return
    }

    const randomIndex = Math.floor(Math.random() * enabledMods.length)
    const randomKey = enabledMods[randomIndex]
    if (!setActiveMod(randomKey)) {
      activeModKey = randomKey
    }
    modRevealDelayPending = true
  }

  function setActiveMod(nextKey: GravityWellKey): boolean {
    const previousKey = activeModKey
    const previousEnabled = config.modifiers.arena[nextKey].enabled
    if (previousKey === nextKey && previousEnabled) return false

    for (const key of GRAVITY_WELL_KEYS) {
      const modifier = config.modifiers.arena[key]
      const shouldEnable = key === nextKey
      if (modifier.enabled === shouldEnable) continue

      modifier.enabled = shouldEnable

      if (!shouldEnable) {
        if (key === 'divots') clearDivotWells()
        if (key === 'ireland') clearIrelandWells(irelandState)
        if (key === 'blackMole') resetBlackMoleState(blackMoleState, arenaDimensions)
        if (key === 'gopher') resetGopherState(gopherState, arenaDimensions)
        if (key === 'ceres') resetCeresState(ceresState, arenaDimensions)
        if (key === 'fogOfWar') resetFogOfWarState(fogOfWarState)
        if (key === 'wonderland') resetWonderlandState(wonderlandState)
        if (key === 'drinkMe') clearDrinkMeState(drinkMeState)
        if (key === 'teaParty') clearTeaPartyState(teaPartyState)
        if (key === 'secondChances') clearSecondChancesState(secondChancesState)
        if (key === 'spaceInvaders') clearSpaceInvadersState(spaceInvadersState)
        if (key === 'minesweeper') clearMinesweeperState(minesweeperState)
        if (key === 'jupiter') resetJupiterState(jupiterState, arenaDimensions)
        if (key === 'wormhole') clearWormholeState(wormholeState)
        if (key === 'vortex') clearVortexState(vortexState)
      } else {
        if (key === 'secondChances') {
          const shieldModifier = getSecondChancesModifier()
          maintainSecondChancesState(secondChancesState, shieldModifier)
          resetSecondChancesShields(secondChancesState, shieldModifier)
        }
        if (key === 'spaceInvaders') {
          const barricadeModifier = getSpaceInvadersModifier()
          const swapSides = areSidesSwapped()
          maintainSpaceInvadersState(
            spaceInvadersState,
            barricadeModifier,
            arenaDimensions,
            swapSides,
          )
          resetSpaceInvadersState(
            spaceInvadersState,
            barricadeModifier,
            arenaDimensions,
            swapSides,
          )
        }
        if (key === 'minesweeper') {
          const minesweeperModifier = getMinesweeperModifier()
          maintainMinesweeperState(minesweeperState, minesweeperModifier, arenaDimensions)
          resetMinesweeperState(minesweeperState, minesweeperModifier, arenaDimensions)
        }
        if (key === 'wormhole') {
          maintainWormholeState(wormholeState, modifier, arenaDimensions)
          resetWormholeState(wormholeState, modifier, arenaDimensions)
        }
        if (key === 'vortex') {
          maintainVortexState(vortexState, modifier, arenaDimensions)
          resetVortexState(vortexState, modifier, arenaDimensions)
        }
      }
    }

    activeModKey = nextKey

    if (nextKey === 'ireland') {
      markIrelandNeedsRegeneration(irelandState)
    }

    if (nextKey === 'fogOfWar') {
      resetFogOfWarState(fogOfWarState)
    }

    if (nextKey === 'wonderland') {
      resetWonderlandState(wonderlandState)
    }

    activeGravityWells = collectActiveGravityWells()
    return previousKey !== nextKey || !previousEnabled
  }

  function pickRandomMod(exclude: GravityWellKey | null) {
    const eligible = GRAVITY_WELL_KEYS.filter(
      key => key !== exclude && config.modifiers.arena[key].includeInRandom,
    )
    const fallback = GRAVITY_WELL_KEYS.filter(key => key !== exclude)
    const pool =
      eligible.length > 0
        ? eligible
        : fallback.length > 0
          ? fallback
          : GRAVITY_WELL_KEYS
    return pool[Math.floor(Math.random() * pool.length)]
  }

  function areSidesSwapped(): boolean {
    return Boolean(config.modifiers.arena.madHatter.enabled)
  }

  function getPhysicalSide(side: 'left' | 'right'): 'left' | 'right' {
    if (!areSidesSwapped()) return side
    return side === 'left' ? 'right' : 'left'
  }

  function getPointAwardedForExit(exitSide: 'left' | 'right'): 'left' | 'right' {
    if (!areSidesSwapped()) {
      return exitSide === 'left' ? 'right' : 'left'
    }
    return exitSide
  }

  function getMaxInnerOffset() {
    return Math.max(0, W / 2 - 40 - 2 * PADDLE_W)
  }

  function getInnerOffset() {
    const offset = Number.isFinite(config.doubles.insideOffset)
      ? config.doubles.insideOffset
      : 0
    return clamp(offset, 0, getMaxInnerOffset())
  }

  function getLeftOuterX() {
    return getOuterXFor('left')
  }

  function getRightOuterX() {
    return getOuterXFor('right')
  }

  function getLeftInnerX() {
    return getInnerXFor('left')
  }

  function getRightInnerX() {
    return getInnerXFor('right')
  }

  function getOuterXFor(side: 'left' | 'right') {
    const physical = getPhysicalSide(side)
    return physical === 'left' ? 40 : W - 40 - PADDLE_W
  }

  function getInnerXFor(side: 'left' | 'right') {
    const physical = getPhysicalSide(side)
    const offset = getInnerOffset()
    return physical === 'left' ? W / 2 - offset - PADDLE_W : W / 2 + offset
  }

  function getPhysicalPaddles(): PhysicalPaddle[] {
    const paddles: PhysicalPaddle[] = []
    const doublesEnabled = Boolean(config.doubles.enabled)
    const outOfBodyEnabled = Boolean(config.modifiers.paddle.outOfBody.enabled)

    if (doublesEnabled) {
      const leftInnerRect = outOfBodyEnabled
        ? getOutOfBodyCollisionRect('left', 'inner')
        : null
      paddles.push({
        side: 'left',
        physicalSide: getPhysicalSide('left'),
        lane: 'inner',
        x: getLeftInnerX(),
        y: leftInnerRect ? leftInnerRect.y : state.leftInnerY,
        height: leftInnerRect ? leftInnerRect.height : state.leftInnerPaddleHeight,
      })
      const leftOuterRect = outOfBodyEnabled
        ? getOutOfBodyCollisionRect('left', 'outer')
        : null
      paddles.push({
        side: 'left',
        physicalSide: getPhysicalSide('left'),
        lane: 'outer',
        x: getLeftOuterX(),
        y: leftOuterRect ? leftOuterRect.y : state.leftY,
        height: leftOuterRect ? leftOuterRect.height : state.leftPaddleHeight,
      })
      const rightInnerRect = outOfBodyEnabled
        ? getOutOfBodyCollisionRect('right', 'inner')
        : null
      paddles.push({
        side: 'right',
        physicalSide: getPhysicalSide('right'),
        lane: 'inner',
        x: getRightInnerX(),
        y: rightInnerRect ? rightInnerRect.y : state.rightInnerY,
        height: rightInnerRect ? rightInnerRect.height : state.rightInnerPaddleHeight,
      })
      const rightOuterRect = outOfBodyEnabled
        ? getOutOfBodyCollisionRect('right', 'outer')
        : null
      paddles.push({
        side: 'right',
        physicalSide: getPhysicalSide('right'),
        lane: 'outer',
        x: getRightOuterX(),
        y: rightOuterRect ? rightOuterRect.y : state.rightY,
        height: rightOuterRect ? rightOuterRect.height : state.rightPaddleHeight,
      })
    } else {
      const leftOuterRect = outOfBodyEnabled
        ? getOutOfBodyCollisionRect('left', 'outer')
        : null
      paddles.push({
        side: 'left',
        physicalSide: getPhysicalSide('left'),
        lane: 'outer',
        x: getLeftOuterX(),
        y: leftOuterRect ? leftOuterRect.y : state.leftY,
        height: leftOuterRect ? leftOuterRect.height : state.leftPaddleHeight,
      })
      const rightOuterRect = outOfBodyEnabled
        ? getOutOfBodyCollisionRect('right', 'outer')
        : null
      paddles.push({
        side: 'right',
        physicalSide: getPhysicalSide('right'),
        lane: 'outer',
        x: getRightOuterX(),
        y: rightOuterRect ? rightOuterRect.y : state.rightY,
        height: rightOuterRect ? rightOuterRect.height : state.rightPaddleHeight,
      })
    }

    for (const missile of missilePaddles) {
      paddles.push({
        side: missile.side,
        physicalSide: getPhysicalSide(missile.side),
        lane: 'missile',
        x: missile.side === 'left' ? getLeftOuterX() : getRightOuterX(),
        y: missile.y,
        height: missile.height,
      })
    }

    return paddles
  }

  function buildPaddleSegments(paddle: PhysicalPaddle): PaddleSegment[] {
    const baseSegment: PaddleSegment = {
      paddle,
      index: 0,
      x: paddle.x,
      y: paddle.y,
      width: PADDLE_W,
      height: paddle.height,
    }

    if (paddle.lane === 'missile') {
      return [baseSegment]
    }

    const charlotteModifier = config.modifiers.paddle.charlotte
    if (charlotteModifier.enabled) {
      return buildCharlotteSegments(paddle, charlotteModifier)
    }

    const osteoModifier = config.modifiers.paddle.osteoWhat
    if (osteoModifier.enabled) {
      return buildOsteoSegments(paddle, osteoModifier)
    }

    let segments: PaddleSegment[] = [baseSegment]

    const foosballModifier = config.modifiers.paddle.foosball
    if (foosballModifier.enabled) {
      const gap = Number.isFinite(foosballModifier.gapSize)
        ? Math.max(0, foosballModifier.gapSize)
        : 0
      segments = segments.flatMap(segment => splitSegmentFoosball(segment, gap))
    }

    const crabbyModifier = config.modifiers.paddle.crabby
    const buckToothModifier = config.modifiers.paddle.buckTooth
    if (crabbyModifier.enabled) {
      segments = segments.flatMap(segment => splitSegmentCrabby(paddle, segment, crabbyModifier))
    } else if (buckToothModifier.enabled) {
      const gap = Number.isFinite(buckToothModifier.gapSize)
        ? Math.max(0, buckToothModifier.gapSize)
        : 0
      segments = segments.flatMap(segment => splitSegmentWithGap(segment, gap))
    }

    return segments
  }

  function splitSegmentWithGap(segment: PaddleSegment, gap: number): PaddleSegment[] {
    const clampedGap = Math.max(0, Math.min(gap, segment.height))
    const remainingHeight = segment.height - clampedGap
    if (remainingHeight <= 4) {
      return [segment]
    }

    const topHeight = remainingHeight / 2
    const bottomHeight = remainingHeight - topHeight

    return [
      {
        ...segment,
        index: segment.index * 2,
        y: segment.y,
        height: topHeight,
      },
      {
        ...segment,
        index: segment.index * 2 + 1,
        y: segment.y + topHeight + clampedGap,
        height: bottomHeight,
      },
    ]
  }

  function splitSegmentCrabby(
    paddle: PhysicalPaddle,
    segment: PaddleSegment,
    modifier: { gapSize: number; clawRatio: number; swapSides: boolean },
  ): PaddleSegment[] {
    const clampedGap = Math.max(0, Math.min(Number(modifier.gapSize) || 0, segment.height))
    const available = segment.height - clampedGap
    if (available <= 4) {
      return [segment]
    }

    const rawRatio = Number.isFinite(modifier.clawRatio) ? modifier.clawRatio : 0.65
    let longHeight = clamp(rawRatio, 0.5, 0.9) * available
    longHeight = clamp(longHeight, available * 0.55, available - 2)
    let shortHeight = available - longHeight
    if (shortHeight < 2) {
      shortHeight = 2
      longHeight = available - shortHeight
      if (longHeight <= 2) {
        return [segment]
      }
    }

    const topIsLong = paddle.side === 'left' ? !modifier.swapSides : modifier.swapSides
    const topHeight = topIsLong ? longHeight : shortHeight
    const bottomHeight = topIsLong ? shortHeight : longHeight

    return [
      {
        ...segment,
        index: segment.index * 2,
        y: segment.y,
        height: topHeight,
      },
      {
        ...segment,
        index: segment.index * 2 + 1,
        y: segment.y + topHeight + clampedGap,
        height: bottomHeight,
      },
    ]
  }

  function splitSegmentFoosball(segment: PaddleSegment, gap: number): PaddleSegment[] {
    const clampedGap = Math.max(0, gap)
    const count = 3
    const totalGap = clampedGap * (count - 1)
    const availableHeight = Math.max(segment.height - totalGap, 0)
    if (availableHeight <= 0) {
      return [segment]
    }

    const baseHeight = availableHeight / count
    const segments: PaddleSegment[] = []
    let y = segment.y

    for (let i = 0; i < count; i++) {
      let height = baseHeight
      if (i === count - 1) {
        height = Math.max(0, segment.y + segment.height - y)
      }

      if (height <= 0) break

      segments.push({
        ...segment,
        index: segment.index * count + i,
        y,
        height,
      })

      y += height + (i < count - 1 ? clampedGap : 0)
    }

    return segments
  }

  function getCharlotteStateForPaddle(paddle: PhysicalPaddle) {
    return charlotteStates[paddle.side][paddle.lane]
  }

  function resetCharlotteStates() {
    for (const side of ['left', 'right'] as const) {
      for (const lane of ['outer', 'inner', 'missile'] as const) {
        charlotteStates[side][lane].anchor = null
      }
    }
  }

  function updateCharlotteAnchors() {
    const modifier = config.modifiers.paddle.charlotte
    if (!modifier.enabled) {
      resetCharlotteStates()
      return
    }

    updateCharlotteAnchorForLane('left', 'outer', state.leftY, leftPaddleHeight)
    updateCharlotteAnchorForLane('right', 'outer', state.rightY, rightPaddleHeight)

    const doublesEnabled = Boolean(config.doubles.enabled)
    const leftInnerHeight = doublesEnabled ? state.leftInnerPaddleHeight : leftPaddleHeight
    const rightInnerHeight = doublesEnabled ? state.rightInnerPaddleHeight : rightPaddleHeight
    const leftInnerY = doublesEnabled ? state.leftInnerY : state.leftY
    const rightInnerY = doublesEnabled ? state.rightInnerY : state.rightY

    updateCharlotteAnchorForLane('left', 'inner', leftInnerY, leftInnerHeight)
    updateCharlotteAnchorForLane('right', 'inner', rightInnerY, rightInnerHeight)
  }

  function updateCharlotteAnchorForLane(
    side: 'left' | 'right',
    lane: PaddleLane,
    y: number,
    height: number,
  ) {
    const state = charlotteStates[side][lane]
    const epsilon = 0.5
    if (height <= 0) {
      state.anchor = null
      return
    }
    if (y <= epsilon) {
      state.anchor = 'top'
    } else if (y + height >= H - epsilon) {
      state.anchor = 'bottom'
    }
  }

  function getCharlotteWebWidth(modifier = config.modifiers.paddle.charlotte) {
    const raw = Number.isFinite(modifier.webWidthMultiplier) ? modifier.webWidthMultiplier : 0.5
    const multiplier = clamp(raw, 0.1, 1)
    return Math.max(PADDLE_EDGE_WIDTH, Math.min(PADDLE_W, PADDLE_W * multiplier))
  }

  function getCharlotteMaxWebLength(
    paddle: PhysicalPaddle,
    modifier = config.modifiers.paddle.charlotte,
  ) {
    const raw = Number.isFinite(modifier.maxWebLengthMultiplier)
      ? modifier.maxWebLengthMultiplier
      : 1
    const multiplier = Math.max(0.1, raw)
    return Math.max(0, paddle.height * multiplier)
  }

  function buildCharlotteSegments(
    paddle: PhysicalPaddle,
    modifier = config.modifiers.paddle.charlotte,
  ): PaddleSegment[] {
    const state = getCharlotteStateForPaddle(paddle)
    if (!state || !state.anchor) {
      return []
    }

    const width = getCharlotteWebWidth(modifier)
    const anchor = state.anchor
    const slack =
      anchor === 'top'
        ? Math.max(0, paddle.y)
        : Math.max(0, H - (paddle.y + paddle.height))
    const maxLength = getCharlotteMaxWebLength(paddle, modifier)
    const length = Math.min(slack, maxLength)
    if (length <= MIN_CHARLOTTE_WEB_LENGTH) {
      return []
    }

    const xOffset = paddle.physicalSide === 'left' ? PADDLE_W - width : 0
    const x = paddle.x + xOffset
    const y = anchor === 'top' ? 0 : H - length

    return [
      {
        paddle,
        index: 0,
        x,
        y,
        width,
        height: length,
      },
    ]
  }

  function buildOsteoSegments(
    paddle: PhysicalPaddle,
    modifier: { segmentCount: number; gapSize: number },
  ): PaddleSegment[] {
    const rawCount = Number.isFinite(modifier.segmentCount)
      ? Math.floor(modifier.segmentCount)
      : 6
    const segmentCount = Math.max(1, rawCount)
    const gap = Number.isFinite(modifier.gapSize) ? Math.max(0, modifier.gapSize) : 0
    const states = osteoStates[paddle.side][paddle.lane]
    ensureOsteoArrayLength(states, segmentCount)

    const segments: PaddleSegment[] = []
    let y = paddle.y

    for (let i = 0; i < segmentCount; i++) {
      const remainingSegments = segmentCount - i
      const remainingHeight = Math.max(paddle.y + paddle.height - y, 0)
      const gapSpace = i < segmentCount - 1 ? gap : 0
      const height = remainingSegments > 0
        ? Math.max(0, (remainingHeight - gapSpace * (remainingSegments - 1)) / remainingSegments)
        : 0

      if (height <= 0) {
        y += gap
        continue
      }

      const state = states[i]
      segments.push({
        paddle,
        index: i,
        x: paddle.x,
        y,
        width: PADDLE_W,
        height,
        osteoIndex: i,
        cracked: !state?.broken && (state?.hits ?? 0) > 0,
        broken: Boolean(state?.broken),
      })

      y += height + gap
    }

    return segments
  }

  function updateRussianRouletteOpacity(
    ball: BallState,
    paddles: PhysicalPaddle[],
    fadeDistance: number,
    fadeSpeed: number,
    dt: number,
  ) {
    if (fadeDistance <= 0) {
      ball.opacity = 1
      return
    }

    let minDistance = Infinity
    for (const paddle of paddles) {
      const distance = getDistanceToPaddle(ball, paddle)
      if (distance <= 0) {
        minDistance = 0
        break
      }
      if (distance < minDistance) {
        minDistance = distance
      }
    }

    const targetOpacity = minDistance <= fadeDistance ? 0 : 1
    if (fadeSpeed <= 0) {
      ball.opacity = targetOpacity
      return
    }

    const step = fadeSpeed * dt
    if (targetOpacity < ball.opacity) {
      ball.opacity = Math.max(targetOpacity, ball.opacity - step)
    } else if (targetOpacity > ball.opacity) {
      ball.opacity = Math.min(targetOpacity, ball.opacity + step)
    }
  }

  function getDistanceToPaddle(ball: BallState, paddle: PhysicalPaddle): number {
    const left = paddle.x
    const right = paddle.x + PADDLE_W
    const top = paddle.y
    const bottom = paddle.y + paddle.height
    const closestX = clamp(ball.x, left, right)
    const closestY = clamp(ball.y, top, bottom)
    const dx = ball.x - closestX
    const dy = ball.y - closestY
    const distance = Math.hypot(dx, dy) - ball.radius
    return Math.max(0, distance)
  }

  function resolvePaddleCollisions(ball: BallState, paddles: PhysicalPaddle[]) {
    for (const paddle of paddles) {
      const segments = buildPaddleSegments(paddle)
      for (const segment of segments) {
        if (tryResolveBallSegmentCollision(ball, segment)) {
          return true
        }
      }
    }
    return false
  }

  function tryResolveBallSegmentCollision(ball: BallState, segment: PaddleSegment): boolean {
    if (segment.height <= 0 || segment.broken) return false

    const top = segment.y
    const bottom = segment.y + segment.height
    if (ball.y <= top || ball.y >= bottom) return false

    const radius = ball.radius
    if (segment.paddle.physicalSide === 'left') {
      const contact = ball.x - radius
      if (contact <= segment.x || contact >= segment.x + segment.width) return false
      ball.x = segment.x + segment.width + radius
    } else {
      const contact = ball.x + radius
      if (contact <= segment.x || contact >= segment.x + segment.width) return false
      ball.x = segment.x - radius
    }

    const centerY = top + segment.height / 2
    const halfHeight = segment.height / 2 || 1
    const rel = clamp((ball.y - centerY) / halfHeight, -1, 1)
    const speed = Math.hypot(ball.vx, ball.vy) * config.speedIncreaseOnHit
    const deflection = computeDeflectionAngle(segment.paddle.side, rel, ball.vy)

    if (segment.paddle.physicalSide === 'left') {
      ball.vx = Math.cos(deflection) * speed
      ball.vy = Math.sin(deflection) * speed
    } else {
      const angle = Math.PI - deflection
      ball.vx = Math.cos(angle) * speed
      ball.vy = Math.sin(angle) * speed
    }

    if (segment.osteoIndex !== undefined) {
      applyOsteoDamage(segment)
    }

    handlePaddleReturn(segment.paddle.side, ball)
    return true
  }

  function computeDeflectionAngle(
    side: 'left' | 'right',
    rel: number,
    incomingVy: number,
  ) {
    const modifier = config.modifiers.paddle.brokePhysics
    if (!modifier.enabled) {
      return clamp(rel, -1, 1) * 0.8
    }

    const rawCenter = Number.isFinite(modifier.centerAngle) ? modifier.centerAngle : 1.2
    const rawEdge = Number.isFinite(modifier.edgeAngle) ? modifier.edgeAngle : 0
    const centerAngle = clamp(Math.abs(rawCenter), 0, Math.PI / 2)
    const edgeAngle = clamp(Math.abs(rawEdge), 0, Math.PI / 2)
    const amount = clamp(Math.abs(rel), 0, 1)
    const angleMagnitude = centerAngle + (edgeAngle - centerAngle) * amount
    let direction = Math.sign(rel)
    if (direction === 0) {
      direction = incomingVy >= 0 ? 1 : -1
    }
    return angleMagnitude * direction
  }

  function drawPotionObjects(
    objects: { x: number; y: number; radius: number }[],
    modifier: GravityWellModifier & { objectColor?: string },
  ) {
    if (!modifier.enabled || objects.length === 0) return

    const fallbackColor = modifier.positiveTint ?? '#f97316'
    const color = typeof modifier.objectColor === 'string' ? modifier.objectColor : fallbackColor
    ctx.save()
    ctx.fillStyle = color
    for (const object of objects) {
      if (object.radius <= 0) continue
      ctx.beginPath()
      ctx.arc(object.x, object.y, object.radius, 0, Math.PI * 2)
      ctx.fill()
    }
    ctx.restore()
  }

  function draw() {
    ctx.fillStyle = ARENA_BACKGROUND
    ctx.fillRect(0, 0, W, H)

    drawAnnouncement()
    drawServeCountdown()

    ctx.strokeStyle = 'rgba(255,255,255,0.15)'
    ctx.setLineDash([6, 10])
    ctx.beginPath()
    ctx.moveTo(W / 2, 0)
    ctx.lineTo(W / 2, H)
    ctx.stroke()
    ctx.setLineDash([])

    drawGravityWells(ctx, activeGravityWells, {
      backgroundRgb: ARENA_BACKGROUND_RGB,
      blackRgb: BLACK_RGB,
      whiteRgb: WHITE_RGB,
      maxVisualStrength: MAX_GRAVITY_VISUAL_STRENGTH,
    })

    drawWormholes(ctx, wormholeState, config.modifiers.arena.wormhole, {
      backgroundRgb: ARENA_BACKGROUND_RGB,
    })
    drawVortexPortals(ctx, vortexState, config.modifiers.arena.vortex, {
      backgroundRgb: ARENA_BACKGROUND_RGB,
    })

    drawPotionObjects(
      getDrinkMeObjects(drinkMeState, config.modifiers.arena.drinkMe),
      config.modifiers.arena.drinkMe,
    )
    drawPotionObjects(
      getTeaPartyObjects(teaPartyState, config.modifiers.arena.teaParty),
      config.modifiers.arena.teaParty,
    )

    drawMinesweeperSquares(ctx, minesweeperState, getMinesweeperModifier())

    drawSecondChanceShields(ctx, secondChancesState, getSecondChancesModifier(), {
      arenaWidth: W,
      arenaHeight: H,
      backgroundRgb: ARENA_BACKGROUND_RGB,
      swapSides: areSidesSwapped(),
    })
    drawSpaceInvadersBarricades(
      ctx,
      spaceInvadersState,
      getSpaceInvadersModifier(),
      { backgroundRgb: ARENA_BACKGROUND_RGB },
    )

    const ballColorRgb = getBallColorRgb()
    const ballColorHex = rgbToHex(ballColorRgb)
    const ballFillColor = rgbaString(ballColorRgb, 1)

    const paddlesToDraw = getPhysicalPaddles()
    const searchLightModifier = getSearchLightModifier()
    if (searchLightModifier.enabled) {
      const searchLightPaddles: SearchLightPaddleSnapshot[] = paddlesToDraw.map(paddle => ({
        side: paddle.side,
        x: paddle.x,
        y: paddle.y,
        height: paddle.height,
      }))
      drawSearchLightBeams(ctx, searchLightPaddles, searchLightModifier, arenaDimensions, {
        paddleWidth: PADDLE_W,
      })
    }
    drawBallTrails(ballColorHex)

    const hadronModifier = config.modifiers.paddle.hadron
    const charlotteModifier = config.modifiers.paddle.charlotte
    const charlotteEnabled = charlotteModifier.enabled
    for (const paddle of paddlesToDraw) {
      const segments = buildPaddleSegments(paddle)
      const baseHex = charlotteEnabled
        ? HIGHLIGHT_COLOR
        : hadronModifier.enabled
          ? hadronStatus[paddle.side]
            ? hadronModifier.armedColor
            : hadronModifier.disarmedColor
          : HIGHLIGHT_COLOR
      const baseRgb = hexToRgb(baseHex)
      const crackedRgb = mixRgb(baseRgb, WHITE_RGB, 0.35)
      const crackedColor = rgbaString(crackedRgb, 1)

      const tailOpacity = getPaddleOpacity(paddle)
      if (config.modifiers.paddle.outOfBody.enabled && paddle.lane !== 'missile') {
        drawOutOfBodyTrail(paddle, baseHex, crackedColor, tailOpacity)
      }

      if (tailOpacity <= 0) continue

      if (charlotteEnabled && paddle.lane !== 'missile') {
        drawCharlottePaddleBase(paddle, tailOpacity)
      }

      ctx.save()
      ctx.globalAlpha = tailOpacity
      for (const segment of segments) {
        if (segment.height <= 0 || segment.broken) continue
        const fillColor = segment.cracked ? crackedColor : baseHex
        const offset = getBendyOffset(paddle, segment)
        const rectX = segment.x + offset
        ctx.fillStyle = fillColor
        ctx.fillRect(rectX, segment.y, segment.width, segment.height)
        ctx.fillStyle =
          paddle.side === 'left' ? LEFT_PADDLE_EDGE_COLOR : RIGHT_PADDLE_EDGE_COLOR
        if (paddle.physicalSide === 'left') {
          ctx.fillRect(rectX, segment.y, PADDLE_EDGE_WIDTH, segment.height)
        } else {
          ctx.fillRect(
            rectX + segment.width - PADDLE_EDGE_WIDTH,
            segment.y,
            PADDLE_EDGE_WIDTH,
            segment.height,
          )
        }
      }
      ctx.restore()
    }

    ctx.fillStyle = ballFillColor
    for (const ball of balls) {
      const alpha = clamp(ball.opacity ?? 1, 0, 1)
      if (alpha <= 0) continue
      if (alpha < 1) {
        ctx.save()
        ctx.globalAlpha *= alpha
      }
      ctx.beginPath()
      ctx.arc(ball.x, ball.y, ball.radius, 0, Math.PI * 2)
      ctx.fill()
      if (alpha < 1) {
        ctx.restore()
      }
    }

    drawFogOfWarOverlay(ctx, fogOfWarState, config.modifiers.arena.fogOfWar, arenaDimensions)
    drawWonderlandSnow(
      ctx,
      wonderlandState,
      config.modifiers.arena.wonderland,
      HIGHLIGHT_COLOR,
    )

    const pipRadius = 6
    const pipSpacing = 22
    const pipY = H - 24
    const pipStartX = W / 2 - ((PIPS_PER_BITE - 1) * pipSpacing) / 2
    const meterLeft = pipStartX - pipRadius
    const meterRight = pipStartX + (PIPS_PER_BITE - 1) * pipSpacing + pipRadius
    ctx.lineWidth = 2

    if (state.completedBitesSinceLastPoint > 0) {
      const chevronWidth = 12
      const chevronHeight = 22
      const chevronSpacing = 6
      const previousLineCap = ctx.lineCap
      const previousLineJoin = ctx.lineJoin
      ctx.strokeStyle = HIGHLIGHT_COLOR
      ctx.lineCap = 'round'
      ctx.lineJoin = 'round'
      for (let i = 0; i < state.completedBitesSinceLastPoint; i++) {
        const offset = i * (chevronWidth + chevronSpacing)
        const leftInnerX = meterLeft - chevronSpacing - offset
        const leftOuterX = leftInnerX - chevronWidth
        ctx.beginPath()
        ctx.moveTo(leftInnerX, pipY - chevronHeight / 2)
        ctx.lineTo(leftOuterX, pipY)
        ctx.moveTo(leftInnerX, pipY + chevronHeight / 2)
        ctx.lineTo(leftOuterX, pipY)
        ctx.stroke()

        const rightInnerX = meterRight + chevronSpacing + offset
        const rightOuterX = rightInnerX + chevronWidth
        ctx.beginPath()
        ctx.moveTo(rightInnerX, pipY - chevronHeight / 2)
        ctx.lineTo(rightOuterX, pipY)
        ctx.moveTo(rightInnerX, pipY + chevronHeight / 2)
        ctx.lineTo(rightOuterX, pipY)
        ctx.stroke()
      }
      ctx.lineCap = previousLineCap
      ctx.lineJoin = previousLineJoin
    }

    for (let i = 0; i < PIPS_PER_BITE; i++) {
      const pipX = pipStartX + i * pipSpacing
      const isFilled = state.currentPips > 0 && i < state.currentPips
      ctx.beginPath()
      ctx.arc(pipX, pipY, pipRadius, 0, Math.PI * 2)
      if (isFilled) {
        ctx.fillStyle = HIGHLIGHT_COLOR
        ctx.fill()
      } else {
        ctx.strokeStyle = 'rgba(231,236,243,0.35)'
        ctx.stroke()
      }
    }
    ctx.lineWidth = 1

    ctx.fillStyle = HIGHLIGHT_COLOR
    ctx.font =
      'bold 28px ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto'
    ctx.textAlign = 'center'
    ctx.fillText(String(state.leftScore), W / 2 - 60, 40)
    ctx.fillText(String(state.rightScore), W / 2 + 60, 40)

    if (state.winner) {
      ctx.font = 'bold 36px ui-sans-serif, system-ui'
      ctx.fillText(`${state.winner.toUpperCase()} WINS!`, W / 2, H / 2)
    }
  }


  function drawServeCountdown() {
    if (pendingServeToLeft === null) return
    if (preServeDelayRemaining > 0) return
    if (serveCountdownRemaining <= 0) return

    const countdownValue = Math.ceil(serveCountdownRemaining)
    if (countdownValue <= 0) return

    ctx.save()
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    const baseSize = Math.min(W, H)
    const fontSize = Math.max(72, Math.floor(baseSize * 0.45))
    ctx.font = `900 ${fontSize}px 'Inter', ui-sans-serif, system-ui, -apple-system, 'Segoe UI', sans-serif`
    ctx.fillStyle = applyAlphaToColor('#ffffff', 0.08)
    ctx.fillText(String(countdownValue), W / 2, H / 2)
    ctx.restore()
  }

  function drawBallTrails(ballColorHex: string) {
    const ballModifiers = config.modifiers.ball
    drawBumShuffleTrail(ctx, bumShuffleState, ballModifiers.bumShuffle, {
      baseColor: ballColorHex,
      getBallRadius,
    })
    drawPollokTrail(ctx, pollokState, ballModifiers.pollok, { getBallRadius })
    drawKiteTrail(ctx, kiteState, ballModifiers.kite, {
      baseColor: ballColorHex,
      applyAlpha: applyAlphaToColor,
      getBallRadius,
    })
  }

  function drawAnnouncement() {
    if (!announcement) return

    const { lines, elapsed, holdDuration, fadeDuration } = announcement
    const totalDuration = holdDuration + fadeDuration
    if (elapsed > totalDuration) return

    let alpha = 1
    if (elapsed > holdDuration) {
      if (fadeDuration === 0) return
      alpha = Math.max(0, 1 - (elapsed - holdDuration) / fadeDuration)
    }

    if (alpha <= 0) return

    const visibleLines = lines.slice(0, 3)
    const lineCount = visibleLines.length
    if (lineCount === 0) return

    const fontSize = lineCount === 1 ? 148 : lineCount === 2 ? 122 : 96
    const lineHeight = fontSize * 1.12
    const startY = H / 2 - ((lineCount - 1) * lineHeight) / 2

    ctx.save()
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.font = `900 ${fontSize}px 'Inter', ui-sans-serif, system-ui, -apple-system, 'Segoe UI', sans-serif`
    ctx.fillStyle = applyAlphaToColor(ANNOUNCEMENT_COLOR, alpha)
    ctx.shadowColor = applyAlphaToColor('#0f172a', alpha * 0.6)
    ctx.shadowBlur = 22
    ctx.shadowOffsetX = 0
    ctx.shadowOffsetY = 0

    for (let i = 0; i < lineCount; i++) {
      ctx.fillText(visibleLines[i], W / 2, startY + i * lineHeight)
    }

    ctx.restore()
  }

  function getBallColorRgb(): RGBColor {
    const modifier = getSearchLightModifier()
    if (!modifier.enabled) {
      return hexToRgb(HIGHLIGHT_COLOR)
    }
    const brightness = getSearchLightBallBrightness(modifier)
    if (brightness >= 1) {
      return mixRgb(ARENA_BACKGROUND_RGB, WHITE_RGB, clamp01(brightness - 1))
    }
    return mixRgb(ARENA_BACKGROUND_RGB, BLACK_RGB, clamp01(1 - brightness))
  }

  function rgbToHex(color: RGBColor): string {
    const r = clampByte(Math.round(color.r))
    const g = clampByte(Math.round(color.g))
    const b = clampByte(Math.round(color.b))
    const toHex = (value: number) => value.toString(16).padStart(2, '0')
    return `#${toHex(r)}${toHex(g)}${toHex(b)}`
  }

  function hexToRgb(hex: string): RGBColor {
    const value = hex.trim().replace('#', '')
    if (value.length === 3) {
      const r = Number.parseInt(value[0] + value[0], 16)
      const g = Number.parseInt(value[1] + value[1], 16)
      const b = Number.parseInt(value[2] + value[2], 16)
      if (Number.isFinite(r) && Number.isFinite(g) && Number.isFinite(b)) {
        return { r, g, b }
      }
    }
    if (value.length === 6) {
      const r = Number.parseInt(value.slice(0, 2), 16)
      const g = Number.parseInt(value.slice(2, 4), 16)
      const b = Number.parseInt(value.slice(4, 6), 16)
      if (Number.isFinite(r) && Number.isFinite(g) && Number.isFinite(b)) {
        return { r, g, b }
      }
    }
    return { r: 255, g: 255, b: 255 }
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
    const clampedAlpha = clamp01(alpha)
    return `rgba(${clampByte(color.r)}, ${clampByte(color.g)}, ${clampByte(color.b)}, ${clampedAlpha})`
  }

  function clamp01(value: number): number {
    if (!Number.isFinite(value)) return 0
    return Math.max(0, Math.min(1, value))
  }

  function applyAlphaToColor(hex: string, alpha: number) {
    const clamped = Math.max(0, Math.min(1, alpha))
    const color = hexToRgb(hex)
    return `rgba(${color.r}, ${color.g}, ${color.b}, ${clamped})`
  }

  function randomRange(min: number, max: number) {
    return Math.random() * (max - min) + min
  }

  function clamp(v: number, a: number, b: number) {
    return Math.max(a, Math.min(b, v))
  }

  return { state, reset, tick }
}
