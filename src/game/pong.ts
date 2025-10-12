import {
  GRAVITY_WELL_KEYS,
  createDevConfig,
  deepClone,
  getGravityWellsEntries,
  type ArenaModifiers,
  type GravityWellKey,
  type GravityWellModifier,
} from './devtools'
import { createDevOverlay, showOverlay, toggleOverlay } from './devOverlay'

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
}

type KeySet = Record<string, boolean>

interface MovingWellState {
  x: number
  y: number
  targetX: number
  targetY: number
  pauseTimer: number
  hasTarget: boolean
}

interface ActiveGravityWell {
  key: GravityWellKey
  x: number
  y: number
  gravityStrength: number
  gravityFalloff: number // squared falloff radius used for force calculations
  radius: number
  positiveTint: string
  negativeTint: string
}

interface StoredWell {
  x: number
  y: number
  gravityStrength: number
  gravityFalloff: number // squared falloff radius
  radius: number
}

type MovingWellKey = 'blackMole' | 'gopher'

type DivotsModifier = GravityWellModifier & {
  maxDivots?: number
  spawnMargin?: number
}

type IrelandModifier = GravityWellModifier & {
  wellCount?: number
  minGravityStrength?: number
  maxGravityStrength?: number
  minGravityFalloff?: number
  maxGravityFalloff?: number
  minRadius?: number
  maxRadius?: number
}

interface Announcement {
  lines: string[]
  elapsed: number
  holdDuration: number
  fadeDuration: number
}

interface TrailPoint {
  x: number
  y: number
  radius?: number
}

interface ColoredTrailPoint extends TrailPoint {
  color: string
}

interface RGBColor {
  r: number
  g: number
  b: number
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
}

type PaddleLane = 'outer' | 'inner'

interface PhysicalPaddle {
  side: 'left' | 'right'
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

interface OsteoSegmentState {
  hits: number
  broken: boolean
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
  } = options
  const W = canvas.width
  const H = canvas.height
  const BASE_PADDLE_H = 90
  const PADDLE_W = 12
  const BALL_R = 8
  const WIN_SCORE = 11
  const PIPS_PER_BITE = 8
  const ARENA_BACKGROUND = '#10172a'
  const ANNOUNCEMENT_COLOR = '#203275'
  const BALL_COLOR = '#e7ecf3'
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
  const PADDLE_EDGE_WIDTH = 2

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
  let previousLeftSizeMultiplier = getPaddleSizeMultiplier('left')
  let previousRightSizeMultiplier = getPaddleSizeMultiplier('right')
  let previousDoublesEnabled = config.doubles.enabled

  const balls: BallState[] = state.balls
  const MAX_ACTIVE_BALLS = 6
  const hadronStatus: Record<'left' | 'right', boolean> = { left: true, right: true }
  const osteoStates: Record<'left' | 'right', Record<PaddleLane, OsteoSegmentState[]>> = {
    left: { outer: [], inner: [] },
    right: { outer: [], inner: [] },
  }
  let previousOsteoSignature: string | null = null

  const movingWellStates: Record<MovingWellKey, MovingWellState> = {
    blackMole: {
      x: W * 0.5,
      y: H * 0.5,
      targetX: W * 0.5,
      targetY: H * 0.5,
      pauseTimer: 0,
      hasTarget: false,
    },
    gopher: {
      x: W * 0.5,
      y: H * 0.5,
      targetX: W * 0.5,
      targetY: H * 0.5,
      pauseTimer: 0,
      hasTarget: false,
    },
  }

  const divotWells: StoredWell[] = []
  const irelandWells: StoredWell[] = []
  let irelandNeedsRegeneration = true
  let activeGravityWells: ActiveGravityWell[] = []
  let announcement: Announcement | null = null
  let lastEnabledArenaModifiers = new Set<GravityWellKey>(
    getEnabledArenaModifierKeys(config.modifiers.arena),
  )
  let activeModKey: GravityWellKey | null = null
  const kiteTrail: TrailPoint[] = []
  const bumShuffleTrail: TrailPoint[] = []
  const pollokTrail: ColoredTrailPoint[] = []
  let lastReturner: 'left' | 'right' | null = null
  let completedBitesSinceLastPoint = 0
  initializeActiveModState()
  resetBallSize()
  initializePaddleHeights(true)
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
    balls.push(createBall(toLeft))
    lastReturner = null
    resetBallSize()
    clearKiteTrail()
    syncPrimaryBallState()
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
    for (const movingState of Object.values(movingWellStates)) {
      resetMovingWellState(movingState)
    }
    divotWells.length = 0
    irelandWells.length = 0
    irelandNeedsRegeneration = true
    activeGravityWells = []
    announcement = null
    lastEnabledArenaModifiers = new Set<GravityWellKey>(
      getEnabledArenaModifierKeys(config.modifiers.arena),
    )
    clearKiteTrail()
    clearBumShuffleTrail()
    clearPollokTrail()
    lastReturner = null
    rearmHadron()
    syncOsteoState(true)
    initializePaddleHeights(true)
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

