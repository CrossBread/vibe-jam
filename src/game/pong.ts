import defaultDevConfig from './devConfig.json'

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
    const sinkX = W * 0.5
    const sinkY = H * 0.5
    const dx = sinkX - state.ballX
    const dy = sinkY - state.ballY
    const dist = Math.hypot(dx, dy) || 1
    const prevVx = state.vx
    const blackHole = config.modifiers.arena.blackHole
    if (blackHole.enabled) {
      const force =
        blackHole.gravityStrength / (dist * dist + blackHole.gravityFalloff)
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

    if (config.modifiers.arena.blackHole.enabled) {
      const sinkGradient = ctx.createRadialGradient(
        W / 2,
        H / 2,
        0,
        W / 2,
        H / 2,
        40,
      )
      sinkGradient.addColorStop(0, 'rgba(148, 163, 184, 0.75)')
      sinkGradient.addColorStop(0.45, 'rgba(148, 163, 184, 0.35)')
      sinkGradient.addColorStop(1, 'rgba(15, 23, 42, 0)')
      ctx.fillStyle = sinkGradient
      ctx.beginPath()
      ctx.arc(W / 2, H / 2, 40, 0, Math.PI * 2)
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

  function clamp(v: number, a: number, b: number) {
    return Math.max(a, Math.min(b, v))
  }

  return { state, reset, tick }
}

interface ModifierBase {
  name: string
  description: string
  enabled: boolean
}

interface BlackHoleModifier extends ModifierBase {
  gravityStrength: number
  gravityFalloff: number
}

interface ArenaModifiers {
  blackHole: BlackHoleModifier
}

interface ModifiersConfig {
  arena: ArenaModifiers
  ball: Record<string, unknown>
  paddle: Record<string, unknown>
}

interface DevConfig {
  paddleSpeed: number
  baseBallSpeed: number
  minHorizontalRatio: number
  speedIncreaseOnHit: number
  modifiers: ModifiersConfig
}

const DEFAULT_DEV_CONFIG: DevConfig = defaultDevConfig as DevConfig

function createDevConfig(): DevConfig {
  return deepClone(DEFAULT_DEV_CONFIG)
}

function deepClone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value))
}

let devOverlayStylesInjected = false

function ensureDevOverlayStyles() {
  if (devOverlayStylesInjected) return
  const style = document.createElement('style')
  style.textContent = `
    .dev-overlay {
      position: fixed;
      top: 16px;
      right: 16px;
      width: 280px;
      padding: 16px;
      border-radius: 12px;
      background: rgba(15, 23, 42, 0.95);
      color: #e2e8f0;
      border: 1px solid rgba(148, 163, 184, 0.35);
      box-shadow: 0 12px 32px rgba(15, 23, 42, 0.45);
      font-family: 'Inter', ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
      font-size: 13px;
      line-height: 1.4;
      z-index: 9999;
      display: none;
      backdrop-filter: blur(10px);
    }
    .dev-overlay.dev-overlay--visible {
      display: block;
    }
    .dev-overlay__title {
      font-size: 14px;
      font-weight: 600;
      margin-bottom: 12px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 12px;
    }
    .dev-overlay__hint {
      color: rgba(226, 232, 240, 0.65);
      font-size: 11px;
      text-transform: uppercase;
      letter-spacing: 0.08em;
      white-space: nowrap;
    }
    .dev-overlay__controls {
      display: flex;
      flex-direction: column;
      gap: 10px;
    }
    .dev-overlay__control {
      display: flex;
      flex-direction: column;
      gap: 4px;
    }
    .dev-overlay__label {
      display: flex;
      align-items: center;
      justify-content: space-between;
      font-weight: 500;
      gap: 8px;
    }
    .dev-overlay__value {
      font-variant-numeric: tabular-nums;
      color: rgba(226, 232, 240, 0.85);
    }
    .dev-overlay__section {
      display: flex;
      flex-direction: column;
      gap: 10px;
      padding-top: 12px;
      margin-top: 12px;
      border-top: 1px solid rgba(148, 163, 184, 0.35);
    }
    .dev-overlay__section-title {
      font-size: 12px;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.08em;
      color: rgba(226, 232, 240, 0.7);
    }
    .dev-overlay__modifier {
      display: flex;
      flex-direction: column;
      gap: 8px;
      padding: 10px;
      border-radius: 10px;
      background: rgba(30, 41, 59, 0.6);
      border: 1px solid rgba(148, 163, 184, 0.2);
    }
    .dev-overlay__description {
      margin: 0;
      color: rgba(226, 232, 240, 0.65);
      font-size: 12px;
    }
    .dev-overlay__buttons {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
      margin-top: 16px;
    }
    .dev-overlay__button {
      padding: 6px 10px;
      border-radius: 6px;
      border: 1px solid rgba(56, 189, 248, 0.4);
      background: rgba(56, 189, 248, 0.12);
      color: #e0f2fe;
      font-weight: 500;
      font-size: 12px;
      cursor: pointer;
      transition: background 0.2s ease, border-color 0.2s ease;
    }
    .dev-overlay__button:hover {
      background: rgba(56, 189, 248, 0.22);
      border-color: rgba(56, 189, 248, 0.65);
    }
    .dev-overlay__status {
      margin-top: 8px;
      min-height: 16px;
      font-size: 11px;
      color: rgba(226, 232, 240, 0.65);
    }
    .dev-overlay__status--error {
      color: #fca5a5;
    }
    .dev-overlay input[type="range"] {
      width: 100%;
      accent-color: #38bdf8;
    }
    .dev-overlay input[type="checkbox"] {
      accent-color: #38bdf8;
    }
  `
  document.head.appendChild(style)
  devOverlayStylesInjected = true
}

