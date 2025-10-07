import type { SystemFn } from '../../engine/scheduler'
import type { PongState } from '../pong'

export interface ActiveGravityWell {
  key: string
  x: number
  y: number
  gravityStrength: number
  gravityFalloff: number
  radius: number
  positiveTint: string
  negativeTint: string
}

export interface BallPhysicsConfig {
  baseBallSpeed(): number
  minHorizontalRatio(): number
  speedIncreaseOnHit(): number
  winScore(): number
}

export interface BallSystemContext {
  state: PongState
  width: number
  height: number
  paddleWidth: number
  getLeftPaddleHeight(): number
  getRightPaddleHeight(): number
  clamp(value: number, min: number, max: number): number
  getBallRadius(): number
  applyBallSizeModifiers(distance: number): void
  collectActiveGravityWells(): ActiveGravityWell[]
  setActiveGravityWells(wells: ActiveGravityWell[]): void
  config: BallPhysicsConfig
  handlePaddleReturn(side: 'left' | 'right'): void
  updateBallTrails(): void
  clearDivotWells(): void
  resetBall(toLeft: boolean): void
  handlePointScored(): void
}

export function createBallSystem(ctx: BallSystemContext): SystemFn {
  return (dt) => {
    const wells = ctx.collectActiveGravityWells()
    ctx.setActiveGravityWells(wells)

    const prevVx = ctx.state.vx
    for (const well of wells) {
      const dx = well.x - ctx.state.ballX
      const dy = well.y - ctx.state.ballY
      const distSq = dx * dx + dy * dy
      const dist = Math.sqrt(distSq) || 1
      const force = well.gravityStrength / (distSq + well.gravityFalloff)
      const ax = (dx / dist) * force
      const ay = (dy / dist) * force
      ctx.state.vx += ax * dt
      ctx.state.vy += ay * dt
    }

    if (prevVx !== 0) {
      const direction = Math.sign(prevVx)
      const minHorizontalSpeed = ctx.config.baseBallSpeed() * ctx.config.minHorizontalRatio()
      const minSpeed = minHorizontalSpeed * direction
      if (ctx.state.vx * direction < minHorizontalSpeed) {
        ctx.state.vx = minSpeed
      }
    }

    const speed = Math.hypot(ctx.state.vx, ctx.state.vy)

    ctx.state.ballX += ctx.state.vx * dt
    ctx.state.ballY += ctx.state.vy * dt

    ctx.applyBallSizeModifiers(speed * dt)

    let radius = ctx.getBallRadius()

    if (ctx.state.ballY < radius) {
      ctx.state.ballY = radius
      ctx.state.vy *= -1
    }
    if (ctx.state.ballY > ctx.height - radius) {
      ctx.state.ballY = ctx.height - radius
      ctx.state.vy *= -1
    }

    const leftHeight = ctx.getLeftPaddleHeight()
    if (
      ctx.state.ballX - radius < 40 + ctx.paddleWidth &&
      ctx.state.ballX - radius > 40 &&
      ctx.state.ballY > ctx.state.leftY &&
      ctx.state.ballY < ctx.state.leftY + leftHeight
    ) {
      ctx.state.ballX = 40 + ctx.paddleWidth + radius
      const rel =
        (ctx.state.ballY - (ctx.state.leftY + leftHeight / 2)) /
        (leftHeight / 2)
      const angle = rel * 0.8
      const reboundSpeed = Math.hypot(ctx.state.vx, ctx.state.vy) * ctx.config.speedIncreaseOnHit()
      ctx.state.vx = Math.cos(angle) * reboundSpeed
      ctx.state.vy = Math.sin(angle) * reboundSpeed
      ctx.handlePaddleReturn('left')
      radius = ctx.getBallRadius()
    }

    const rightHeight = ctx.getRightPaddleHeight()
    if (
      ctx.state.ballX + radius > ctx.width - 40 - ctx.paddleWidth &&
      ctx.state.ballX + radius < ctx.width - 40 &&
      ctx.state.ballY > ctx.state.rightY &&
      ctx.state.ballY < ctx.state.rightY + rightHeight
    ) {
      ctx.state.ballX = ctx.width - 40 - ctx.paddleWidth - radius
      const rel =
        (ctx.state.ballY - (ctx.state.rightY + rightHeight / 2)) /
        (rightHeight / 2)
      const angle = Math.PI - rel * 0.8
      const reboundSpeed = Math.hypot(ctx.state.vx, ctx.state.vy) * ctx.config.speedIncreaseOnHit()
      ctx.state.vx = Math.cos(angle) * reboundSpeed
      ctx.state.vy = Math.sin(angle) * reboundSpeed
      ctx.handlePaddleReturn('right')
      radius = ctx.getBallRadius()
    }

    ctx.updateBallTrails()

    if (ctx.state.ballX < -radius) {
      ctx.state.rightScore += 1
      if (ctx.state.rightScore >= ctx.config.winScore()) {
        ctx.state.winner = 'right'
      }
      ctx.clearDivotWells()
      ctx.resetBall(false)
      ctx.handlePointScored()
      radius = ctx.getBallRadius()
    }

    if (ctx.state.ballX > ctx.width + radius) {
      ctx.state.leftScore += 1
      if (ctx.state.leftScore >= ctx.config.winScore()) {
        ctx.state.winner = 'left'
      }
      ctx.clearDivotWells()
      ctx.resetBall(true)
      ctx.handlePointScored()
    }
  }
}
