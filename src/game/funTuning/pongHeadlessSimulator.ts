/*
 * Copyright (c) 2025. CrossBread Tech All rights reserved.
 */

import {
  createDevConfig,
  deepClone,
  type DevConfig,
} from '../devtools'
import { createPong, type PongAPI } from '../pong'
import type {
  HeadlessMatchSimulator,
  MatchSample,
  PaddleMissSample,
  PaddleSide,
  RoundSample,
  SimulationRequest,
  TrialModConfig,
} from './funTuning'

export interface PongHeadlessSimulatorOptions {
  width?: number
  height?: number
  stepsPerSecond?: number
  /**
   * Maximum simulated duration in seconds before a match is forced to stop.
   */
  maxDurationSeconds?: number
  timeScale?: number
}

class HeadlessCanvas {
  width: number
  height: number
  readonly style: { touchAction?: string } = {}
  readonly parentElement: null = null

  constructor(width: number, height: number) {
    this.width = width
    this.height = height
  }

  getContext(): CanvasRenderingContext2D | null {
    return null
  }

  addEventListener(): void {}
  removeEventListener(): void {}
  dispatchEvent(): boolean {
    return false
  }

  getBoundingClientRect() {
    return {
      left: 0,
      top: 0,
      right: this.width,
      bottom: this.height,
      width: this.width,
      height: this.height,
    }
  }

  toDataURL(): string {
    return ''
  }
}

interface BallSnapshot {
  ref: PongAPI['state']['balls'][number]
  x: number
  y: number
  vx: number
  vy: number
  radius: number
  isReal: boolean
  lastPaddleHit: PaddleSide | null
}

interface StateSnapshot {
  leftY: number
  rightY: number
  leftPaddleHeight: number
  rightPaddleHeight: number
  leftScore: number
  rightScore: number
  shotClockActive: boolean
  shotClockRemaining: number
  ballSnapshots: BallSnapshot[]
  ballHits: Map<PongAPI['state']['balls'][number], PaddleSide | null>
}

interface DirectionTracker {
  sign: number
  sinceLastReturn: number
  max: number
}

function createDirectionTracker(): DirectionTracker {
  return { sign: 0, sinceLastReturn: 0, max: 0 }
}

function resetTracker(tracker: DirectionTracker) {
  tracker.sign = 0
  tracker.sinceLastReturn = 0
  tracker.max = 0
}

function handleDirectionSample(tracker: DirectionTracker, delta: number) {
  if (!Number.isFinite(delta)) return
  if (Math.abs(delta) < 1e-6) return
  const sign = Math.sign(delta)
  if (sign === 0) return
  if (tracker.sign !== 0 && sign !== tracker.sign) {
    tracker.sinceLastReturn += 1
  }
  tracker.sign = sign
}

function finalizeDirectionSample(tracker: DirectionTracker) {
  tracker.max = Math.max(tracker.max, tracker.sinceLastReturn)
  tracker.sinceLastReturn = 0
  tracker.sign = 0
}

function finalizeRoundTracker(tracker: DirectionTracker): number {
  const result = Math.max(tracker.max, tracker.sinceLastReturn)
  resetTracker(tracker)
  return result
}

function captureSnapshot(state: PongAPI['state']): StateSnapshot {
  const ballSnapshots: BallSnapshot[] = state.balls.map(ball => ({
    ref: ball,
    x: ball.x,
    y: ball.y,
    vx: ball.vx,
    vy: ball.vy,
    radius: ball.radius,
    isReal: Boolean(ball.isReal),
    lastPaddleHit: (ball.lastPaddleHit ?? null) as PaddleSide | null,
  }))

  const ballHits = new Map<PongAPI['state']['balls'][number], PaddleSide | null>()
  for (const snapshot of ballSnapshots) {
    ballHits.set(snapshot.ref, snapshot.lastPaddleHit)
  }

  return {
    leftY: state.leftY,
    rightY: state.rightY,
    leftPaddleHeight: state.leftPaddleHeight,
    rightPaddleHeight: state.rightPaddleHeight,
    leftScore: state.leftScore,
    rightScore: state.rightScore,
    shotClockActive: state.shotClockActive,
    shotClockRemaining: state.shotClockRemaining,
    ballSnapshots,
    ballHits,
  }
}

