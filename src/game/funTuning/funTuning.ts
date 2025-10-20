/*
 * Copyright (c) 2025. CrossBread Tech All rights reserved.
 */

import { deepClone } from '../devtools'

export type PaddleSide = 'left' | 'right'

export interface RoundSample {
  durationSeconds: number
  returnCount: number
  shotClockExpired: boolean
  winner: PaddleSide
  leftDirectionChanges: number
  rightDirectionChanges: number
}

export interface PaddleMissSample {
  side: PaddleSide
  missDistancePx: number
}

export interface MatchSample {
  rounds: RoundSample[]
  finalScore: Record<PaddleSide, number>
  finalScoreGap: number
  maxScoreGap: number
  aiMisses?: PaddleMissSample[]
}

export interface TrialModConfig {
  /**
   * Dot-delimited path to the modifier in devConfig (e.g. "arena.blackHole").
   */
  modPath: string
  parameters: Record<string, number | string | boolean>
}

export interface TrialDefinition {
  id: string
  label?: string
  mods: TrialModConfig[]
  repetitions?: number
  aiMisalignment?: number
  timeScale?: number
  metadata?: Record<string, unknown>
}

export interface SimulationRequest {
  trial: TrialDefinition
  parameters: TrialModConfig[]
  aiMisalignment: number
  scoreLimit: number
  timeScale?: number
}

export interface HeadlessMatchSimulator {
  runMatch(request: SimulationRequest): Promise<MatchSample>
}

export interface PercentileSummary {
  p50: number | null
  p90: number | null
  p99: number | null
}

export interface DirectionChangeSummary {
  leftAverage: number
  rightAverage: number
  combinedAverage: number
  percentiles: PercentileSummary
}

export interface ShotClockSummary {
  expiredRounds: number
  totalRounds: number
  expirationRate: number
}

export interface PaddleMissSummary {
  total: number
  left: number
  right: number
  averageDistance: number
  percentiles: PercentileSummary
}

export interface TrialRepetitionMetrics {
  totalRounds: number
  leftRoundWins: number
  rightRoundWins: number
  roundDurationPercentiles: PercentileSummary
  returnsPerRoundPercentiles: PercentileSummary
  directionChanges: DirectionChangeSummary
  totalReturns: number
  matchDurationSeconds: number
  shotClock: ShotClockSummary
  aiMissSummary: PaddleMissSummary
  finalScore: Record<PaddleSide, number>
  finalScoreGap: number
  maxScoreGap: number
  roundWinRate: number
}

export interface TrialRepetitionResult {
  repetitionIndex: number
  match: MatchSample
  metrics: TrialRepetitionMetrics
  funScore: number
  mutation?: TrialMutationDescriptor | null
}

export interface TrialSummaryMetrics {
  averageFunScore: number
  funScorePercentiles: PercentileSummary
  roundDurationPercentiles: PercentileSummary
  returnsPerRoundPercentiles: PercentileSummary
  directionChanges: DirectionChangeSummary
  aiMissSummary: PaddleMissSummary
  shotClockExpirationRate: number
  leftRoundWinRate: number
  maxScoreGapAverage: number
  finalScoreGapAverage: number
  returnsPerMatchAverage: number
  matchDurationSecondsAverage: number
  totalMatches: number
  totalRounds: number
}

export interface TrialRunReport {
  trial: TrialDefinition
  mutation?: TrialMutationDescriptor | null
  repetitions: TrialRepetitionResult[]
  summary: TrialSummaryMetrics
}

export interface TrialMutationDescriptor {
  modPath: string
  parameter: string
  factor: number
  direction: 'increase' | 'decrease'
}

export interface TrialMutationSetReport {
  base: TrialRunReport
  mutations: TrialRunReport[]
  mutationFactor: number
}

export interface FunTuningOptions {
  repetitions?: number
  aiMisalignment?: number
  scoreLimit?: number
  mutationSurvivors?: number
  generations?: number
  concurrency?: number
  timeScale?: number
}

export interface FunTuningGeneration {
  generation: number
  mutationFactor: number
  trialReports: TrialRunReport[]
}

