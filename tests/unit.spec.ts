/*
 * Copyright (c) 2025. CrossBread Tech All rights reserved.
 */

import { createPong } from '../src/game/pong'
import devConfig from '../src/game/devConfig.json'
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

  it('shrinks the opponent paddle to the potion minimum height when Drink Me triggers', () => {
    const originalRandom = Math.random
    const drinkMeDefaults = devConfig.modifiers.arena.drinkMe
    const originalDrinkMe = JSON.parse(JSON.stringify(drinkMeDefaults)) as typeof drinkMeDefaults

    Math.random = () => 0.5
    Object.assign(drinkMeDefaults, {
      enabled: true,
      spawnCount: 1,
      shrinkAmount: 200,
      objectRadius: 18,
    })

    try {
      const { canvas, game } = createTestGame()
      const primaryBall = game.state.balls[0]
      expect(primaryBall).toBeDefined()
      const ball = primaryBall!

      const potionRadius = 18
      const margin = Math.max(potionRadius + 12, potionRadius)
      const maxX = Math.max(margin, canvas.width - margin)
      const maxY = Math.max(margin, canvas.height - margin)
      const targetX = margin + (maxX - margin) * 0.5
      const targetY = margin + (maxY - margin) * 0.5

      ball.x = targetX
      ball.y = targetY
      ball.lastPaddleHit = 'left'

      expect(game.state.rightPaddleHeight).toBeGreaterThan(18)

      game.tick(0.016)

      expect(game.state.rightPaddleHeight).toBe(18)
      expect(game.state.leftPaddleHeight).toBe(90)
    } finally {
      Math.random = originalRandom
      Object.assign(drinkMeDefaults, originalDrinkMe)
    }
  })
})
