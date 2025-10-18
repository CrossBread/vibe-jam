/*
 * Copyright (c) 2025. CrossBread Tech All rights reserved.
 */

import { createPong } from '../src/game/pong'
import { describe, it, expect, vi } from 'vitest'

describe('Pong core', () => {
  it('increments left score when ball exits right edge', () => {
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
      fillText: vi.fn()
    }
    canvas.getContext = vi.fn().mockReturnValue(ctx) as any

    const game = createPong(canvas, {
      autoStart: false,
      serveCountdownDuration: 0,
      modRevealDelay: 0,
    })
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
})
