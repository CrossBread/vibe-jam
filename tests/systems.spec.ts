import { describe, it, expect, vi } from 'vitest'

import { createArenaSystem } from '../src/game/systems/arenaSystem'
import {
  createPaddleSystem,
  type GamepadInput,
} from '../src/game/systems/paddleSystem'
import {
  createBallSystem,
  type ActiveGravityWell,
} from '../src/game/systems/ballSystem'
import type { PongState } from '../src/game/pong'

const clamp = (v: number, min: number, max: number) => Math.max(min, Math.min(max, v))

function createBaseState(): PongState {
  return {
    leftScore: 0,
    rightScore: 0,
    ballX: 400,
    ballY: 240,
    ballRadius: 8,
    vx: 0,
    vy: 0,
    leftY: 200,
    rightY: 200,
    leftPaddleHeight: 80,
    rightPaddleHeight: 80,
    paused: false,
    winner: null,
    currentPips: 0,
    totalPips: 0,
    totalBites: 0,
    completedBitesSinceLastPoint: 0,
  }
}

function createIdleGamepad(): GamepadInput {
  return {
    leftAxis: 0,
    leftUp: false,
    leftDown: false,
    rightAxis: 0,
    rightUp: false,
    rightDown: false,
  }
}

describe('arena system', () => {
  it('updates moving wells and arena modifiers each tick', () => {
    const calls: Array<string> = []
    const system = createArenaSystem({
      updateMovingWellState: (key, dt) => calls.push(`${key}:${dt.toFixed(2)}`),
      updateDivotsState: () => calls.push('divots'),
      updateIrelandState: () => calls.push('ireland'),
    })

    system(0.5)

    expect(calls).toEqual([
      'blackMole:0.50',
      'gopher:0.50',
      'divots',
      'ireland',
    ])
  })
})

describe('paddle system', () => {
  it('moves AI paddles toward the ball and clamps positions', () => {
    const state = createBaseState()
    state.leftY = 150
    state.ballY = 100

    const system = createPaddleSystem({
      state,
      config: { paddleSpeed: 120 },
      aiState: { left: true, right: true },
      keys: {},
      touchControls: {
        left: { direction: 0, relativeDelta: 0 },
        right: { direction: 0, relativeDelta: 0 },
      },
      getPaddleSpeedMultiplier: () => 1,
      getPaddleHeight: () => 80,
      arenaHeight: 480,
      clamp,
      getGamepadInput: createIdleGamepad,
    })

    system(0.1)

    expect(state.leftY).toBeLessThan(150)
    expect(state.leftY).toBeGreaterThanOrEqual(0)
  })

  it('uses manual controls when AI is disabled and resets touch delta', () => {
    const state = createBaseState()
    const keys: Record<string, boolean> = { s: true }
    const touchControls = {
      left: { direction: 0, relativeDelta: 5 },
      right: { direction: 0, relativeDelta: 0 },
    }

    const system = createPaddleSystem({
      state,
      config: { paddleSpeed: 100 },
      aiState: { left: false, right: true },
      keys,
      touchControls,
      getPaddleSpeedMultiplier: () => 1,
      getPaddleHeight: () => 80,
      arenaHeight: 480,
      clamp,
      getGamepadInput: createIdleGamepad,
    })

    system(0.016)

    expect(state.leftY).toBeGreaterThan(createBaseState().leftY)
    expect(touchControls.left.relativeDelta).toBe(0)
  })

  it('disables AI when gamepad input is active', () => {
    const state = createBaseState()
    const aiState = { left: true, right: true }
    const system = createPaddleSystem({
      state,
      config: { paddleSpeed: 100 },
      aiState,
      keys: {},
      touchControls: {
        left: { direction: 0, relativeDelta: 0 },
        right: { direction: 0, relativeDelta: 0 },
      },
      getPaddleSpeedMultiplier: () => 1,
      getPaddleHeight: () => 80,
      arenaHeight: 480,
      clamp,
      getGamepadInput: () => ({
        leftAxis: 0.5,
        leftUp: false,
        leftDown: false,
        rightAxis: 0,
        rightUp: false,
        rightDown: false,
      }),
    })

    system(0.016)

    expect(aiState.left).toBe(false)
    expect(aiState.right).toBe(true)
  })
})

describe('ball system', () => {
  function createContext(overrides: Partial<PongState> = {}) {
    const state = { ...createBaseState(), ...overrides }
    const wells: ActiveGravityWell[] = []
    const clearDivots = vi.fn()
    const resetBall = vi.fn()
    const handlePoint = vi.fn()

    const system = createBallSystem({
      state,
      width: 800,
      height: 480,
      paddleWidth: 12,
      getLeftPaddleHeight: () => state.leftPaddleHeight,
      getRightPaddleHeight: () => state.rightPaddleHeight,
      clamp,
      getBallRadius: () => state.ballRadius,
      applyBallSizeModifiers: () => {},
      collectActiveGravityWells: () => wells,
      setActiveGravityWells: () => {},
      config: {
        baseBallSpeed: () => 120,
        minHorizontalRatio: () => 0.35,
        speedIncreaseOnHit: () => 1.1,
        winScore: () => 11,
      },
      handlePaddleReturn: () => {},
      updateBallTrails: () => {},
      clearDivotWells: clearDivots,
      resetBall: resetBall,
      handlePointScored: handlePoint,
    })

    return { state, system, clearDivots, resetBall, handlePoint }
  }

  it('increments score when the ball exits the right edge', () => {
    const { state, system, clearDivots, resetBall, handlePoint } = createContext({
      ballX: 809,
      vx: 0,
    })

    system(0)

    expect(state.leftScore).toBe(1)
    expect(clearDivots).toHaveBeenCalledTimes(1)
    expect(resetBall).toHaveBeenCalledWith(true)
    expect(handlePoint).toHaveBeenCalledTimes(1)
  })

  it('applies gravity wells and updates velocity', () => {
    const wells: ActiveGravityWell[] = [
      {
        key: 'test',
        x: 200,
        y: 200,
        gravityStrength: 1000,
        gravityFalloff: 10,
        radius: 50,
        positiveTint: '#fff',
        negativeTint: '#000',
      },
    ]

    const state = createBaseState()
    state.ballX = 100
    state.ballY = 100
    state.vx = 0
    state.vy = 0

    const system = createBallSystem({
      state,
      width: 800,
      height: 480,
      paddleWidth: 12,
      getLeftPaddleHeight: () => 80,
      getRightPaddleHeight: () => 80,
      clamp,
      getBallRadius: () => state.ballRadius,
      applyBallSizeModifiers: () => {},
      collectActiveGravityWells: () => wells,
      setActiveGravityWells: () => {},
      config: {
        baseBallSpeed: () => 120,
        minHorizontalRatio: () => 0.35,
        speedIncreaseOnHit: () => 1.1,
        winScore: () => 11,
      },
      handlePaddleReturn: () => {},
      updateBallTrails: () => {},
      clearDivotWells: () => {},
      resetBall: () => {},
      handlePointScored: () => {},
    })

    system(0.016)

    expect(Math.abs(state.vx) + Math.abs(state.vy)).toBeGreaterThan(0)
  })
})