export interface FunTuningReport {
  generations: FunTuningGeneration[]
  bestTrial: TrialRunReport | null
  recommendedConfigPatch: Record<string, unknown> | null
  recommendations: string[]
}

export type FunTuningStatus =
  | {
      type: 'generation-start'
      generation: number
      totalGenerations: number
      trialCount: number
      mutationFactor: number
    }
  | {
      type: 'generation-complete'
      generation: number
      totalGenerations: number
      trialCount: number
      mutationFactor: number
    }
  | {
      type: 'trial-start'
      generation: number
      totalGenerations: number
      trialCount: number
      trialIndex: number
      trial: TrialDefinition
    }
  | {
      type: 'trial-complete'
      generation: number
      totalGenerations: number
      trialCount: number
      trialIndex: number
      trial: TrialDefinition
    }

export function calculatePercentile(values: number[], percentile: number): number | null {
  if (!values.length) return null
  if (percentile <= 0) return values[0] ?? null
  if (percentile >= 1) return values[values.length - 1] ?? null

  const sorted = values.slice().sort((a, b) => a - b)
  const index = (sorted.length - 1) * percentile
  const lower = Math.floor(index)
  const upper = Math.ceil(index)
  if (lower === upper) {
    return sorted[lower] ?? null
  }
  const weight = index - lower
  const lowerValue = sorted[lower] ?? sorted[0]
  const upperValue = sorted[upper] ?? sorted[sorted.length - 1]
  return lowerValue + (upperValue - lowerValue) * weight
}

export function summarizePercentiles(values: number[]): PercentileSummary {
  return {
    p50: calculatePercentile(values, 0.5),
    p90: calculatePercentile(values, 0.9),
    p99: calculatePercentile(values, 0.99),
  }
}

function average(values: number[]): number {
  if (!values.length) return 0
  return values.reduce((total, value) => total + value, 0) / values.length
}

function clampScore(value: number): number {
  return Math.max(0, Math.min(1, value))
}

export function computeFunFitnessScore(
  metrics: TrialRepetitionMetrics,
  scoreLimit: number,
): number {
  const balanceScore = clampScore(1 - Math.abs(metrics.roundWinRate - 0.5) * 2)
  const gapScore = clampScore(1 - metrics.maxScoreGap / Math.max(scoreLimit, 1))

  const durationMedian = metrics.roundDurationPercentiles.p50 ?? 0
  let durationScore = 1
  if (durationMedian < 5) {
    durationScore = clampScore(1 - (5 - durationMedian) / 5)
  } else if (durationMedian > 30) {
    durationScore = clampScore(1 - (durationMedian - 30) / 30)
  }

  const returnsMedian = metrics.returnsPerRoundPercentiles.p50 ?? 0
  const returnsScore = clampScore(Math.min(1, returnsMedian / 8))

  const shotClockScore = clampScore(1 - metrics.shotClock.expirationRate)

  const directionMedian = metrics.directionChanges.percentiles.p50 ?? 0
  const directionScore = directionMedian <= 10
    ? 1
    : clampScore(1 - (directionMedian - 10) / 10)

  const scores = [
    balanceScore,
    gapScore,
    durationScore,
    returnsScore,
    shotClockScore,
    directionScore,
  ]

  return clampScore(average(scores))
}

function collectRoundDirectionChanges(rounds: RoundSample[]): number[] {
  return rounds.map(round => round.leftDirectionChanges + round.rightDirectionChanges)
}

function buildDirectionSummary(rounds: RoundSample[]): DirectionChangeSummary {
  const leftChanges = rounds.map(round => round.leftDirectionChanges)
  const rightChanges = rounds.map(round => round.rightDirectionChanges)
  const combined = collectRoundDirectionChanges(rounds)

  return {
    leftAverage: average(leftChanges),
    rightAverage: average(rightChanges),
    combinedAverage: average(combined),
    percentiles: summarizePercentiles(combined),
  }
}