function pickExitBall(
  winner: PaddleSide,
  snapshots: BallSnapshot[],
): BallSnapshot | null {
  const direction = winner === 'left' ? 1 : -1
  const candidates = snapshots.filter(ball => ball.isReal)
  if (candidates.length === 0) return null
  const directional = candidates.filter(ball => Math.sign(ball.vx) === direction)
  const pool = directional.length > 0 ? directional : candidates
  if (direction === 1) {
    return pool.reduce((prev, current) => (current.x > prev.x ? current : prev))
  }
  return pool.reduce((prev, current) => (current.x < prev.x ? current : prev))
}

function computeMissDistance(
  side: PaddleSide,
  ball: BallSnapshot | null,
  snapshot: StateSnapshot,
  dt: number,
): number | null {
  if (!ball) return null
  const predictedY = ball.y + ball.vy * dt
  const paddleY = side === 'left' ? snapshot.leftY : snapshot.rightY
  const paddleHeight = side === 'left' ? snapshot.leftPaddleHeight : snapshot.rightPaddleHeight
  const top = paddleY
  const bottom = paddleY + paddleHeight
  const upperBound = top - ball.radius
  const lowerBound = bottom + ball.radius
  if (predictedY >= upperBound && predictedY <= lowerBound) {
    return 0
  }
  if (predictedY < upperBound) {
    return upperBound - predictedY
  }
  return predictedY - lowerBound
}

function applyTrialParameters(config: DevConfig, mods: TrialModConfig[]) {
  for (const mod of mods) {
    const parts = mod.modPath.split('.')
    if (parts.length < 2) continue
    const [section, key] = parts
    const sectionConfig = (config.modifiers as Record<string, Record<string, unknown>>)[section]
    if (!sectionConfig) continue
    const target = sectionConfig[key]
    if (!target || typeof target !== 'object') continue
    const params = mod.parameters ?? {}
    const targetRecord = target as Record<string, unknown>
    for (const [param, value] of Object.entries(params)) {
      targetRecord[param] = value
    }
    if (
      Object.prototype.hasOwnProperty.call(targetRecord, 'enabled') &&
      typeof targetRecord.enabled === 'boolean' &&
      !Object.prototype.hasOwnProperty.call(params, 'enabled')
    ) {
      targetRecord.enabled = true
    }
  }
}