    updateMovingWellState('blackMole', dt)
    updateMovingWellState('gopher', dt)
    updateDivotsState()
    updateIrelandState()

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
      const keyDirection = doublesEnabled ? 0 : (keys['w'] ? -1 : 0) + (keys['s'] ? 1 : 0)
      let gamePadDirection = 0
      if (gamepadInput.leftAxis)
        gamePadDirection += gamepadInput.leftAxis * config.paddleSpeed * dt
      if (gamepadInput.leftUp) gamePadDirection -= config.paddleSpeed * dt
      if (gamepadInput.leftDown) gamePadDirection += config.paddleSpeed * dt

      const totalDirection = clamp(
        keyDirection + touchControls.left.direction + gamePadDirection,
        -1,
        1,
      )
      state.leftY += totalDirection * config.paddleSpeed * dt
      if (touchControls.left.relativeDelta !== 0) {
        state.leftY += touchControls.left.relativeDelta
        touchControls.left.relativeDelta = 0
      }

      if (doublesEnabled) {
        let innerGamepad = 0
        if (gamepadInput.rightAxis)
          innerGamepad += gamepadInput.rightAxis * config.paddleSpeed * dt
        if (gamepadInput.rightUp) innerGamepad -= config.paddleSpeed * dt
        if (gamepadInput.rightDown) innerGamepad += config.paddleSpeed * dt
        const innerDirection = clamp(innerGamepad, -1, 1)
        state.leftInnerY += innerDirection * config.paddleSpeed * dt
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
      const keyDirection = (keys['ArrowUp'] ? -1 : 0) + (keys['ArrowDown'] ? 1 : 0)
      let gamePadDirection = 0
      if (!doublesEnabled) {
        if (gamepadInput.rightAxis)
          gamePadDirection += gamepadInput.rightAxis * config.paddleSpeed * dt
        if (gamepadInput.rightUp) gamePadDirection -= config.paddleSpeed * dt
        if (gamepadInput.rightDown) gamePadDirection += config.paddleSpeed * dt
      }
      const totalDirection = clamp(
        keyDirection + touchControls.right.direction + gamePadDirection,
        -1,
        1,
      )
      state.rightY += totalDirection * config.paddleSpeed * dt
      if (touchControls.right.relativeDelta !== 0) {
        state.rightY += touchControls.right.relativeDelta
        touchControls.right.relativeDelta = 0
      }

      if (doublesEnabled) {
        const innerKeyDirection = (keys['w'] ? -1 : 0) + (keys['s'] ? 1 : 0)
        const innerDirection = clamp(innerKeyDirection, -1, 1)
        state.rightInnerY += innerDirection * config.paddleSpeed * dt
      } else {
        state.rightInnerY = state.rightY
      }
    }

    state.leftY = clamp(state.leftY, 0, H - leftPaddleHeight)
    state.rightY = clamp(state.rightY, 0, H - rightPaddleHeight)
    if (doublesEnabled) {
      state.leftInnerY = clamp(state.leftInnerY, 0, H - state.leftInnerPaddleHeight)
      state.rightInnerY = clamp(state.rightInnerY, 0, H - state.rightInnerPaddleHeight)
    } else {
      state.leftInnerY = state.leftY
      state.rightInnerY = state.rightY
    }

    // Gravity well influence
    activeGravityWells = collectActiveGravityWells()
    const paddles = getPhysicalPaddles()
    let pointAwarded: 'left' | 'right' | null = null