function createDevOverlay(config: DevConfig, defaults: DevConfig): HTMLDivElement {
  ensureDevOverlayStyles()

  const overlay = document.createElement('div')
  overlay.className = 'dev-overlay'
  overlay.setAttribute('aria-hidden', 'true')

  const title = document.createElement('div')
  title.className = 'dev-overlay__title'
  title.textContent = 'Developer Options'

  const hint = document.createElement('span')
  hint.className = 'dev-overlay__hint'
  hint.textContent = 'Press ` to toggle'
  title.appendChild(hint)

  const controls = document.createElement('div')
  controls.className = 'dev-overlay__controls'

  const buttons = document.createElement('div')
  buttons.className = 'dev-overlay__buttons'

  const status = document.createElement('div')
  status.className = 'dev-overlay__status'

  function setStatus(message: string, variant: 'default' | 'error' = 'default') {
    status.textContent = message
    status.classList.toggle('dev-overlay__status--error', variant === 'error')
  }

  function renderControls() {
    controls.innerHTML = ''

    controls.appendChild(
      createSliderControl('Paddle Speed', config.paddleSpeed, {
        min: 100,
        max: 600,
        step: 10,
        format: v => `${Math.round(v)} px/s`,
        onInput: v => (config.paddleSpeed = v)
      })
    )

    controls.appendChild(
      createSliderControl('Ball Base Speed', config.baseBallSpeed, {
        min: 120,
        max: 600,
        step: 10,
        format: v => `${Math.round(v)} px/s`,
        onInput: v => (config.baseBallSpeed = v)
      })
    )

    controls.appendChild(
      createSliderControl('Min Horizontal Ratio', config.minHorizontalRatio, {
        min: 0.1,
        max: 1,
        step: 0.01,
        format: v => v.toFixed(2),
        onInput: v => (config.minHorizontalRatio = v)
      })
    )

    controls.appendChild(
      createSliderControl('Hit Speed Multiplier', config.speedIncreaseOnHit, {
        min: 1,
        max: 1.3,
        step: 0.01,
        format: v => v.toFixed(2) + '×',
        onInput: v => (config.speedIncreaseOnHit = v)
      })
    )

    const arenaSection = document.createElement('div')
    arenaSection.className = 'dev-overlay__section'

    const arenaTitle = document.createElement('div')
    arenaTitle.className = 'dev-overlay__section-title'
    arenaTitle.textContent = 'Arena Modifiers'
    arenaSection.appendChild(arenaTitle)

    const blackHole = config.modifiers.arena.blackHole
    const blackHoleWrapper = document.createElement('div')
    blackHoleWrapper.className = 'dev-overlay__modifier'

    const blackHoleHeader = document.createElement('div')
    blackHoleHeader.className = 'dev-overlay__label'

    const blackHoleTitle = document.createElement('span')
    blackHoleTitle.textContent = blackHole.name

    const blackHoleToggle = document.createElement('input')
    blackHoleToggle.type = 'checkbox'
    blackHoleToggle.checked = blackHole.enabled
    blackHoleToggle.addEventListener('change', () => {
      blackHole.enabled = blackHoleToggle.checked
    })

    blackHoleHeader.appendChild(blackHoleTitle)
    blackHoleHeader.appendChild(blackHoleToggle)
    blackHoleWrapper.appendChild(blackHoleHeader)

    const blackHoleDescription = document.createElement('p')
    blackHoleDescription.className = 'dev-overlay__description'
    blackHoleDescription.textContent = blackHole.description
    blackHoleWrapper.appendChild(blackHoleDescription)

    blackHoleWrapper.appendChild(
      createSliderControl('Gravity Strength', blackHole.gravityStrength, {
        min: 0,
        max: 8_000_000,
        step: 100_000,
        format: v => `${Math.round(v).toLocaleString()} ƒ`,
        onInput: v => (blackHole.gravityStrength = v)
      })
    )

    blackHoleWrapper.appendChild(
      createSliderControl('Gravity Falloff', blackHole.gravityFalloff, {
        min: 0,
        max: 30_000,
        step: 500,
        format: v => `${Math.round(v).toLocaleString()}`,
        onInput: v => (blackHole.gravityFalloff = v)
      })
    )

    arenaSection.appendChild(blackHoleWrapper)
    controls.appendChild(arenaSection)
  }

  renderControls()

  const copyButton = createOverlayButton('Copy Config JSON')
  copyButton.addEventListener('click', async () => {
    try {
      await navigator.clipboard.writeText(JSON.stringify(config, null, 2))
      setStatus('Config copied to clipboard.')
    } catch (error) {
      console.error(error)
      setStatus('Unable to copy config to clipboard.', 'error')
    }
  })

  const loadButton = createOverlayButton('Load from Clipboard')
  loadButton.addEventListener('click', async () => {
    try {
      const text = await navigator.clipboard.readText()
      const parsed = JSON.parse(text) as unknown
      if (!isDevConfig(parsed)) {
        setStatus('Clipboard contents are not a valid config.', 'error')
        return
      }
      applyConfig(config, parsed)
      renderControls()
      setStatus('Configuration loaded from clipboard.')
    } catch (error) {
      console.error(error)
      setStatus('Failed to load config from clipboard.', 'error')
    }
  })

  const resetButton = createOverlayButton('Reset to Defaults')
  resetButton.addEventListener('click', () => {
    applyConfig(config, defaults)
    renderControls()
    setStatus('Configuration reset to defaults.')
  })

  buttons.appendChild(copyButton)
  buttons.appendChild(loadButton)
  buttons.appendChild(resetButton)

  overlay.appendChild(title)
  overlay.appendChild(controls)
  overlay.appendChild(buttons)
  overlay.appendChild(status)

  return overlay
}

