import { createPong } from '../src/game/pong'
import { describe, it, expect } from 'vitest'

describe('Pong core', () => {
  it('increments score when ball exits right edge', () => {
    const canvas = Object.assign(document.createElement('canvas'), { width: 800, height: 480 })
    const game = createPong(canvas)
    // force ball to go right and off screen
    game.state.ballX = 801
    const leftBefore = game.state.leftScore
    game.tick(0.016)
    expect(game.state.leftScore).toBe(leftBefore + 1)
  })
})
