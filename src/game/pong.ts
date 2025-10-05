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

type KeySet = Record<string, boolean>

export function createPong(canvas: HTMLCanvasElement): PongAPI {
  const ctx = canvas.getContext('2d')!
  const W = canvas.width
  const H = canvas.height
  const PADDLE_H = 90
  const PADDLE_W = 12
  const BALL_R = 8
  const SPEED = 310
  const BALL_SPEED = 320
  const MIN_HORIZONTAL_SPEED = BALL_SPEED * 0.35
  const GRAVITY_STRENGTH = 4800000
  const GRAVITY_FALLOFF = 12000
  const WIN_SCORE = 11

  const keys: KeySet = {}
  window.addEventListener('keydown', e => (keys[e.key] = true))
  window.addEventListener('keyup', e => (keys[e.key] = false))

  const state: PongState = {
    leftScore: 0,
    rightScore: 0,
    ballX: W * 0.5,
    ballY: H * 0.5,
    vx: BALL_SPEED * (Math.random() < 0.5 ? -1 : 1),
    vy: (Math.random() * 2 - 1) * BALL_SPEED * 0.6,
    leftY: H * 0.5 - PADDLE_H / 2,
    rightY: H * 0.5 - PADDLE_H / 2,
    paused: false,
    winner: null
  }

  function resetBall(toLeft: boolean) {
    state.ballX = W * 0.5
    state.ballY = H * 0.5
    state.vx = BALL_SPEED * (toLeft ? -1 : 1)
    state.vy = (Math.random() * 2 - 1) * BALL_SPEED * 0.6
  }

  function reset() {
    state.leftScore = 0
    state.rightScore = 0
    state.leftY = H * 0.5 - PADDLE_H / 2
    state.rightY = H * 0.5 - PADDLE_H / 2
    state.winner = null
    resetBall(Math.random() < 0.5)
  }

  window.addEventListener('keypress', (e) => {
    if (e.key.toLowerCase() === 'r') reset()
  })

  let last = performance.now()
  function loop(now: number) {
    const dt = Math.min(1/30, (now - last) / 1000)
    last = now
    tick(dt)
    draw()
    requestAnimationFrame(loop)
  }
  requestAnimationFrame(loop)

  function tick(dt: number) {
    if (state.winner) return

    // Controls
    if (keys['w']) state.leftY -= SPEED * dt
    if (keys['s']) state.leftY += SPEED * dt
    if (keys['ArrowUp']) state.rightY -= SPEED * dt
    if (keys['ArrowDown']) state.rightY += SPEED * dt

    state.leftY = clamp(state.leftY, 0, H - PADDLE_H)
    state.rightY = clamp(state.rightY, 0, H - PADDLE_H)

    // Gravity sink pull
    const sinkX = W * 0.5
    const sinkY = H * 0.5
    const dx = sinkX - state.ballX
    const dy = sinkY - state.ballY
    const dist = Math.hypot(dx, dy) || 1
    const force = GRAVITY_STRENGTH / (dist * dist + GRAVITY_FALLOFF)
    const ax = (dx / dist) * force
    const ay = (dy / dist) * force
    const prevVx = state.vx
    state.vx += ax * dt
    state.vy += ay * dt

    if (prevVx !== 0) {
      const direction = Math.sign(prevVx)
      const minSpeed = MIN_HORIZONTAL_SPEED * direction
      if (state.vx * direction < MIN_HORIZONTAL_SPEED) {
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
    if (state.ballX - BALL_R < 40 + PADDLE_W &&
        state.ballX - BALL_R > 40 &&
        state.ballY > state.leftY &&
        state.ballY < state.leftY + PADDLE_H) {
      state.ballX = 40 + PADDLE_W + BALL_R
      const rel = (state.ballY - (state.leftY + PADDLE_H/2)) / (PADDLE_H/2)
      const angle = rel * 0.8
      const speed = Math.hypot(state.vx, state.vy) * 1.03
      state.vx = Math.cos(angle) * speed
      state.vy = Math.sin(angle) * speed
    }

    // Right paddle collision
    if (state.ballX + BALL_R > W - 40 - PADDLE_W &&
        state.ballX + BALL_R < W - 40 &&
        state.ballY > state.rightY &&
        state.ballY < state.rightY + PADDLE_H) {
      state.ballX = W - 40 - PADDLE_W - BALL_R
      const rel = (state.ballY - (state.rightY + PADDLE_H/2)) / (PADDLE_H/2)
      const angle = Math.PI - rel * 0.8
      const speed = Math.hypot(state.vx, state.vy) * 1.03
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

  function draw() {
    ctx.fillStyle = '#10172a'
    ctx.fillRect(0, 0, W, H)

    ctx.strokeStyle = 'rgba(255,255,255,0.15)'
    ctx.setLineDash([6, 10])
    ctx.beginPath()
    ctx.moveTo(W/2, 0)
    ctx.lineTo(W/2, H)
    ctx.stroke()
    ctx.setLineDash([])

    const sinkGradient = ctx.createRadialGradient(W/2, H/2, 0, W/2, H/2, 40)
    sinkGradient.addColorStop(0, 'rgba(148, 163, 184, 0.75)')
    sinkGradient.addColorStop(0.45, 'rgba(148, 163, 184, 0.35)')
    sinkGradient.addColorStop(1, 'rgba(15, 23, 42, 0)')
    ctx.fillStyle = sinkGradient
    ctx.beginPath()
    ctx.arc(W/2, H/2, 40, 0, Math.PI * 2)
    ctx.fill()

    ctx.fillStyle = '#e7ecf3'
    ctx.fillRect(40, state.leftY, PADDLE_W, PADDLE_H)
    ctx.fillRect(W - 40 - PADDLE_W, state.rightY, PADDLE_W, PADDLE_H)

    ctx.beginPath()
    ctx.arc(state.ballX, state.ballY, BALL_R, 0, Math.PI * 2)
    ctx.fill()

    ctx.font = 'bold 28px ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto'
    ctx.textAlign = 'center'
    ctx.fillText(String(state.leftScore), W/2 - 60, 40)
    ctx.fillText(String(state.rightScore), W/2 + 60, 40)

    if (state.winner) {
      ctx.font = 'bold 36px ui-sans-serif, system-ui'
      ctx.fillText(`${state.winner.toUpperCase()} WINS!`, W/2, H/2)
    }
  }

  function clamp(v: number, a: number, b: number) {
    return Math.max(a, Math.min(b, v))
  }

  return { state, reset, tick }
}
