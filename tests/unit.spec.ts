/*
 * Copyright (c) 2025. CrossBread Tech All rights reserved.
 */

import { createPong } from '../src/game/pong'
import { describe, it, expect, vi } from 'vitest'

describe('Pong core', () => {
  function createTestGame() {
    const canvas = Object.assign(document.createElement('canvas'), { width: 800, height: 480 })
    const gradient = { addColorStop: vi.fn() }
    const ctx = {
      fillStyle: '',
      strokeStyle: '',
      font: '',
      textAlign: '',
      fillRect: vi.fn(),
      setLineDash: vi.fn(),
      beginPath: vi.fn(),
      moveTo: vi.fn(),
      lineTo: vi.fn(),
      stroke: vi.fn(),
      createRadialGradient: vi.fn(() => gradient),
      arc: vi.fn(),
      fill: vi.fn(),
      fillText: vi.fn(),
      save: vi.fn(),
      restore: vi.fn(),
    }
    canvas.getContext = vi.fn().mockReturnValue(ctx) as any

    const game = createPong(canvas, {
      autoStart: false,
      serveCountdownDuration: 0,
      modRevealDelay: 0,
    })

    return { canvas, ctx, game }
  }

  it('increments left score when ball exits right edge', () => {
    const { canvas, game } = createTestGame()
    const primaryBall = game.state.balls[0]
    expect(primaryBall).toBeDefined()
    const ball = primaryBall!

    const exitMargin = ball.radius + 5
    game.state.ballX = canvas.width + exitMargin
    game.state.vx = 0

    const before = game.state.leftScore
    game.tick(0.016)
    expect(game.state.leftScore).toBe(before + 1)
  })

  it('only awards a point when the final real ball exits a goal zone', () => {
    const { canvas, game } = createTestGame()
    const primaryBall = game.state.balls[0]
    expect(primaryBall).toBeDefined()
    const ball = primaryBall!

    const exitMargin = ball.radius + 5
    game.state.ballX = canvas.width + exitMargin
    game.state.vx = 0

    game.state.balls.push({
      x: -exitMargin,
      y: canvas.height * 0.5,
      vx: 0,
      vy: 0,
      radius: ball.radius,
      travelDistance: 0,
      isReal: true,
      opacity: 1,
      lastPaddleHit: null,
      portalCooldown: 0,
    })

    const startingLeft = game.state.leftScore
    const startingRight = game.state.rightScore

    game.tick(0.016)

    expect(game.state.leftScore).toBe(startingLeft)
    expect(game.state.rightScore).toBe(startingRight + 1)
  })

  it('reflects a ball that grazes the top edge of the right paddle', () => {
    const { canvas, game } = createTestGame()
    const primaryBall = game.state.balls[0]
    expect(primaryBall).toBeDefined()
    const ball = primaryBall!

    const paddleX = canvas.width - 40 - 12
    const paddleTop = game.state.rightY
    const epsilon = 0.5

    ball.x = paddleX - ball.radius - 1
    ball.y = paddleTop - ball.radius + epsilon
    ball.vx = Math.max(150, Math.abs(ball.vx))
    ball.vy = 0
    game.state.ballX = ball.x
    game.state.ballY = ball.y
    game.state.vx = ball.vx
    game.state.vy = ball.vy

    expect(ball.y).toBeLessThanOrEqual(paddleTop)

    game.tick(0.016)

    expect(ball.vx).toBeLessThan(0)
    expect(game.state.vx).toBeLessThan(0)
  })
})
