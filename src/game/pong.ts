import {
  GRAVITY_WELL_KEYS,
  GRAVITY_WELL_VISUALS,
  createDevConfig,
  deepClone,
  getGravityWellsEntries,
  type ArenaModifiers,
  type DevConfig,
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

export function createPong(
  canvas: HTMLCanvasElement,
  options: PongOptions = {},
): PongAPI {
  const context = canvas.getContext('2d')
  if (!context) throw new Error('Canvas 2D context is required')
  const ctx = context

  const { autoStart = true } = options
  const W = canvas.width
  const H = canvas.height
  const PADDLE_H = 90
  const PADDLE_W = 12
  const BALL_R = 8
  const WIN_SCORE = 11

  const defaults = createDevConfig()
  const config = deepClone(defaults)
  const overlay = createDevOverlay(config, defaults)
  canvas.parentElement?.appendChild(overlay)

  const keys: KeySet = {}
  let leftAIEnabled = true
  let rightAIEnabled = true

  if (typeof window !== 'undefined') {
    window.addEventListener('keydown', (e) => {
      if (e.key === '`' && !e.repeat) {
        toggleOverlay(overlay)
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
  }

  const blackMoleState: MovingWellState = {
    x: W * 0.5,
    y: H * 0.5,
    targetX: W * 0.5,
    targetY: H * 0.5,
    pauseTimer: 0,
    hasTarget: false,
  }

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
    leftAIEnabled = true
    rightAIEnabled = true
    resetBall(Math.random() < 0.5)
  }

  if (typeof window !== 'undefined') {
    window.addEventListener('keypress', (e) => {
      if (e.key.toLowerCase() === 'r') reset()
    })
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
    if (state.winner) return

    updateBlackMoleState(dt)

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

    // Gravity sink pull
    const prevVx = state.vx
    for (const [key, well] of getGravityWellsEntries(config.modifiers.arena)) {
      if (!well.enabled) continue
      const { x: sinkX, y: sinkY } = resolveGravityWellPosition(key)
      const dx = sinkX - state.ballX
      const dy = sinkY - state.ballY
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
    }

    // Score
    if (state.ballX < -BALL_R) {
      state.rightScore++
      if (state.rightScore >= WIN_SCORE) state.winner = 'right'
      resetBall(false)
    }
    if (state.ballX > W + BALL_R) {
      state.leftScore++
      if (state.leftScore >= WIN_SCORE) state.winner = 'left'
      resetBall(true)
    }
  }

  function resolveGravityWellPosition(key: GravityWellKey) {
    if (key === 'blackMole') {
      return { x: blackMoleState.x, y: blackMoleState.y }
    }

    return { x: W * 0.5, y: H * 0.5 }
  }

  function updateBlackMoleState(dt: number) {
    const modifier = config.modifiers.arena.blackMole
    if (!modifier.enabled) {
      if (!blackMoleState.hasTarget) return
      blackMoleState.x = W * 0.5
      blackMoleState.y = H * 0.5
      blackMoleState.targetX = W * 0.5
      blackMoleState.targetY = H * 0.5
      blackMoleState.pauseTimer = 0
      blackMoleState.hasTarget = false
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

    blackMoleState.x = clamp(blackMoleState.x, minX, maxX)
    blackMoleState.y = clamp(blackMoleState.y, minY, maxY)
    blackMoleState.targetX = clamp(blackMoleState.targetX, minX, maxX)
    blackMoleState.targetY = clamp(blackMoleState.targetY, minY, maxY)

    const pickNextTarget = () => {
      blackMoleState.targetX = randomRange(minX, maxX)
      blackMoleState.targetY = randomRange(minY, maxY)
      blackMoleState.hasTarget = true
    }

    if (!blackMoleState.hasTarget) {
      pickNextTarget()
    }

    if (blackMoleState.pauseTimer > 0) {
      blackMoleState.pauseTimer = Math.max(0, blackMoleState.pauseTimer - dt)
      if (blackMoleState.pauseTimer === 0) {
        pickNextTarget()
      }
      return
    }

    const dx = blackMoleState.targetX - blackMoleState.x
    const dy = blackMoleState.targetY - blackMoleState.y
    const dist = Math.hypot(dx, dy)
    if (dist === 0) {
      blackMoleState.pauseTimer = pauseDuration
      return
    }

    const step = wanderSpeed * dt
    if (dist <= step) {
      blackMoleState.x = blackMoleState.targetX
      blackMoleState.y = blackMoleState.targetY
      blackMoleState.pauseTimer = pauseDuration
      return
    }

    const invDist = 1 / dist
    blackMoleState.x += dx * invDist * step
    blackMoleState.y += dy * invDist * step
  }

  function draw() {
    ctx.fillStyle = '#10172a'
    ctx.fillRect(0, 0, W, H)

    ctx.strokeStyle = 'rgba(255,255,255,0.15)'
    ctx.setLineDash([6, 10])
    ctx.beginPath()
    ctx.moveTo(W / 2, 0)
    ctx.lineTo(W / 2, H)
    ctx.stroke()
    ctx.setLineDash([])

    for (const [key, well] of getGravityWellsEntries(config.modifiers.arena)) {
      if (!well.enabled) continue
      const visuals = GRAVITY_WELL_VISUALS[key]
      const { x: sinkX, y: sinkY } = resolveGravityWellPosition(key)
      const sinkGradient = ctx.createRadialGradient(
        sinkX,
        sinkY,
        0,
        sinkX,
        sinkY,
        well.radius,
      )
      sinkGradient.addColorStop(0, visuals.inner)
      sinkGradient.addColorStop(0.45, visuals.mid)
      sinkGradient.addColorStop(1, visuals.outer)
      ctx.fillStyle = sinkGradient
      ctx.beginPath()
      ctx.arc(sinkX, sinkY, well.radius, 0, Math.PI * 2)
      ctx.fill()
    }

    ctx.fillStyle = '#e7ecf3'
    ctx.fillRect(40, state.leftY, PADDLE_W, PADDLE_H)
    ctx.fillRect(W - 40 - PADDLE_W, state.rightY, PADDLE_W, PADDLE_H)

    ctx.beginPath()
    ctx.arc(state.ballX, state.ballY, BALL_R, 0, Math.PI * 2)
    ctx.fill()

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

  function randomRange(min: number, max: number) {
    return Math.random() * (max - min) + min
  }

  function clamp(v: number, a: number, b: number) {
    return Math.max(a, Math.min(b, v))
  }

  return { state, reset, tick }
}