function buildShotClockSummary(rounds: RoundSample[]): ShotClockSummary {
  const totalRounds = rounds.length
  const expiredRounds = rounds.reduce(
    (total, round) => total + (round.shotClockExpired ? 1 : 0),
    0,
  )

  return {
    expiredRounds,
    totalRounds,
    expirationRate: totalRounds === 0 ? 0 : expiredRounds / totalRounds,
  }
}

function buildMissSummary(misses: PaddleMissSample[] | undefined): PaddleMissSummary {
  const missList = misses ?? []
  const distances = missList.map(miss => miss.missDistancePx)

  return {
    total: missList.length,
    left: missList.filter(miss => miss.side === 'left').length,
    right: missList.filter(miss => miss.side === 'right').length,
    averageDistance: average(distances),
    percentiles: summarizePercentiles(distances),
  }
}

export function buildRepetitionMetrics(match: MatchSample): TrialRepetitionMetrics {
  const rounds = match.rounds ?? []
  const returnsPerRound = rounds.map(round => round.returnCount)
  const roundDurations = rounds.map(round => round.durationSeconds)
  const matchDurationSeconds = roundDurations.reduce((total, value) => total + value, 0)
  const totalReturns = returnsPerRound.reduce((total, value) => total + value, 0)
  const directionChanges = buildDirectionSummary(rounds)
  const shotClock = buildShotClockSummary(rounds)
  const aiMissSummary = buildMissSummary(match.aiMisses)
  const totalRounds = rounds.length
  const leftRoundWins = rounds.filter(round => round.winner === 'left').length
  const rightRoundWins = totalRounds - leftRoundWins
  const roundWinRate = totalRounds === 0 ? 0.5 : leftRoundWins / totalRounds

  return {
    totalRounds,
    leftRoundWins,
    rightRoundWins,
    roundDurationPercentiles: summarizePercentiles(roundDurations),
    returnsPerRoundPercentiles: summarizePercentiles(returnsPerRound),
    directionChanges,
    totalReturns,
    matchDurationSeconds,
    shotClock,
    aiMissSummary,
    finalScore: match.finalScore,
    finalScoreGap: match.finalScoreGap,
    maxScoreGap: match.maxScoreGap,
    roundWinRate,
  }
}

function summarizeTrial(
  trial: TrialDefinition,
  repetitions: TrialRepetitionResult[],
  scoreLimit: number,
  mutation: TrialMutationDescriptor | null | undefined,
): TrialRunReport {
  const funScores = repetitions.map(result => result.funScore)
  const allRounds = repetitions.flatMap(result => result.match.rounds)
  const directionSummary = buildDirectionSummary(allRounds)
  const shotClock = buildShotClockSummary(allRounds)
  const missSummary = buildMissSummary(
    repetitions.flatMap(result => result.match.aiMisses ?? []),
  )

  const summary: TrialSummaryMetrics = {
    averageFunScore: average(funScores),
    funScorePercentiles: summarizePercentiles(funScores),
    roundDurationPercentiles: summarizePercentiles(allRounds.map(round => round.durationSeconds)),
    returnsPerRoundPercentiles: summarizePercentiles(allRounds.map(round => round.returnCount)),
    directionChanges: directionSummary,
    aiMissSummary: missSummary,
    shotClockExpirationRate: shotClock.expirationRate,
    leftRoundWinRate: (() => {
      const totalRounds = allRounds.length
      const leftWins = allRounds.filter(round => round.winner === 'left').length
      return totalRounds === 0 ? 0.5 : leftWins / totalRounds
    })(),
    maxScoreGapAverage: average(repetitions.map(result => result.metrics.maxScoreGap)),
    finalScoreGapAverage: average(repetitions.map(result => result.metrics.finalScoreGap)),
    returnsPerMatchAverage: average(repetitions.map(result => result.metrics.totalReturns)),
    matchDurationSecondsAverage: average(
      repetitions.map(result => result.metrics.matchDurationSeconds),
    ),
    totalMatches: repetitions.length,
    totalRounds: allRounds.length,
  }

  return {
    trial,
    mutation: mutation ?? null,
    repetitions,
    summary,
  }
}

