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
  vx: number
  vy: number
  leftY: number
  rightY: number
  paused: boolean
  winner: 'left' | 'right' | null
  currentPips: number
  totalPips: number
  totalBites: number
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
  const PADDLE_H = 90
  const PADDLE_W = 12
  const BALL_R = 8
  const WIN_SCORE = 11
  const PIPS_PER_BITE = 8
  const ARENA_BACKGROUND = '#10172a'
  const ANNOUNCEMENT_COLOR = '#203275'

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
    vx: config.baseBallSpeed * (Math.random() < 0.5 ? -1 : 1),
    vy: (Math.random() * 2 - 1) * config.baseBallSpeed * 0.6,
    leftY: H * 0.5 - PADDLE_H / 2,
    rightY: H * 0.5 - PADDLE_H / 2,
    paused: false,
    winner: null,
    currentPips: 0,
    totalPips: 0,
    totalBites: 0,
  }

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

  initializeActiveModState()

  function resetBall(toLeft: boolean) {
    state.ballX = W * 0.5
    state.ballY = H * 0.5
    state.vx = config.baseBallSpeed * (toLeft ? -1 : 1)
    state.vy = (Math.random() * 2 - 1) * config.baseBallSpeed * 0.6
  }

  function reset() {
    state.leftScore = 0
    state.rightScore = 0
    state.leftY = H * 0.5 - PADDLE_H / 2
    state.rightY = H * 0.5 - PADDLE_H / 2
    state.winner = null
    state.currentPips = 0
    state.totalPips = 0
    state.totalBites = 0
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

    if (state.winner) return

    updateMovingWellState('blackMole', dt)
    updateMovingWellState('gopher', dt)
    updateDivotsState()
    updateIrelandState()

    // Controls
    if (leftAIEnabled) {
      const target = state.ballY - PADDLE_H / 2
      const diff = target - state.leftY
      const maxStep = config.paddleSpeed * dt
      state.leftY += clamp(diff, -maxStep, maxStep)
    } else {
      if (keys['w']) state.leftY -= config.paddleSpeed * dt
      if (keys['s']) state.leftY += config.paddleSpeed * dt
    }

    if (rightAIEnabled) {
      const target = state.ballY - PADDLE_H / 2
      const diff = target - state.rightY
      const maxStep = config.paddleSpeed * dt
      state.rightY += clamp(diff, -maxStep, maxStep)
    } else {
      if (keys['ArrowUp']) state.rightY -= config.paddleSpeed * dt
      if (keys['ArrowDown']) state.rightY += config.paddleSpeed * dt
    }

    state.leftY = clamp(state.leftY, 0, H - PADDLE_H)
    state.rightY = clamp(state.rightY, 0, H - PADDLE_H)

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

    // Move ball
    state.ballX += state.vx * dt
    state.ballY += state.vy * dt

    // Top/Bottom bounce
    if (state.ballY < BALL_R) {
      state.ballY = BALL_R
      state.vy *= -1
    }
    if (state.ballY > H - BALL_R) {
      state.ballY = H - BALL_R
      state.vy *= -1
    }

    // Left paddle collision
    if (
      state.ballX - BALL_R < 40 + PADDLE_W &&
      state.ballX - BALL_R > 40 &&
      state.ballY > state.leftY &&
      state.ballY < state.leftY + PADDLE_H
    ) {
      state.ballX = 40 + PADDLE_W + BALL_R
      const rel = (state.ballY - (state.leftY + PADDLE_H / 2)) / (PADDLE_H / 2)
      const angle = rel * 0.8
      const speed = Math.hypot(state.vx, state.vy) * config.speedIncreaseOnHit
      state.vx = Math.cos(angle) * speed
      state.vy = Math.sin(angle) * speed
      handlePaddleReturn()
    }

    // Right paddle collision
    if (
      state.ballX + BALL_R > W - 40 - PADDLE_W &&
      state.ballX + BALL_R < W - 40 &&
      state.ballY > state.rightY &&
      state.ballY < state.rightY + PADDLE_H
    ) {
      state.ballX = W - 40 - PADDLE_W - BALL_R
      const rel = (state.ballY - (state.rightY + PADDLE_H / 2)) / (PADDLE_H / 2)
      const angle = Math.PI - rel * 0.8
      const speed = Math.hypot(state.vx, state.vy) * config.speedIncreaseOnHit
      state.vx = Math.cos(angle) * speed
      state.vy = Math.sin(angle) * speed
      handlePaddleReturn()
    }

    // Score
    if (state.ballX < -BALL_R) {
      state.rightScore++
      if (state.rightScore >= WIN_SCORE) state.winner = 'right'
      clearDivotWells()
      resetBall(false)
      handlePointScored()
    }
    if (state.ballX > W + BALL_R) {
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

  function handlePaddleReturn() {
    registerPipReturn()
    spawnDivotWell()
  }

  function clearDivotWells() {
    if (divotWells.length > 0) divotWells.length = 0
  }

  function handlePointScored() {
    irelandNeedsRegeneration = true

    const modifier = config.modifiers.arena.ireland as IrelandModifier
    if (!modifier.enabled) {
      irelandWells.length = 0
      return
    }

    regenerateIrelandWells(modifier)
    irelandNeedsRegeneration = false
    activeGravityWells = collectActiveGravityWells()
  }

  function registerPipReturn() {
    state.totalPips += 1
    state.currentPips = ((state.totalPips - 1) % PIPS_PER_BITE) + 1
    state.totalBites = Math.floor(state.totalPips / PIPS_PER_BITE)

    if (state.currentPips === PIPS_PER_BITE) {
      state.currentPips = 0
      cycleRandomMod()
    }
  }

  function cycleRandomMod() {
    const nextKey = pickRandomMod(activeModKey)
    setActiveMod(nextKey)
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

    ctx.fillStyle = '#e7ecf3'
    ctx.fillRect(40, state.leftY, PADDLE_W, PADDLE_H)
    ctx.fillRect(W - 40 - PADDLE_W, state.rightY, PADDLE_W, PADDLE_H)

    ctx.beginPath()
    ctx.arc(state.ballX, state.ballY, BALL_R, 0, Math.PI * 2)
    ctx.fill()

    const pipRadius = 6
    const pipSpacing = 22
    const pipY = H - 24
    const pipStartX = W / 2 - ((PIPS_PER_BITE - 1) * pipSpacing) / 2
    ctx.lineWidth = 2
    for (let i = 0; i < PIPS_PER_BITE; i++) {
      const pipX = pipStartX + i * pipSpacing
      const isFilled = state.currentPips > 0 && i < state.currentPips
      ctx.beginPath()
      ctx.arc(pipX, pipY, pipRadius, 0, Math.PI * 2)
      if (isFilled) {
        ctx.fillStyle = '#e7ecf3'
        ctx.fill()
      } else {
        ctx.strokeStyle = 'rgba(231,236,243,0.35)'
        ctx.stroke()
      }
    }
    ctx.lineWidth = 1

    ctx.fillStyle = '#e7ecf3'
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