function applyConfig(target: DevConfig, source: DevConfig) {
  target.paddleSpeed = source.paddleSpeed
  target.baseBallSpeed = source.baseBallSpeed
  target.minHorizontalRatio = source.minHorizontalRatio
  target.speedIncreaseOnHit = source.speedIncreaseOnHit
  target.modifiers = deepClone(source.modifiers)
}

function isDevConfig(value: unknown): value is DevConfig {
  if (!value || typeof value !== 'object') return false
  const candidate = value as Partial<DevConfig>
  const arena = (candidate.modifiers as ModifiersConfig | undefined)?.arena
  const blackHole = arena?.blackHole as Partial<BlackHoleModifier> | undefined
  return (
    typeof candidate.paddleSpeed === 'number' &&
    typeof candidate.baseBallSpeed === 'number' &&
    typeof candidate.minHorizontalRatio === 'number' &&
    typeof candidate.speedIncreaseOnHit === 'number' &&
    !!arena &&
    !!blackHole &&
    typeof blackHole.name === 'string' &&
    typeof blackHole.description === 'string' &&
    typeof blackHole.enabled === 'boolean' &&
    typeof blackHole.gravityStrength === 'number' &&
    typeof blackHole.gravityFalloff === 'number'
  )
}

function createOverlayButton(label: string) {
  const button = document.createElement('button')
  button.type = 'button'
  button.className = 'dev-overlay__button'
  button.textContent = label
  return button
}

function toggleOverlay(overlay: HTMLDivElement) {
  const visible = overlay.classList.toggle('dev-overlay--visible')
  overlay.setAttribute('aria-hidden', visible ? 'false' : 'true')
}

interface SliderOptions {
  min: number
  max: number
  step: number
  format: (value: number) => string
  onInput: (value: number) => void
}

function createSliderControl(label: string, value: number, options: SliderOptions) {
  const wrapper = document.createElement('label')
  wrapper.className = 'dev-overlay__control'

  const title = document.createElement('div')
  title.className = 'dev-overlay__label'
  title.textContent = label

  const valueEl = document.createElement('span')
  valueEl.className = 'dev-overlay__value'
  valueEl.textContent = options.format(value)
  title.appendChild(valueEl)

  const input = document.createElement('input')
  input.type = 'range'
  input.min = String(options.min)
  input.max = String(options.max)
  input.step = String(options.step)
  input.value = String(value)

  input.addEventListener('input', () => {
    const next = Number(input.value)
    options.onInput(next)
    valueEl.textContent = options.format(next)
  })

  wrapper.appendChild(title)
  wrapper.appendChild(input)

  return wrapper
}

function createToggleControl(label: string, value: boolean, onInput: (value: boolean) => void) {
  const wrapper = document.createElement('label')
  wrapper.className = 'dev-overlay__control'

  const title = document.createElement('div')
  title.className = 'dev-overlay__label'
  title.textContent = label

  const checkbox = document.createElement('input')
  checkbox.type = 'checkbox'
  checkbox.checked = value

  checkbox.addEventListener('change', () => {
    onInput(checkbox.checked)
  })

  title.appendChild(checkbox)
  wrapper.appendChild(title)

  return wrapper
}
