import { createPong } from '../src/game/pong'
import { describe, it, expect } from 'vitest'

describe('Pong core', () => {
  it('increments left score when ball exits right edge', () => {
    const canvas = Object.assign(document.createElement('canvas'), { width: 800, height: 480 })
    const game = createPong(canvas)
    game.state.ballX = 801
    const before = game.state.leftScore
    game.tick(0.016)
    expect(game.state.leftScore).toBe(before + 1)
  })
})