function cloneTrial(trial: TrialDefinition): TrialDefinition {
  return {
    ...trial,
    mods: trial.mods.map(mod => ({
      modPath: mod.modPath,
      parameters: deepClone(mod.parameters),
    })),
  }
}

function applyMutation(
  trial: TrialDefinition,
  mutation: TrialMutationDescriptor,
): TrialDefinition {
  const mutated = cloneTrial(trial)
  const target = mutated.mods.find(mod => mod.modPath === mutation.modPath)
  if (!target) {
    return mutated
  }

  const currentValue = target.parameters[mutation.parameter]
  if (typeof currentValue !== 'number') {
    return mutated
  }

  const nextValue = mutation.direction === 'increase'
    ? currentValue * mutation.factor
    : currentValue / mutation.factor

  target.parameters[mutation.parameter] = nextValue
  return mutated
}

function enumerateMutableParameters(trial: TrialDefinition): TrialMutationDescriptor[] {
  const descriptors: TrialMutationDescriptor[] = []
  for (const mod of trial.mods) {
    for (const [key, value] of Object.entries(mod.parameters)) {
      if (typeof value !== 'number') {
        continue
      }

      descriptors.push({
        modPath: mod.modPath,
        parameter: key,
        factor: 1,
        direction: 'increase',
      })
    }
  }

  return descriptors
}

async function runTrialInternal(
  simulator: HeadlessMatchSimulator,
  trial: TrialDefinition,
  options: Required<Pick<FunTuningOptions, 'scoreLimit'>> & {
    repetitions: number
    aiMisalignment: number
    concurrency: number
    timeScale: number
  },
  mutation: TrialMutationDescriptor | null,
): Promise<TrialRunReport> {
  const repetitions: TrialRepetitionResult[] = []
  const concurrency = Math.max(1, Math.floor(options.concurrency))
  let nextIndex = 0

  while (nextIndex < options.repetitions) {
    const batchIndices: number[] = []
    while (batchIndices.length < concurrency && nextIndex < options.repetitions) {
      batchIndices.push(nextIndex)
      nextIndex += 1
    }

    const batchMatches = await Promise.all(
      batchIndices.map(async index => {
        const match = await simulator.runMatch({
          trial,
          parameters: trial.mods,
          aiMisalignment: options.aiMisalignment,
          scoreLimit: options.scoreLimit,
          timeScale: options.timeScale,
        })

        return { index, match }
      }),
    )

    batchMatches
      .sort((a, b) => a.index - b.index)
      .forEach(({ index, match }) => {
        const metrics = buildRepetitionMetrics(match)
        const funScore = computeFunFitnessScore(metrics, options.scoreLimit)

        repetitions.push({
          repetitionIndex: index,
          match,
          metrics,
          funScore,
          mutation,
        })
      })
  }

  return summarizeTrial(trial, repetitions, options.scoreLimit, mutation)
}

export async function runTrial(
  simulator: HeadlessMatchSimulator,
  trial: TrialDefinition,
  options: FunTuningOptions = {},
  mutation: TrialMutationDescriptor | null = null,
): Promise<TrialRunReport> {
  const repetitions = options.repetitions ?? trial.repetitions ?? 10
  const aiMisalignment = options.aiMisalignment ?? trial.aiMisalignment ?? 0.6
  const scoreLimit = options.scoreLimit ?? 11
  const concurrency = options.concurrency ?? 1
  const timeScale = options.timeScale ?? trial.timeScale ?? 1

  return runTrialInternal(
    simulator,
    trial,
    { repetitions, aiMisalignment, scoreLimit, concurrency, timeScale },
    mutation,
  )
}

