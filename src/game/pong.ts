import {
  GRAVITY_WELL_KEYS,
  GRAVITY_WELL_VISUALS,
  createDevConfig,
  deepClone,
  getGravityWellsEntries,
  type ArenaModifiers,
  type GravityWellKey,
  type GravityWellModifier,
} from './devtools'
import { createDevOverlay, toggleOverlay } from './devOverlay'

export interface PongState {
  leftScore: number
  rightScore: number
  ballX: number
  ballY: number
  ballRadius: number
  vx: number
  vy: number
  leftY: number
  rightY: number
  leftPaddleHeight: number
  rightPaddleHeight: number
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

interface PaddleHeightOptions {
  center?: boolean
  preserveCenter?: boolean
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

  const defaults = createDevConfig()
  const config = deepClone(defaults)
  const container = canvas.parentElement
  container?.classList.add('dev-overlay-container')

  const overlay = createDevOverlay(config, defaults, {
    onDockChange: () => syncOverlayLayout(),
  })
  container?.appendChild(overlay)
  syncOverlayLayout()

  const keys: KeySet = {}
  let leftAIEnabled = true
  let rightAIEnabled = true

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
      if (key === 'w' || key === 's') leftAIEnabled = false
      if (key === 'arrowup' || key === 'arrowdown') rightAIEnabled = false
    })
    window.addEventListener('keyup', (e) => (keys[e.key] = false))
  }

  const state: PongState = {
    leftScore: 0,
    rightScore: 0,
    ballX: W * 0.5,
    ballY: H * 0.5,
    ballRadius: BALL_R,
    vx: config.baseBallSpeed * (Math.random() < 0.5 ? -1 : 1),
    vy: (Math.random() * 2 - 1) * config.baseBallSpeed * 0.6,
    leftY: H * 0.5 - BASE_PADDLE_H / 2,
    rightY: H * 0.5 - BASE_PADDLE_H / 2,
    leftPaddleHeight: BASE_PADDLE_H,
    rightPaddleHeight: BASE_PADDLE_H,
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
  let currentBallRadius = BALL_R
  let ballTravelDistance = 0

  initializeActiveModState()
  resetBallSize()
  initializePaddleHeights(true)

  function resetBall(toLeft: boolean) {
    state.ballX = W * 0.5
    state.ballY = H * 0.5
    state.vx = config.baseBallSpeed * (toLeft ? -1 : 1)
    state.vy = (Math.random() * 2 - 1) * config.baseBallSpeed * 0.6
    lastReturner = null
    resetBallSize()
    clearKiteTrail()
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
    container.classList.toggle('dev-overlay-container--docked', docked && visible)
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

    if (state.winner) return

    updateMovingWellState('blackMole', dt)
    updateMovingWellState('gopher', dt)
    updateDivotsState()
    updateIrelandState()

    // Controls
    if (leftAIEnabled) {
      const target = state.ballY - leftPaddleHeight / 2
      const diff = target - state.leftY
      const maxStep = config.paddleSpeed * dt
      state.leftY += clamp(diff, -maxStep, maxStep)
    } else {
      if (keys['w']) state.leftY -= config.paddleSpeed * dt
      if (keys['s']) state.leftY += config.paddleSpeed * dt
    }

    if (rightAIEnabled) {
      const target = state.ballY - rightPaddleHeight / 2
      const diff = target - state.rightY
      const maxStep = config.paddleSpeed * dt
      state.rightY += clamp(diff, -maxStep, maxStep)
    } else {
      if (keys['ArrowUp']) state.rightY -= config.paddleSpeed * dt
      if (keys['ArrowDown']) state.rightY += config.paddleSpeed * dt
    }

    state.leftY = clamp(state.leftY, 0, H - leftPaddleHeight)
    state.rightY = clamp(state.rightY, 0, H - rightPaddleHeight)

    // Gravity well influence
    activeGravityWells = collectActiveGravityWells()
    const prevVx = state.vx
    for (const well of activeGravityWells) {
      const dx = well.x - state.ballX
      const dy = well.y - state.ballY
      const distSq = dx * dx + dy * dy
      const dist = Math.sqrt(distSq) || 1
      const force = well.gravityStrength / (distSq + well.gravityFalloff)
      const ax = (dx / dist) * force
      const ay = (dy / dist) * force
      state.vx += ax * dt
      state.vy += ay * dt
    }

    if (prevVx !== 0) {
      const direction = Math.sign(prevVx)
      const minHorizontalSpeed = config.baseBallSpeed * config.minHorizontalRatio
      const minSpeed = minHorizontalSpeed * direction
      if (state.vx * direction < minHorizontalSpeed) {
        state.vx = minSpeed
      }
    }

    const speed = Math.hypot(state.vx, state.vy)

    // Move ball
    state.ballX += state.vx * dt
    state.ballY += state.vy * dt

    applyBallSizeModifiers(speed * dt)

    let radius = getBallRadius()

    // Top/Bottom bounce
    if (state.ballY < radius) {
      state.ballY = radius
      state.vy *= -1
    }
    if (state.ballY > H - radius) {
      state.ballY = H - radius
      state.vy *= -1
    }

    // Left paddle collision
    if (
      state.ballX - radius < 40 + PADDLE_W &&
      state.ballX - radius > 40 &&
      state.ballY > state.leftY &&
      state.ballY < state.leftY + leftPaddleHeight
    ) {
      state.ballX = 40 + PADDLE_W + radius
      const rel =
        (state.ballY - (state.leftY + leftPaddleHeight / 2)) / (leftPaddleHeight / 2)
      const angle = rel * 0.8
      const reboundSpeed = Math.hypot(state.vx, state.vy) * config.speedIncreaseOnHit
      state.vx = Math.cos(angle) * reboundSpeed
      state.vy = Math.sin(angle) * reboundSpeed
      handlePaddleReturn('left')
      radius = getBallRadius()
    }

    // Right paddle collision
    if (
      state.ballX + radius > W - 40 - PADDLE_W &&
      state.ballX + radius < W - 40 &&
      state.ballY > state.rightY &&
      state.ballY < state.rightY + rightPaddleHeight
    ) {
      state.ballX = W - 40 - PADDLE_W - radius
      const rel =
        (state.ballY - (state.rightY + rightPaddleHeight / 2)) /
        (rightPaddleHeight / 2)
      const angle = Math.PI - rel * 0.8
      const reboundSpeed = Math.hypot(state.vx, state.vy) * config.speedIncreaseOnHit
      state.vx = Math.cos(angle) * reboundSpeed
      state.vy = Math.sin(angle) * reboundSpeed
      handlePaddleReturn('right')
      radius = getBallRadius()
    }

    updateBallTrails()

    // Score
    if (state.ballX < -radius) {
      state.rightScore++
      if (state.rightScore >= WIN_SCORE) state.winner = 'right'
      clearDivotWells()
      resetBall(false)
      handlePointScored()
      radius = getBallRadius()
    }
    if (state.ballX > W + radius) {
      state.leftScore++
      if (state.leftScore >= WIN_SCORE) state.winner = 'left'
      clearDivotWells()
      resetBall(true)
      handlePointScored()
    }
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

  function handlePaddleReturn(side: 'left' | 'right') {
    lastReturner = side
    registerPipReturn()
    resetBallSize()
    spawnDivotWell()
    applyChillyShrink(side)
  }

  function clearDivotWells() {
    if (divotWells.length > 0) divotWells.length = 0
  }

  function handlePointScored() {
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
      const { startingHeight } = getChillySettings(chilly)
      setPaddleHeight('left', startingHeight, options)
      setPaddleHeight('right', startingHeight, options)
      previousChillyEnabled = true
    } else {
      setPaddleHeight('left', BASE_PADDLE_H, options)
      setPaddleHeight('right', BASE_PADDLE_H, options)
      previousChillyEnabled = false
    }
    clampPaddlePosition('left')
    clampPaddlePosition('right')
  }

  function updatePaddleModifierState() {
    const modifier = config.modifiers.paddle.chilly
    if (modifier.enabled) {
      const settings = getChillySettings(modifier)
      if (!previousChillyEnabled) {
        setPaddleHeight('left', settings.startingHeight, { preserveCenter: true })
        setPaddleHeight('right', settings.startingHeight, { preserveCenter: true })
      } else {
        const clampedLeft = clamp(leftPaddleHeight, settings.minimumHeight, settings.startingHeight)
        const clampedRight = clamp(rightPaddleHeight, settings.minimumHeight, settings.startingHeight)
        if (clampedLeft !== leftPaddleHeight) {
          setPaddleHeight('left', clampedLeft, { preserveCenter: true })
        }
        if (clampedRight !== rightPaddleHeight) {
          setPaddleHeight('right', clampedRight, { preserveCenter: true })
        }
      }
      previousChillyEnabled = true
    } else {
      if (previousChillyEnabled || leftPaddleHeight !== BASE_PADDLE_H) {
        setPaddleHeight('left', BASE_PADDLE_H, { preserveCenter: true })
      }
      if (previousChillyEnabled || rightPaddleHeight !== BASE_PADDLE_H) {
        setPaddleHeight('right', BASE_PADDLE_H, { preserveCenter: true })
      }
      previousChillyEnabled = false
    }

    clampPaddlePosition('left')
    clampPaddlePosition('right')
    state.leftPaddleHeight = leftPaddleHeight
    state.rightPaddleHeight = rightPaddleHeight
  }

  function applyChillyShrink(side: 'left' | 'right') {
    const modifier = config.modifiers.paddle.chilly
    if (!modifier.enabled) return
    const { shrinkAmount, minimumHeight } = getChillySettings(modifier)
    if (shrinkAmount <= 0) return

    const currentHeight = side === 'left' ? leftPaddleHeight : rightPaddleHeight
    const nextHeight = Math.max(minimumHeight, currentHeight - shrinkAmount)
    if (nextHeight === currentHeight) return

    setPaddleHeight(side, nextHeight, { preserveCenter: true })
    clampPaddlePosition(side)
    state.leftPaddleHeight = leftPaddleHeight
    state.rightPaddleHeight = rightPaddleHeight
  }

  function setPaddleHeight(
    side: 'left' | 'right',
    height: number,
    options: PaddleHeightOptions = {},
  ) {
    const { center = false, preserveCenter = true } = options
    const prevHeight = side === 'left' ? leftPaddleHeight : rightPaddleHeight

    if (side === 'left') {
      leftPaddleHeight = height
      state.leftPaddleHeight = height
    } else {
      rightPaddleHeight = height
      state.rightPaddleHeight = height
    }

    if (center) {
      const y = clamp(H * 0.5 - height / 2, 0, H - height)
      if (side === 'left') state.leftY = y
      else state.rightY = y
      return
    }

    if (preserveCenter) {
      const currentY = side === 'left' ? state.leftY : state.rightY
      const centerY = currentY + prevHeight / 2
      const newY = clamp(centerY - height / 2, 0, H - height)
      if (side === 'left') state.leftY = newY
      else state.rightY = newY
      return
    }

    clampPaddlePosition(side)
  }

  function clampPaddlePosition(side: 'left' | 'right') {
    const height = side === 'left' ? leftPaddleHeight : rightPaddleHeight
    if (side === 'left') {
      state.leftY = clamp(state.leftY, 0, H - height)
    } else {
      state.rightY = clamp(state.rightY, 0, H - height)
    }
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
      })
    }

    return wells
  }

  function getBallRadius() {
    return currentBallRadius
  }

  function resetBallSize() {
    ballTravelDistance = 0
    applyBallSizeModifiers(0)
  }

  function applyBallSizeModifiers(distanceDelta: number) {
    if (Number.isFinite(distanceDelta) && distanceDelta > 0) {
      ballTravelDistance += distanceDelta
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
      radius = clamp(minRadius + ballTravelDistance * growthRate, minRadius, maxRadius)
    }

    if (meteor.enabled) {
      const rawStart = Number.isFinite(meteor.startRadius) ? meteor.startRadius : BALL_R * 2
      const startRadius = clamp(rawStart, 2, 220)
      const rawMin = Number.isFinite(meteor.minRadius) ? meteor.minRadius : BALL_R * 0.75
      const minRadius = clamp(Math.min(rawMin, startRadius), 1, startRadius)
      const shrinkRate = Number.isFinite(meteor.shrinkRate)
        ? Math.max(0, meteor.shrinkRate)
        : 0
      radius = clamp(startRadius - ballTravelDistance * shrinkRate, minRadius, startRadius)
    }

    currentBallRadius = radius
    state.ballRadius = currentBallRadius
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
      const visuals = GRAVITY_WELL_VISUALS[well.key]
      const sinkGradient = ctx.createRadialGradient(
        well.x,
        well.y,
        0,
        well.x,
        well.y,
        well.radius,
      )
      sinkGradient.addColorStop(0, visuals.inner)
      sinkGradient.addColorStop(0.45, visuals.mid)
      sinkGradient.addColorStop(1, visuals.outer)
      ctx.fillStyle = sinkGradient
      ctx.beginPath()
      ctx.arc(well.x, well.y, well.radius, 0, Math.PI * 2)
      ctx.fill()
    }

    drawBallTrails()

    ctx.fillStyle = BALL_COLOR
    ctx.fillRect(40, state.leftY, PADDLE_W, state.leftPaddleHeight)
    ctx.fillRect(W - 40 - PADDLE_W, state.rightY, PADDLE_W, state.rightPaddleHeight)

    const ballRadius = getBallRadius()
    ctx.beginPath()
    ctx.arc(state.ballX, state.ballY, ballRadius, 0, Math.PI * 2)
    ctx.fill()

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
