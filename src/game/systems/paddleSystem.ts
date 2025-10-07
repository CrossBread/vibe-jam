import type { SystemFn } from '../../engine/scheduler'
import type { PongState } from '../pong'

export interface GamepadInput {
  leftAxis: number
  leftUp: boolean
  leftDown: boolean
  rightAxis: number
  rightUp: boolean
  rightDown: boolean
}

export interface PaddleSystemContext {
  state: PongState
  config: { paddleSpeed: number }
  aiState: { left: boolean; right: boolean }
  keys: Record<string, boolean>
  touchControls: Record<'left' | 'right', { direction: number; relativeDelta: number }>
  getPaddleSpeedMultiplier(side: 'left' | 'right'): number
  getPaddleHeight(side: 'left' | 'right'): number
  arenaHeight: number
  clamp(value: number, min: number, max: number): number
  getGamepadInput(): GamepadInput
}

function updateAiControlledPaddle(
  state: PongState,
  side: 'left' | 'right',
  ballY: number,
  paddleHeight: number,
  paddleSpeed: number,
  dt: number,
  clamp: PaddleSystemContext['clamp'],
) {
  const center = side === 'left' ? state.leftY : state.rightY
  const target = ballY - paddleHeight / 2
  const diff = target - center
  const maxStep = paddleSpeed * dt
  const next = center + clamp(diff, -maxStep, maxStep)
  if (side === 'left') {
    state.leftY = next
  } else {
    state.rightY = next
  }
}

function updateManualPaddle(
  state: PongState,
  side: 'left' | 'right',
  baseSpeed: number,
  dt: number,
  keys: Record<string, boolean>,
  touchControls: PaddleSystemContext['touchControls'],
  input: GamepadInput,
  clamp: PaddleSystemContext['clamp'],
) {
  const keyDirection =
    (side === 'left'
      ? (keys['w'] ? -1 : 0) + (keys['s'] ? 1 : 0)
      : (keys['ArrowUp'] ? -1 : 0) + (keys['ArrowDown'] ? 1 : 0))

  let gamePadDirection = 0
  if (side === 'left') {
    if (input.leftAxis) gamePadDirection += input.leftAxis * baseSpeed * dt
    if (input.leftUp) gamePadDirection -= baseSpeed * dt
    if (input.leftDown) gamePadDirection += baseSpeed * dt
  } else {
    if (input.rightAxis) gamePadDirection += input.rightAxis * baseSpeed * dt
    if (input.rightUp) gamePadDirection -= baseSpeed * dt
    if (input.rightDown) gamePadDirection += baseSpeed * dt
  }

  const control = touchControls[side]
  const totalDirection = clamp(
    keyDirection + control.direction + gamePadDirection,
    -1,
    1,
  )

  if (side === 'left') {
    state.leftY += totalDirection * baseSpeed * dt
    if (control.relativeDelta !== 0) {
      state.leftY += control.relativeDelta
      control.relativeDelta = 0
    }
  } else {
    state.rightY += totalDirection * baseSpeed * dt
    if (control.relativeDelta !== 0) {
      state.rightY += control.relativeDelta
      control.relativeDelta = 0
    }
  }
}

export function createPaddleSystem(ctx: PaddleSystemContext): SystemFn {
  return (dt) => {
    const input = ctx.getGamepadInput()

    const leftGamepadActive = input.leftAxis !== 0 || input.leftUp || input.leftDown
    const rightGamepadActive = input.rightAxis !== 0 || input.rightUp || input.rightDown

    if (leftGamepadActive) ctx.aiState.left = false
    if (rightGamepadActive) ctx.aiState.right = false

    const leftHeight = ctx.getPaddleHeight('left')
    const rightHeight = ctx.getPaddleHeight('right')
    const leftSpeed = ctx.config.paddleSpeed * ctx.getPaddleSpeedMultiplier('left')
    const rightSpeed = ctx.config.paddleSpeed * ctx.getPaddleSpeedMultiplier('right')

    if (ctx.aiState.left) {
      updateAiControlledPaddle(
        ctx.state,
        'left',
        ctx.state.ballY,
        leftHeight,
        leftSpeed,
        dt,
        ctx.clamp,
      )
    } else {
      updateManualPaddle(
        ctx.state,
        'left',
        ctx.config.paddleSpeed,
        dt,
        ctx.keys,
        ctx.touchControls,
        input,
        ctx.clamp,
      )
    }

    if (ctx.aiState.right) {
      updateAiControlledPaddle(
        ctx.state,
        'right',
        ctx.state.ballY,
        rightHeight,
        rightSpeed,
        dt,
        ctx.clamp,
      )
    } else {
      updateManualPaddle(
        ctx.state,
        'right',
        ctx.config.paddleSpeed,
        dt,
        ctx.keys,
        ctx.touchControls,
        input,
        ctx.clamp,
      )
    }

    ctx.state.leftY = ctx.clamp(ctx.state.leftY, 0, ctx.arenaHeight - leftHeight)
    ctx.state.rightY = ctx.clamp(ctx.state.rightY, 0, ctx.arenaHeight - rightHeight)
  }
}