export async function runTrialMutationSet(
  simulator: HeadlessMatchSimulator,
  trial: TrialDefinition,
  mutationFactor: number,
  options: FunTuningOptions = {},
): Promise<TrialMutationSetReport> {
  const baseReport = await runTrial(simulator, trial, options)
  const mutableParameters = enumerateMutableParameters(trial)
  const mutations: TrialRunReport[] = []

  for (const descriptor of mutableParameters) {
    const increaseDescriptor: TrialMutationDescriptor = {
      ...descriptor,
      factor: mutationFactor,
      direction: 'increase',
    }

    const decreaseDescriptor: TrialMutationDescriptor = {
      ...descriptor,
      factor: mutationFactor,
      direction: 'decrease',
    }

    const increasedTrial = applyMutation(trial, increaseDescriptor)
    const decreasedTrial = applyMutation(trial, decreaseDescriptor)

    mutations.push(
      await runTrial(simulator, increasedTrial, options, increaseDescriptor),
    )

    mutations.push(
      await runTrial(simulator, decreasedTrial, options, decreaseDescriptor),
    )
  }

  return {
    base: baseReport,
    mutations,
    mutationFactor,
  }
}

function buildConfigPatch(trial: TrialDefinition): Record<string, unknown> {
  const patch: Record<string, any> = { modifiers: {} }

  for (const mod of trial.mods) {
    const segments = mod.modPath.split('.')
    if (!segments.length) continue

    let cursor = patch.modifiers
    for (let index = 0; index < segments.length; index += 1) {
      const segment = segments[index]!
      if (index === segments.length - 1) {
        cursor[segment] = {
          ...(cursor[segment] ?? {}),
          ...mod.parameters,
        }
      } else {
        cursor[segment] = cursor[segment] ?? {}
        cursor = cursor[segment]
      }
    }
  }

  return patch
}

function mutationFactorForGeneration(generation: number): number {
  if (generation <= 1) {
    return 2
  }
  const power = generation - 1
  return 1 + 1 / Math.pow(2, power)
}

export async function runFunTuning(
  simulator: HeadlessMatchSimulator,
  initialTrials: TrialDefinition[],
  options: FunTuningOptions = {},
  statusCallback?: (status: FunTuningStatus) => void,
): Promise<FunTuningReport> {
  const generations: FunTuningGeneration[] = []
  const mutationSurvivors = options.mutationSurvivors ?? 2
  const generationCount = options.generations ?? 1

  let currentTrials = initialTrials.slice()
  let bestTrialReport: TrialRunReport | null = null

  for (let generation = 1; generation <= generationCount; generation += 1) {
    const factor = mutationFactorForGeneration(generation)
    const generationReports: TrialRunReport[] = []
    const generationTrialCount = currentTrials.length

    statusCallback?.({
      type: 'generation-start',
      generation,
      totalGenerations: generationCount,
      trialCount: generationTrialCount,
      mutationFactor: factor,
    })

    for (let index = 0; index < generationTrialCount; index += 1) {
      const trial = currentTrials[index]!

      statusCallback?.({
        type: 'trial-start',
        generation,
        totalGenerations: generationCount,
        trialCount: generationTrialCount,
        trialIndex: index + 1,
        trial,
      })

      const mutationSet = await runTrialMutationSet(
        simulator,
        trial,
        factor,
        options,
      )
      generationReports.push(mutationSet.base, ...mutationSet.mutations)

      statusCallback?.({
        type: 'trial-complete',
        generation,
        totalGenerations: generationCount,
        trialCount: generationTrialCount,
        trialIndex: index + 1,
        trial,
      })
    }

    generationReports.sort((a, b) => b.summary.averageFunScore - a.summary.averageFunScore)
    bestTrialReport = generationReports[0] ?? bestTrialReport

    generations.push({
      generation,
      mutationFactor: factor,
      trialReports: generationReports,
    })

    statusCallback?.({
      type: 'generation-complete',
      generation,
      totalGenerations: generationCount,
      trialCount: generationTrialCount,
      mutationFactor: factor,
    })

    currentTrials = generationReports
      .slice(0, mutationSurvivors)
      .map(report => cloneTrial(report.trial))
  }

  const recommendedConfigPatch = bestTrialReport
    ? buildConfigPatch(bestTrialReport.trial)
    : null

  const recommendations = [
    'The mutation process mirrors coordinate-descent style hyperparameter tuning. Consider Bayesian optimization or covariance matrix adaptation evolution strategies (CMA-ES) for potentially faster convergence when the search space is large.',
  ]

  return {
    generations,
    bestTrial: bestTrialReport ?? null,
    recommendedConfigPatch,
    recommendations,
  }
}
