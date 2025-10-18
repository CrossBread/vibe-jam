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

  it('starts and resets the shot clock when opposing paddles return the ball', () => {
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
    }
    canvas.getContext = vi.fn().mockReturnValue(ctx) as any

    const randomSpy = vi.spyOn(Math, 'random').mockReturnValue(0.25)
    try {
      const game = createPong(canvas, {
        autoStart: false,
        serveCountdownDuration: 0,
        modRevealDelay: 0,
      })

      const dt = 0.016
      const paddleWidth = 12
      const leftPaddleX = 40
      const rightPaddleX = canvas.width - 40 - paddleWidth

      const initialBall = game.state.balls[0]
      expect(initialBall).toBeDefined()
      const ball = initialBall!

      const initialSpeed = Math.abs(game.state.vx) || 320
      const targetY = game.state.leftY + game.state.leftPaddleHeight / 2
      const targetX = leftPaddleX + paddleWidth + ball.radius - 0.5
      game.state.ballX = targetX
      game.state.ballY = targetY
      game.state.vx = -initialSpeed
      game.state.vy = 0
      ball.x = targetX
      ball.y = targetY
      ball.vx = -initialSpeed
      ball.vy = 0

      game.tick(dt)

      expect(game.state.balls[0]?.lastPaddleHit).toBe('left')
      expect(game.state.shotClockActive).toBe(true)
      const afterLeftHit = game.state.shotClockRemaining
      expect(afterLeftHit).toBeGreaterThan(7)

      const primaryBall = game.state.balls[0]!
      const neutralX = canvas.width / 2
      const neutralY = canvas.height / 2
      const reboundSpeed = Math.abs(game.state.vx) || initialSpeed
      game.state.ballX = neutralX
      game.state.ballY = neutralY
      game.state.vx = 0
      game.state.vy = 0
      primaryBall.x = neutralX
      primaryBall.y = neutralY
      primaryBall.vx = 0
      primaryBall.vy = 0

      game.tick(1)
      const beforeReset = game.state.shotClockRemaining
      expect(beforeReset).toBeLessThan(afterLeftHit)

      const rightTargetY = game.state.rightY + game.state.rightPaddleHeight / 2
      const rightTargetX = rightPaddleX - primaryBall.radius + 0.5
      game.state.ballX = rightTargetX
      game.state.ballY = rightTargetY
      game.state.vx = reboundSpeed
      game.state.vy = 0
      primaryBall.x = rightTargetX
      primaryBall.y = rightTargetY
      primaryBall.vx = reboundSpeed
      primaryBall.vy = 0

      game.tick(dt)
      expect(game.state.shotClockRemaining).toBeGreaterThan(beforeReset)
    } finally {
      randomSpy.mockRestore()
    }
  })

  it('expires the shot clock and queues a new mod vote without scoring', () => {
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
    }
    canvas.getContext = vi.fn().mockReturnValue(ctx) as any

    const randomSpy = vi.spyOn(Math, 'random').mockReturnValue(0.25)
    try {
      const game = createPong(canvas, {
        autoStart: false,
        serveCountdownDuration: 0,
        modRevealDelay: 0,
      })

      const dt = 0.016
      const paddleWidth = 12
      const leftPaddleX = 40

      const initialBall = game.state.balls[0]
      expect(initialBall).toBeDefined()
      const ball = initialBall!

      const initialSpeed = Math.abs(game.state.vx) || 320
      const targetY = game.state.leftY + game.state.leftPaddleHeight / 2
      const targetX = leftPaddleX + paddleWidth + ball.radius - 0.5
      game.state.ballX = targetX
      game.state.ballY = targetY
      game.state.vx = -initialSpeed
      game.state.vy = 0
      ball.x = targetX
      ball.y = targetY
      ball.vx = -initialSpeed
      ball.vy = 0

      game.tick(dt)
      expect(game.state.balls[0]?.lastPaddleHit).toBe('left')
      expect(game.state.shotClockActive).toBe(true)
      expect(game.state.leftScore).toBe(0)
      expect(game.state.rightScore).toBe(0)
      expect(game.state.balls.length).toBe(1)

      const primaryBall = game.state.balls[0]!
      const neutralX = canvas.width / 2
      const neutralY = canvas.height / 2
      game.state.ballX = neutralX
      game.state.ballY = neutralY
      game.state.vx = 0
      game.state.vy = 0
      primaryBall.x = neutralX
      primaryBall.y = neutralY
      primaryBall.vx = 0
      primaryBall.vy = 0

      let elapsed = 0
      while (elapsed < 9 && game.state.shotClockActive) {
        const activeBall = game.state.balls[0]
        if (activeBall) {
          game.state.ballX = neutralX
          game.state.ballY = neutralY
          game.state.vx = 0
          game.state.vy = 0
          activeBall.x = neutralX
          activeBall.y = neutralY
          activeBall.vx = 0
          activeBall.vy = 0
        }
        game.tick(0.5)
        elapsed += 0.5
        expect(game.state.leftScore).toBe(0)
        expect(game.state.rightScore).toBe(0)
      }

      expect(game.state.shotClockActive).toBe(false)
      expect(game.state.shotClockRemaining).toBeCloseTo(0, 5)
      expect(game.state.leftScore).toBe(0)
      expect(game.state.rightScore).toBe(0)
      expect(game.state.balls.length).toBe(0)
    } finally {
      randomSpy.mockRestore()
    }
  })
})