export function createPongHeadlessSimulator(
  options: PongHeadlessSimulatorOptions = {},
): HeadlessMatchSimulator {
  const width = options.width ?? 1280
  const height = options.height ?? 720
  const stepsPerSecond = Math.max(30, options.stepsPerSecond ?? 240)
  const baseTimeScale = Number.isFinite(options.timeScale) ? Number(options.timeScale) : 1
  const dtBase = 1 / stepsPerSecond

  return {
    async runMatch(request: SimulationRequest): Promise<MatchSample> {
      const canvas = new HeadlessCanvas(width, height) as unknown as HTMLCanvasElement
      const baseConfig = deepClone(createDevConfig())
      applyTrialParameters(baseConfig, request.parameters)
      baseConfig.maxAiMisalignment = Math.max(
        0,
        Math.min(100, Math.round(request.aiMisalignment * 100)),
      )

      const pong = createPong(canvas, {
        autoStart: false,
        headless: true,
        initialConfig: baseConfig,
        scoreLimit: request.scoreLimit,
      })

      pong.reset()

      const requestTimeScale = Number.isFinite(request.timeScale)
        ? Number(request.timeScale)
        : undefined
      const combinedTimeScale = requestTimeScale ?? baseTimeScale
      const timeScale = Math.max(0.1, combinedTimeScale)
      const dtSim = dtBase * timeScale

      const state = pong.state
      const rounds: RoundSample[] = []
      const aiMisses: PaddleMissSample[] = []
      let maxScoreGap = 0
      let elapsed = 0

      const maxDuration =
        options.maxDurationSeconds ?? Math.max(60, Math.max(1, request.scoreLimit) * 60)
      const maxSteps = Math.ceil(maxDuration / dtSim)

      let roundActive = false
      let roundStartTime = 0
      let roundReturnCount = 0
      let roundLastHit: PaddleSide | null = null

      const leftTracker = createDirectionTracker()
      const rightTracker = createDirectionTracker()
      let ballHitMap: WeakMap<PongAPI['state']['balls'][number], PaddleSide | null> = new WeakMap()

      const endCurrentRound = (winner: PaddleSide, shotClockExpired: boolean) => {
        const duration = Math.max(0, elapsed - roundStartTime)
        const leftChanges = finalizeRoundTracker(leftTracker)
        const rightChanges = finalizeRoundTracker(rightTracker)
        rounds.push({
          durationSeconds: duration,
          returnCount: roundReturnCount,
          shotClockExpired,
          winner,
          leftDirectionChanges: leftChanges,
          rightDirectionChanges: rightChanges,
        })
        roundActive = false
        roundReturnCount = 0
        roundLastHit = null
        resetTracker(leftTracker)
        resetTracker(rightTracker)
        ballHitMap = new WeakMap()
      }

      let step = 0
      while (!state.winner && step < maxSteps) {
        step += 1
        const snapshot = captureSnapshot(state)

        pong.tick(dtSim)
        elapsed += dtSim

        maxScoreGap = Math.max(maxScoreGap, Math.abs(state.leftScore - state.rightScore))

        const realBallInPlay = state.balls.some(ball => ball.isReal)
        if (!roundActive && realBallInPlay) {
          roundActive = true
          roundStartTime = elapsed
          roundReturnCount = 0
          roundLastHit = null
          resetTracker(leftTracker)
          resetTracker(rightTracker)
          ballHitMap = new WeakMap()
        }

        if (roundActive) {
          handleDirectionSample(leftTracker, state.leftY - snapshot.leftY)
          handleDirectionSample(rightTracker, state.rightY - snapshot.rightY)

          const shotClockExpiredThisStep =
            snapshot.shotClockActive &&
            !state.shotClockActive &&
            state.shotClockRemaining === 0

          if (shotClockExpiredThisStep) {
            const winner: PaddleSide =
              roundLastHit === 'left' ? 'right' : roundLastHit === 'right' ? 'left' : 'right'
            endCurrentRound(winner, true)
            continue
          }

          for (const ball of state.balls) {
            if (!ball.isReal) continue
            const previousHit = ballHitMap.get(ball) ?? snapshot.ballHits.get(ball) ?? null
            const currentHit = (ball.lastPaddleHit ?? null) as PaddleSide | null
            if (currentHit && currentHit !== previousHit) {
              roundReturnCount += 1
              roundLastHit = currentHit
              if (currentHit === 'left') {
                finalizeDirectionSample(leftTracker)
              } else {
                finalizeDirectionSample(rightTracker)
              }
            }
            ballHitMap.set(ball, currentHit)
          }
        }

        if (state.leftScore !== snapshot.leftScore || state.rightScore !== snapshot.rightScore) {
          const winner: PaddleSide =
            state.leftScore > snapshot.leftScore ? 'left' : 'right'
          const loser: PaddleSide = winner === 'left' ? 'right' : 'left'
          const exitBall = pickExitBall(winner, snapshot.ballSnapshots)
          const missDistance = computeMissDistance(loser, exitBall, snapshot, dtSim)
          if (missDistance !== null && missDistance > 0) {
            aiMisses.push({ side: loser, missDistancePx: missDistance })
          }

          if (roundActive) {
            endCurrentRound(winner, false)
          } else {
            resetTracker(leftTracker)
            resetTracker(rightTracker)
            roundReturnCount = 0
            roundLastHit = null
            ballHitMap = new WeakMap()
          }
        }
      }

      if (roundActive) {
        const winner: PaddleSide = state.leftScore >= state.rightScore ? 'left' : 'right'
        endCurrentRound(winner, false)
      }

      return {
        rounds,
        finalScore: { left: state.leftScore, right: state.rightScore },
        finalScoreGap: Math.abs(state.leftScore - state.rightScore),
        maxScoreGap,
        aiMisses,
      }
    },
  }
}

export function createSimulator(options?: PongHeadlessSimulatorOptions) {
  return createPongHeadlessSimulator(options)
}

export const simulator = createPongHeadlessSimulator()

export default simulator
