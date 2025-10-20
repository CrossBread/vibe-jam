/*
 * Copyright (c) 2025. CrossBread Tech All rights reserved.
 */

import { describe, expect, it } from 'vitest'
import {
  calculatePercentile,
  computeFunFitnessScore,
  buildRepetitionMetrics,
  runTrial,
  runFunTuning,
  type HeadlessMatchSimulator,
  type MatchSample,
  type TrialDefinition,
  type TrialModConfig,
} from '../src/game/funTuning/funTuning'

class MockSimulator implements HeadlessMatchSimulator {
  private readonly matches: MatchSample[]

  constructor(matches: MatchSample[]) {
    this.matches = matches
  }

  async runMatch(): Promise<MatchSample> {
    if (this.matches.length === 0) {
      throw new Error('No mock matches available')
    }
    const match = this.matches.shift() ?? this.matches[0]!
    this.matches.push(match)
    return match
  }
}

class TrackingSimulator implements HeadlessMatchSimulator {
  private readonly match: MatchSample
  private active = 0
  private maxActive = 0

  constructor(match: MatchSample) {
    this.match = match
  }

  get maxConcurrency(): number {
    return this.maxActive
  }

  async runMatch(): Promise<MatchSample> {
    this.active += 1
    this.maxActive = Math.max(this.maxActive, this.active)
    await new Promise(resolve => setTimeout(resolve, 5))
    this.active -= 1
    return this.match
  }
}

function createTrial(mods: TrialModConfig[]): TrialDefinition {
  return {
    id: 'trial-1',
    mods,
  }
}

describe('fun tuning utilities', () => {
  it('computes percentiles with linear interpolation', () => {
    const values = [1, 5, 2, 4, 3]
    expect(calculatePercentile(values, 0.5)).toBeCloseTo(3)
    expect(calculatePercentile(values, 0.9)).toBeCloseTo(4.6, 1)
    expect(calculatePercentile(values, 0.99)).toBeCloseTo(4.96, 2)
  })

  it('derives repetition metrics from a match sample', () => {
    const match: MatchSample = {
      rounds: [
        {
          durationSeconds: 10,
          returnCount: 6,
          shotClockExpired: false,
          winner: 'left',
          leftDirectionChanges: 4,
          rightDirectionChanges: 5,
        },
        {
          durationSeconds: 7,
          returnCount: 5,
          shotClockExpired: false,
          winner: 'right',
          leftDirectionChanges: 6,
          rightDirectionChanges: 4,
        },
        {
          durationSeconds: 9,
          returnCount: 7,
          shotClockExpired: false,
          winner: 'left',
          leftDirectionChanges: 3,
          rightDirectionChanges: 4,
        },
      ],
      finalScore: { left: 11, right: 9 },
      finalScoreGap: 2,
      maxScoreGap: 3,
      aiMisses: [
        { side: 'left', missDistancePx: 12 },
        { side: 'right', missDistancePx: 8 },
      ],
    }

    const metrics = buildRepetitionMetrics(match)

    expect(metrics.totalRounds).toBe(3)
    expect(metrics.roundDurationPercentiles.p50).toBeCloseTo(9)
    expect(metrics.returnsPerRoundPercentiles.p50).toBeCloseTo(6)
    expect(metrics.directionChanges.percentiles.p50).toBeCloseTo(9)
    expect(metrics.aiMissSummary.total).toBe(2)
    expect(metrics.totalReturns).toBe(18)
    expect(metrics.matchDurationSeconds).toBeCloseTo(26)
  })

  it('computes fun score for balanced metrics', () => {
    const match: MatchSample = {
      rounds: Array.from({ length: 10 }, (_, index) => ({
        durationSeconds: 12,
        returnCount: 6,
        shotClockExpired: false,
        winner: index % 2 === 0 ? 'left' : 'right',
        leftDirectionChanges: 4,
        rightDirectionChanges: 4,
      })),
      finalScore: { left: 11, right: 10 },
      finalScoreGap: 1,
      maxScoreGap: 2,
      aiMisses: [],
    }

    const metrics = buildRepetitionMetrics(match)
    const score = computeFunFitnessScore(metrics, 11)

    expect(score).toBeGreaterThan(0.8)
    expect(score).toBeLessThanOrEqual(1)
  })

  it('runs trial mutations and generations', async () => {
    const matches: MatchSample[] = [
      {
        rounds: Array.from({ length: 6 }, (_, index) => ({
          durationSeconds: 8 + index,
          returnCount: 4 + index % 3,
          shotClockExpired: index === 5,
          winner: index % 2 === 0 ? 'left' : 'right',
          leftDirectionChanges: 5,
          rightDirectionChanges: 6,
        })),
        finalScore: { left: 11, right: 9 },
        finalScoreGap: 2,
        maxScoreGap: 4,
        aiMisses: [{ side: 'left', missDistancePx: 16 }],
      },
      {
        rounds: Array.from({ length: 6 }, (_, index) => ({
          durationSeconds: 7 + index,
          returnCount: 3 + index % 2,
          shotClockExpired: false,
          winner: index % 2 === 0 ? 'left' : 'right',
          leftDirectionChanges: 5,
          rightDirectionChanges: 5,
        })),
        finalScore: { left: 10, right: 11 },
        finalScoreGap: 1,
        maxScoreGap: 3,
        aiMisses: [{ side: 'right', missDistancePx: 12 }],
      },
    ]

    const simulator = new MockSimulator(matches)
    const trial = createTrial([
      { modPath: 'arena.blackHole', parameters: { gravityStrength: 1_000_000 } },
    ])

    const report = await runTrial(simulator, trial, { repetitions: 2 })
    expect(report.repetitions).toHaveLength(2)
    expect(report.summary.totalMatches).toBe(2)

    const tuning = await runFunTuning(simulator, [trial], {
      generations: 2,
      mutationSurvivors: 1,
      repetitions: 1,
    })

    expect(tuning.generations).toHaveLength(2)
    expect(tuning.bestTrial).not.toBeNull()
    expect(tuning.recommendedConfigPatch).toMatchObject({ modifiers: { arena: { blackHole: {} } } })
  })

  it('runs repetitions concurrently when concurrency is specified', async () => {
    const match: MatchSample = {
      rounds: [
        {
          durationSeconds: 6,
          returnCount: 5,
          shotClockExpired: false,
          winner: 'left',
          leftDirectionChanges: 3,
          rightDirectionChanges: 4,
        },
      ],
      finalScore: { left: 11, right: 8 },
      finalScoreGap: 3,
      maxScoreGap: 4,
      aiMisses: [],
    }

    const simulator = new TrackingSimulator(match)
    const trial = createTrial([
      { modPath: 'arena.blackHole', parameters: { gravityStrength: 1_000_000 } },
    ])

    const report = await runTrial(simulator, trial, { repetitions: 4, concurrency: 2 })

    expect(report.repetitions).toHaveLength(4)
    expect(simulator.maxConcurrency).toBeGreaterThan(1)
  })
})