    for (let i = 0; i < balls.length; i++) {
      const ball = balls[i]
      const prevVx = ball.vx

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

      let radius = ball.radius

      if (ball.y < radius) {
        ball.y = radius
        ball.vy *= -1
      } else if (ball.y > H - radius) {
        ball.y = H - radius
        ball.vy *= -1
      }

      if (resolvePaddleCollisions(ball, paddles)) {
        radius = ball.radius
      }

      if (ball.x < -radius) {
        pointAwarded = 'right'
        break
      }
      if (ball.x > W + radius) {
        pointAwarded = 'left'
        break
      }
    }

    syncPrimaryBallState()

    if (pointAwarded) {
      if (pointAwarded === 'right') {
        state.rightScore++
        if (state.rightScore >= WIN_SCORE) state.winner = 'right'
        clearDivotWells()
        resetBall(false)
      } else {
        state.leftScore++
        if (state.leftScore >= WIN_SCORE) state.winner = 'left'
        clearDivotWells()
        resetBall(true)
      }
      handlePointScored()
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
    lastReturner = side
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
    }

    balls.push(newBall)
  }

  function clearDivotWells() {
    if (divotWells.length > 0) divotWells.length = 0
  }

  function handlePointScored() {
    rearmHadron()
    syncOsteoState(true)
    initializePaddleHeights(true)
    if (completedBitesSinceLastPoint > 0) {
      const previousActive = activeModKey
      disableAllMods()
      let excludeKey = previousActive
      for (let i = 0; i < completedBitesSinceLastPoint; i++) {
        const nextKey = pickRandomMod(excludeKey)
        setActiveMod(nextKey)
        excludeKey = activeModKey
      }
      completedBitesSinceLastPoint = 0
      state.completedBitesSinceLastPoint = 0
    }

    irelandNeedsRegeneration = true
    clearBumShuffleTrail()

    const modifier = config.modifiers.arena.ireland as IrelandModifier
    if (!modifier.enabled) {
      irelandWells.length = 0
      return
    }

    regenerateIrelandWells(modifier)
    irelandNeedsRegeneration = false
    activeGravityWells = collectActiveGravityWells()
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
      osteoStates.right.outer = []
      osteoStates.right.inner = []
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
      osteoStates.right.outer = createSegments()
      osteoStates.right.inner = createSegments()
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
    const multiplier = Number.isFinite(value) ? value : 1
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

      if (key === 'divots') clearDivotWells()
      if (key === 'ireland') {
        irelandWells.length = 0
        irelandNeedsRegeneration = true
      }
      if (key === 'blackMole' || key === 'gopher') {
        resetMovingWellState(movingWellStates[key])
      }
    }

    if (anyDisabled) {
      activeGravityWells = collectActiveGravityWells()
    }

    activeModKey = null
  }

  function collectActiveGravityWells(): ActiveGravityWell[] {
    const wells: ActiveGravityWell[] = []
    for (const [key, modifier] of getGravityWellsEntries(config.modifiers.arena)) {
      if (!modifier.enabled) continue

      if (key === 'blackMole' || key === 'gopher') {
        const state = movingWellStates[key]
        wells.push({
          key,
          x: state.x,
          y: state.y,
          gravityStrength: modifier.gravityStrength,
          gravityFalloff: toGravityFalloffValue(modifier.gravityFalloff),
          radius: modifier.radius,
          positiveTint: modifier.positiveTint,
          negativeTint: modifier.negativeTint,
        })
        continue
      }

      if (key === 'divots') {
        for (const well of divotWells) {
          wells.push({
            key,
            x: well.x,
            y: well.y,
            gravityStrength: well.gravityStrength,
            gravityFalloff: well.gravityFalloff,
            radius: well.radius,
            positiveTint: modifier.positiveTint,
            negativeTint: modifier.negativeTint,
          })
        }
        continue
      }

      if (key === 'ireland') {
        const wellsToRender =
          irelandWells.length > 0
            ? irelandWells
            : [
                {
                  x: W * 0.5,
                  y: H * 0.5,
                  gravityStrength: modifier.gravityStrength,
                  gravityFalloff: toGravityFalloffValue(modifier.gravityFalloff),
                  radius: modifier.radius,
                },
              ]

        for (const well of wellsToRender) {
          wells.push({
            key,
            x: well.x,
            y: well.y,
            gravityStrength: well.gravityStrength,
            gravityFalloff: well.gravityFalloff,
            radius: well.radius,
            positiveTint: modifier.positiveTint,
            negativeTint: modifier.negativeTint,
          })
        }
        continue
      }

      wells.push({
        key,
        x: W * 0.5,
        y: H * 0.5,
        gravityStrength: modifier.gravityStrength,
        gravityFalloff: toGravityFalloffValue(modifier.gravityFalloff),
        radius: modifier.radius,
        positiveTint: modifier.positiveTint,
        negativeTint: modifier.negativeTint,
      })
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
      const rawMin = Number.isFinite(snowball.minRadius) ? snowball.minRadius : BALL_R * 0.5
      const rawMax = Number.isFinite(snowball.maxRadius) ? snowball.maxRadius : BALL_R * 2
      const minRadius = clamp(rawMin, 1, 160)
      const maxRadius = clamp(Math.max(rawMax, minRadius), minRadius, 200)
      const growthRate = Number.isFinite(snowball.growthRate)
        ? Math.max(0, snowball.growthRate)
        : 0
      radius = clamp(minRadius + ball.travelDistance * growthRate, minRadius, maxRadius)
    }

    if (meteor.enabled) {
      const rawStart = Number.isFinite(meteor.startRadius) ? meteor.startRadius : BALL_R * 2
      const startRadius = clamp(rawStart, 2, 220)
      const rawMin = Number.isFinite(meteor.minRadius) ? meteor.minRadius : BALL_R * 0.75
      const minRadius = clamp(Math.min(rawMin, startRadius), 1, startRadius)
      const shrinkRate = Number.isFinite(meteor.shrinkRate)
        ? Math.max(0, meteor.shrinkRate)
        : 0
      radius = clamp(startRadius - ball.travelDistance * shrinkRate, minRadius, startRadius)
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

    if (ball.kite.enabled) {
      const maxLength = clampTrailLength(ball.kite.tailLength, 4, MAX_KITE_HISTORY)
      addTrailPoint(kiteTrail, x, y, maxLength, 0, radius)
    } else if (kiteTrail.length > 0) {
      clearKiteTrail()
    }

    if (ball.bumShuffle.enabled) {
      const maxLength = clampTrailLength(ball.bumShuffle.trailLength, 40, MAX_BUM_SHUFFLE_HISTORY)
      addTrailPoint(bumShuffleTrail, x, y, maxLength, BUM_SHUFFLE_DISTANCE_SQ, radius)
    } else if (bumShuffleTrail.length > 0) {
      clearBumShuffleTrail()
    }

    if (ball.pollok.enabled) {
      const maxLength = clampTrailLength(ball.pollok.trailLength, 80, MAX_POLLOK_HISTORY)
      addColoredTrailPoint(
        pollokTrail,
        x,
        y,
        getPollokColor(),
        maxLength,
        POLLOK_DISTANCE_SQ,
        radius,
      )
    } else if (pollokTrail.length > 0) {
      clearPollokTrail()
    }
  }

  function updateMovingWellState(key: MovingWellKey, dt: number) {
    const state = movingWellStates[key]
    const modifier = config.modifiers.arena[key]
    if (!modifier.enabled) {
      resetMovingWellState(state)
      return
    }

    const widthPercentage = clamp(modifier.wanderWidthPercentage ?? 0.33, 0.05, 1)
    const wanderSpeed = Math.max(0, modifier.wanderSpeed ?? 110)
    const pauseDuration = Math.max(0, modifier.pauseDuration ?? 1.25)

    const halfWidth = (W * widthPercentage) / 2
    const halfHeight = (H * widthPercentage) / 2
    const minX = W * 0.5 - halfWidth
    const maxX = W * 0.5 + halfWidth
    const minY = H * 0.5 - halfHeight
    const maxY = H * 0.5 + halfHeight

    state.x = clamp(state.x, minX, maxX)
    state.y = clamp(state.y, minY, maxY)
    state.targetX = clamp(state.targetX, minX, maxX)
    state.targetY = clamp(state.targetY, minY, maxY)

    const pickNextTarget = () => {
      state.targetX = randomRange(minX, maxX)
      state.targetY = randomRange(minY, maxY)
      state.hasTarget = true
    }

    if (!state.hasTarget) {
      pickNextTarget()
    }

    if (state.pauseTimer > 0) {
      state.pauseTimer = Math.max(0, state.pauseTimer - dt)
      if (state.pauseTimer === 0) {
        pickNextTarget()
      }
      return
    }

    const dx = state.targetX - state.x
    const dy = state.targetY - state.y
    const dist = Math.hypot(dx, dy)
    if (dist === 0) {
      state.pauseTimer = pauseDuration
      return
    }

    const step = wanderSpeed * dt
    if (dist <= step) {
      state.x = state.targetX
      state.y = state.targetY
      state.pauseTimer = pauseDuration
      return
    }

    const invDist = 1 / dist
    state.x += dx * invDist * step
    state.y += dy * invDist * step
  }

  function updateDivotsState() {
    const modifier = config.modifiers.arena.divots as DivotsModifier
    if (!modifier.enabled) {
      if (divotWells.length > 0) divotWells.length = 0
      return
    }

    const maxDivots = Math.max(1, Math.floor(modifier.maxDivots ?? 12))
    if (divotWells.length > maxDivots) {
      divotWells.splice(0, divotWells.length - maxDivots)
    }
  }

  function updateIrelandState() {
    const modifier = config.modifiers.arena.ireland as IrelandModifier
    if (!modifier.enabled) {
      if (irelandWells.length > 0) irelandWells.length = 0
      irelandNeedsRegeneration = true
      return
    }

    if (irelandNeedsRegeneration || irelandWells.length === 0) {
      regenerateIrelandWells(modifier)
      irelandNeedsRegeneration = false
    }
  }

  function regenerateIrelandWells(modifier: IrelandModifier) {
    irelandWells.length = 0

    const wellCount = Math.max(1, Math.floor(modifier.wellCount ?? 14))
    const [minStrength, maxStrength] = resolveRange(
      modifier.minGravityStrength,
      modifier.maxGravityStrength,
      modifier.gravityStrength * 0.5,
      modifier.gravityStrength * 1.5,
    )
    const [minFalloff, maxFalloff] = resolveRange(
      modifier.minGravityFalloff,
      modifier.maxGravityFalloff,
      modifier.gravityFalloff * 0.5,
      modifier.gravityFalloff * 1.5,
    )
    const [minRadius, maxRadius] = resolveRange(
      modifier.minRadius,
      modifier.maxRadius,
      Math.max(16, modifier.radius * 0.5),
      Math.max(20, modifier.radius * 1.25),
    )

    for (let i = 0; i < wellCount; i++) {
      const radius = randomRange(minRadius, maxRadius)
      const margin = Math.max(20, radius)
      const minX = Math.max(margin, 0)
      const maxX = Math.min(W - margin, W)
      const minY = Math.max(margin, 0)
      const maxY = Math.min(H - margin, H)
      const x = minX <= maxX ? randomRange(minX, maxX) : W * 0.5
      const y = minY <= maxY ? randomRange(minY, maxY) : H * 0.5
      const gravityStrength = randomRange(minStrength, maxStrength)
      const gravityFalloff = randomRange(minFalloff, maxFalloff)
      irelandWells.push({
        x,
        y,
        gravityStrength,
        gravityFalloff: toGravityFalloffValue(gravityFalloff),
        radius,
      })
    }
  }

  function spawnDivotWell() {
    const modifier = config.modifiers.arena.divots as DivotsModifier
    if (!modifier.enabled) return

    const maxDivots = Math.max(1, Math.floor(modifier.maxDivots ?? 12))
    const margin = Math.max(20, modifier.spawnMargin ?? modifier.radius ?? 0)
    const minX = Math.max(margin, 0)
    const maxX = Math.min(W - margin, W)
    const minY = Math.max(margin, 0)
    const maxY = Math.min(H - margin, H)
    const x = minX <= maxX ? randomRange(minX, maxX) : W * 0.5
    const y = minY <= maxY ? randomRange(minY, maxY) : H * 0.5

    const newWell: StoredWell = {
      x,
      y,
      gravityStrength: modifier.gravityStrength,
      gravityFalloff: toGravityFalloffValue(modifier.gravityFalloff),
      radius: modifier.radius,
    }
    divotWells.push(newWell)

    if (divotWells.length > maxDivots) {
      divotWells.splice(0, divotWells.length - maxDivots)
    }
  }

  function resetMovingWellState(state: MovingWellState) {
    state.x = W * 0.5
    state.y = H * 0.5
    state.targetX = W * 0.5
    state.targetY = H * 0.5
    state.pauseTimer = 0
    state.hasTarget = false
  }

  function initializeActiveModState() {
    const enabledMods = GRAVITY_WELL_KEYS.filter(key => config.modifiers.arena[key].enabled)
    if (enabledMods.length === 0) {
      setActiveMod(pickRandomMod(null))
      return
    }

    if (enabledMods.length === 1) {
      activeModKey = enabledMods[0]
      return
    }

    setActiveMod(enabledMods[0])
  }

  function setActiveMod(nextKey: GravityWellKey) {
    if (activeModKey === nextKey && config.modifiers.arena[nextKey].enabled) return

    for (const key of GRAVITY_WELL_KEYS) {
      const modifier = config.modifiers.arena[key]
      const shouldEnable = key === nextKey
      if (modifier.enabled === shouldEnable) continue

      modifier.enabled = shouldEnable

      if (!shouldEnable) {
        if (key === 'divots') clearDivotWells()
        if (key === 'ireland') {
          irelandWells.length = 0
          irelandNeedsRegeneration = true
        }
        if (key === 'blackMole' || key === 'gopher') {
          resetMovingWellState(movingWellStates[key])
        }
      }
    }

    activeModKey = nextKey

    if (nextKey === 'ireland') {
      irelandNeedsRegeneration = true
    }

    activeGravityWells = collectActiveGravityWells()
  }

  function pickRandomMod(exclude: GravityWellKey | null) {
    const available = GRAVITY_WELL_KEYS.filter(key => key !== exclude)
    const pool = available.length > 0 ? available : GRAVITY_WELL_KEYS
    return pool[Math.floor(Math.random() * pool.length)]
  }

  function resolveRange(
    minValue: number | undefined,
    maxValue: number | undefined,
    fallbackMin: number,
    fallbackMax: number,
  ): [number, number] {
    let min = typeof minValue === 'number' && Number.isFinite(minValue) ? minValue : fallbackMin
    let max = typeof maxValue === 'number' && Number.isFinite(maxValue) ? maxValue : fallbackMax
    if (min > max) {
      ;[min, max] = [max, min]
    }
    return [min, max]
  }

  function createGravityWellGradient(
    context: CanvasRenderingContext2D,
    well: ActiveGravityWell,
  ): CanvasGradient {
    const gradient = context.createRadialGradient(
      well.x,
      well.y,
      0,
      well.x,
      well.y,
      well.radius,
    )

    const magnitude = clamp01(Math.abs(well.gravityStrength) / MAX_GRAVITY_VISUAL_STRENGTH)
    const tintHex = well.gravityStrength >= 0 ? well.positiveTint : well.negativeTint
    const tint = parseColorToRgb(tintHex, ARENA_BACKGROUND_RGB)

    if (well.gravityStrength >= 0) {
      const innerColor = mixRgb(tint, BLACK_RGB, 0.6 + 0.4 * magnitude)
      const midColor = mixRgb(tint, WHITE_RGB, 0.3 + 0.35 * magnitude)
      const innerAlpha = 0.35 + 0.45 * magnitude
      const midAlpha = 0.18 + 0.22 * magnitude
      gradient.addColorStop(0, rgbaString(innerColor, innerAlpha))
      gradient.addColorStop(0.45, rgbaString(midColor, midAlpha))
    } else {
      const innerColor = mixRgb(tint, WHITE_RGB, 0.55 + 0.45 * magnitude)
      const midColor = mixRgb(tint, ARENA_BACKGROUND_RGB, 0.1 + 0.25 * magnitude)
      const innerAlpha = 0.45 + 0.45 * magnitude
      const midAlpha = 0.25 + 0.25 * magnitude
      gradient.addColorStop(0, rgbaString(innerColor, innerAlpha))
      gradient.addColorStop(0.45, rgbaString(midColor, midAlpha))
    }

    gradient.addColorStop(1, rgbaString(ARENA_BACKGROUND_RGB, 0))
    return gradient
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
    return 40
  }

  function getRightOuterX() {
    return W - 40 - PADDLE_W
  }

  function getLeftInnerX() {
    return W / 2 - getInnerOffset() - PADDLE_W
  }

  function getRightInnerX() {
    return W / 2 + getInnerOffset()
  }

  function getPhysicalPaddles(): PhysicalPaddle[] {
    const paddles: PhysicalPaddle[] = []
    const doublesEnabled = Boolean(config.doubles.enabled)

    if (doublesEnabled) {
      paddles.push({
        side: 'left',
        lane: 'inner',
        x: getLeftInnerX(),
        y: state.leftInnerY,
        height: state.leftInnerPaddleHeight,
      })
      paddles.push({
        side: 'left',
        lane: 'outer',
        x: getLeftOuterX(),
        y: state.leftY,
        height: state.leftPaddleHeight,
      })
      paddles.push({
        side: 'right',
        lane: 'inner',
        x: getRightInnerX(),
        y: state.rightInnerY,
        height: state.rightInnerPaddleHeight,
      })
      paddles.push({
        side: 'right',
        lane: 'outer',
        x: getRightOuterX(),
        y: state.rightY,
        height: state.rightPaddleHeight,
      })
      return paddles
    }

    paddles.push({
      side: 'left',
      lane: 'outer',
      x: getLeftOuterX(),
      y: state.leftY,
      height: state.leftPaddleHeight,
    })
    paddles.push({
      side: 'right',
      lane: 'outer',
      x: getRightOuterX(),
      y: state.rightY,
      height: state.rightPaddleHeight,
    })
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

    const buckToothModifier = config.modifiers.paddle.buckTooth
    if (buckToothModifier.enabled) {
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
    if (segment.paddle.side === 'left') {
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

    if (segment.paddle.side === 'left') {
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

  function draw() {
    ctx.fillStyle = ARENA_BACKGROUND
    ctx.fillRect(0, 0, W, H)

    drawAnnouncement()

    ctx.strokeStyle = 'rgba(255,255,255,0.15)'
    ctx.setLineDash([6, 10])
    ctx.beginPath()
    ctx.moveTo(W / 2, 0)
    ctx.lineTo(W / 2, H)
    ctx.stroke()
    ctx.setLineDash([])

    for (const well of activeGravityWells) {
      const gradient = createGravityWellGradient(ctx, well)
      ctx.fillStyle = gradient
      ctx.beginPath()
      ctx.arc(well.x, well.y, well.radius, 0, Math.PI * 2)
      ctx.fill()
    }

    drawBallTrails()

    const hadronModifier = config.modifiers.paddle.hadron
    const paddlesToDraw = getPhysicalPaddles()
    for (const paddle of paddlesToDraw) {
      const segments = buildPaddleSegments(paddle)
      const baseHex = hadronModifier.enabled
        ? hadronStatus[paddle.side]
          ? hadronModifier.armedColor
          : hadronModifier.disarmedColor
        : BALL_COLOR
      const baseRgb = hexToRgb(baseHex)
      const crackedRgb = mixRgb(baseRgb, WHITE_RGB, 0.35)
      const crackedColor = rgbaString(crackedRgb, 1)

      for (const segment of segments) {
        if (segment.height <= 0 || segment.broken) continue
        const fillColor = segment.cracked ? crackedColor : baseHex
        ctx.fillStyle = fillColor
        ctx.fillRect(segment.x, segment.y, segment.width, segment.height)
        ctx.fillStyle =
          paddle.side === 'left' ? LEFT_PADDLE_EDGE_COLOR : RIGHT_PADDLE_EDGE_COLOR
        if (paddle.side === 'left') {
          ctx.fillRect(segment.x, segment.y, PADDLE_EDGE_WIDTH, segment.height)
        } else {
          ctx.fillRect(
            segment.x + segment.width - PADDLE_EDGE_WIDTH,
            segment.y,
            PADDLE_EDGE_WIDTH,
            segment.height,
          )
        }
      }
    }

    ctx.fillStyle = BALL_COLOR
    for (const ball of balls) {
      ctx.beginPath()
      ctx.arc(ball.x, ball.y, ball.radius, 0, Math.PI * 2)
      ctx.fill()
    }

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
      ctx.strokeStyle = '#e7ecf3'
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
        ctx.fillStyle = BALL_COLOR
        ctx.fill()
      } else {
        ctx.strokeStyle = 'rgba(231,236,243,0.35)'
        ctx.stroke()
      }
    }
    ctx.lineWidth = 1

    ctx.fillStyle = BALL_COLOR
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

  function drawBallTrails() {
    drawBumShuffleTrail()
    drawPollokTrail()
    drawKiteTrail()
  }

  function drawBumShuffleTrail() {
    const modifier = config.modifiers.ball.bumShuffle
    if (!modifier.enabled || bumShuffleTrail.length < 2) return

    ctx.save()
    const latestRadius =
      bumShuffleTrail[bumShuffleTrail.length - 1]?.radius ?? getBallRadius()
    ctx.lineWidth = Math.max(1, latestRadius * 1.35)
    ctx.lineCap = 'round'
    ctx.lineJoin = 'round'
    ctx.strokeStyle = BALL_COLOR
    ctx.beginPath()
    ctx.moveTo(bumShuffleTrail[0].x, bumShuffleTrail[0].y)
    for (let i = 1; i < bumShuffleTrail.length; i++) {
      ctx.lineTo(bumShuffleTrail[i].x, bumShuffleTrail[i].y)
    }
    ctx.stroke()
    ctx.restore()
  }

  function drawPollokTrail() {
    const modifier = config.modifiers.ball.pollok
    if (!modifier.enabled || pollokTrail.length < 2) return

    ctx.save()
    ctx.lineCap = 'round'
    ctx.lineJoin = 'round'

    const fallbackRadius = getBallRadius()
    for (let i = 1; i < pollokTrail.length; i++) {
      const prev = pollokTrail[i - 1]
      const current = pollokTrail[i]
      if (prev.x === current.x && prev.y === current.y) continue
      const prevRadius = prev.radius ?? fallbackRadius
      const currentRadius = current.radius ?? fallbackRadius
      const averageRadius = (prevRadius + currentRadius) * 0.5
      ctx.lineWidth = Math.max(1, averageRadius * 1.45)
      ctx.strokeStyle = current.color
      ctx.beginPath()
      ctx.moveTo(prev.x, prev.y)
      ctx.lineTo(current.x, current.y)
      ctx.stroke()
    }

    ctx.restore()
  }

  function drawKiteTrail() {
    const modifier = config.modifiers.ball.kite
    if (!modifier.enabled || kiteTrail.length === 0) return

    ctx.save()
    const length = kiteTrail.length
    for (let i = 0; i < length; i++) {
      const point = kiteTrail[i]
      const alpha = ((i + 1) / length) * 0.8
      ctx.fillStyle = applyAlphaToColor(BALL_COLOR, Math.min(1, alpha))
      ctx.beginPath()
      const radius = point.radius ?? getBallRadius()
      ctx.arc(point.x, point.y, radius, 0, Math.PI * 2)
      ctx.fill()
    }
    ctx.restore()
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

  function getPollokColor() {
    const modifier = config.modifiers.ball.pollok
    if (lastReturner === 'left') return modifier.leftColor
    if (lastReturner === 'right') return modifier.rightColor
    return modifier.neutralColor
  }

  function clampTrailLength(value: number | undefined, min: number, max: number) {
    if (!Number.isFinite(value)) return min
    const length = Math.floor(value as number)
    return Math.max(min, Math.min(max, length))
  }

  function addTrailPoint(
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

  function addColoredTrailPoint(
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

  function clearKiteTrail() {
    if (kiteTrail.length > 0) kiteTrail.length = 0
  }

  function clearBumShuffleTrail() {
    if (bumShuffleTrail.length > 0) bumShuffleTrail.length = 0
  }

  function clearPollokTrail() {
    if (pollokTrail.length > 0) pollokTrail.length = 0
    lastReturner = null
  }

  function parseColorToRgb(color: string, fallback: RGBColor): RGBColor {
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

  function clampByte(value: number): number {
    if (!Number.isFinite(value)) return 0
    return Math.max(0, Math.min(255, Math.round(value)))
  }

  function applyAlphaToColor(hex: string, alpha: number) {
    const clamped = Math.max(0, Math.min(1, alpha))
    const value = hex.replace('#', '')
    const r = parseInt(value.slice(0, 2), 16)
    const g = parseInt(value.slice(2, 4), 16)
    const b = parseInt(value.slice(4, 6), 16)
    return `rgba(${r}, ${g}, ${b}, ${clamped})`
  }

  function randomRange(min: number, max: number) {
    return Math.random() * (max - min) + min
  }

  function clamp(v: number, a: number, b: number) {
    return Math.max(a, Math.min(b, v))
  }

  return { state, reset, tick }
}
