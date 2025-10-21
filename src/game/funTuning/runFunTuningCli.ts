import { readFile, writeFile } from 'node:fs/promises'
import path from 'node:path'
import process from 'node:process'
import { pathToFileURL } from 'node:url'

import {
  runFunTuning,
  type FunTuningOptions,
  type FunTuningReport,
  type HeadlessMatchSimulator,
  type FunTuningStatus,
  type TrialDefinition,
  type TrialRunReport,
  type TrialSuiteDefinition,
} from './funTuning'

interface CliArguments {
  simulatorPath?: string
  trialsPath?: string
  outputPath?: string
  showHelp: boolean
  verbose: boolean
  overrides: FunTuningOptions
}

interface TrialConfigFile {
  trials?: TrialDefinition[]
  suites?: TrialSuiteDefinition[]
  options?: FunTuningOptions
}

interface FunScoreImprovement {
  startingScore: number
  bestScore: number
  absoluteChange: number
  signedAbsoluteChange: string
  percentChange: number | null
  percentChangeLabel: string
}

interface TrialSuiteRunResult {
  suite: TrialSuiteDefinition
  report: FunTuningReport
  improvement: FunScoreImprovement | null
  options: FunTuningOptions
}

function sanitizeForFileName(value: string): string {
  const sanitized = value
    .trim()
    .replace(/[^\w.-]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .toLowerCase()

  return sanitized || 'suite'
}

function createSuiteOutputEntry(result: TrialSuiteRunResult) {
  return {
    suite: {
      id: result.suite.id,
      label: result.suite.label ?? null,
      trials: result.suite.trials,
      options: result.suite.options ?? null,
    },
    funScoreImprovement: result.improvement,
    recommendedConfigPatch: result.report.recommendedConfigPatch,
    report: result.report,
    effectiveOptions: result.options,
  }
}

function printUsage(): void {
  console.log(`Fun tuning CLI\n\n` +
    `Usage: npm run fun-tuning -- --simulator ./path/to/simulator.ts --trials ./trials.json [options]\n\n` +
    `Required flags:\n` +
    `  --simulator    Path to a module exporting a HeadlessMatchSimulator or a createSimulator() factory.\n` +
    `  --trials       Path to a JSON file containing an array of trials or { 'trials': [...], 'options': {...} }.\n\n` +
    `Optional flags:\n` +
    `  --output               Where to write the full report as JSON. Defaults to stdout only.\n` +
    `  --repetitions          Override repetitions per trial.\n` +
    `  --ai-misalignment      Override AI misalignment value (0-1).\n` +
    `  --score-limit          Override the score limit.\n` +
    `  --mutation-survivors   Override survivor count per generation.\n` +
    `  --generations          Override total generations to run.\n` +
    `  --concurrency          Number of matches to simulate in parallel (default 1).\n` +
    `  --time-scale           Multiply the in-game clock by this factor during simulations.\n` +
    `  --verbose              Print progress information while running.\n` +
    `  --help                 Show this help message.\n`)
}

function parseArguments(argv: string[]): CliArguments {
  const args: CliArguments = {
    showHelp: false,
    verbose: false,
    overrides: {},
  }

  for (let index = 0; index < argv.length; index += 1) {
    const value = argv[index]!

    switch (value) {
      case '--help':
        args.showHelp = true
        break
      case '--simulator':
        args.simulatorPath = argv[++index]
        break
      case '--trials':
        args.trialsPath = argv[++index]
        break
      case '--output':
        args.outputPath = argv[++index]
        break
      case '--repetitions': {
        const repetitions = Number(argv[++index])
        if (!Number.isNaN(repetitions)) {
          args.overrides.repetitions = repetitions
        }
        break
      }
      case '--ai-misalignment': {
        const misalignment = Number(argv[++index])
        if (!Number.isNaN(misalignment)) {
          args.overrides.aiMisalignment = misalignment
        }
        break
      }
      case '--score-limit': {
        const scoreLimit = Number(argv[++index])
        if (!Number.isNaN(scoreLimit)) {
          args.overrides.scoreLimit = scoreLimit
        }
        break
      }
      case '--mutation-survivors': {
        const survivors = Number(argv[++index])
        if (!Number.isNaN(survivors)) {
          args.overrides.mutationSurvivors = survivors
        }
        break
      }
      case '--generations': {
        const generations = Number(argv[++index])
        if (!Number.isNaN(generations)) {
          args.overrides.generations = generations
        }
        break
      }
      case '--concurrency': {
        const concurrency = Number(argv[++index])
        if (!Number.isNaN(concurrency)) {
          args.overrides.concurrency = concurrency
        }
        break
      }
      case '--time-scale': {
        const scale = Number(argv[++index])
        if (!Number.isNaN(scale)) {
          args.overrides.timeScale = scale
        }
        break
      }
      case '--verbose':
        args.verbose = true
        break
      default:
        console.warn(`Unknown argument: ${value}`)
        break
    }
  }

  return args
}

async function readJsonFileSafe(filePath: string) {
  const abs = path.resolve(filePath);
  const raw = await readFile(abs, { encoding: 'utf8' });
  const noBom = raw.replace(/^\uFEFF/, ''); // strip UTF-8 BOM if present

  try {
    return JSON.parse(noBom);
  } catch (err) {
    const hint = noBom.charCodeAt(0) === 0xFEFF ? ' (BOM removed)' : '';
    throw new Error(`Failed to parse JSON at ${abs}${hint}: ${(err as Error).message}`);
  }
}

function normalizeTrialConfig(
  data: TrialConfigFile | TrialDefinition[],
): TrialConfigFile {
  if (Array.isArray(data)) {
    return { trials: data }
  }

  const normalized: TrialConfigFile = { ...data }

  if (normalized.trials !== undefined && !Array.isArray(normalized.trials)) {
    throw new Error('Trial config must include a "trials" array when provided.')
  }

  if (normalized.suites !== undefined && !Array.isArray(normalized.suites)) {
    throw new Error('Trial config must include a "suites" array when provided.')
  }

  const hasTrials = Array.isArray(normalized.trials) && normalized.trials.length > 0
  const hasSuites = Array.isArray(normalized.suites) && normalized.suites.length > 0

  if (!hasTrials && !hasSuites) {
    throw new Error('Trial config must include a "trials" array or a "suites" array.')
  }

  return normalized
}

async function resolveSimulator(modulePath: string): Promise<HeadlessMatchSimulator> {
  const absolute = path.resolve(process.cwd(), modulePath)
  const imported = await import(pathToFileURL(absolute).href)

  if (typeof imported.createSimulator === 'function') {
    const simulator = await imported.createSimulator()
    if (simulator && typeof simulator.runMatch === 'function') {
      return simulator
    }
  }

  if (imported.simulator && typeof imported.simulator.runMatch === 'function') {
    return imported.simulator as HeadlessMatchSimulator
  }

  if (imported.default && typeof imported.default.runMatch === 'function') {
    return imported.default as HeadlessMatchSimulator
  }

  throw new Error('Simulator module must export createSimulator(), simulator, or default with a runMatch method.')
}

function mergeOptions(base: FunTuningOptions | undefined, overrides: FunTuningOptions): FunTuningOptions {
  return { ...base, ...overrides }
}

function findStartingTrialReport(report: FunTuningReport): TrialRunReport | null {
  const firstGeneration = report.generations[0]
  if (!firstGeneration) {
    return null
  }

  return firstGeneration.trialReports.find(trialReport => !trialReport.mutation) ?? null
}

function calculateFunScoreImprovement(
  report: FunTuningReport,
): FunScoreImprovement | null {
  if (!report.bestTrial) {
    return null
  }

  const startingReport = findStartingTrialReport(report)
  if (!startingReport) {
    return null
  }

  const startingScore = startingReport.summary.averageFunScore
  const bestScore = report.bestTrial.summary.averageFunScore
  const absoluteChange = bestScore - startingScore
  const signedAbsoluteChange = `${absoluteChange >= 0 ? '+' : ''}${absoluteChange.toFixed(3)}`

  let percentChange: number | null = null
  let percentChangeLabel: string
  if (startingScore === 0) {
    if (absoluteChange === 0) {
      percentChange = 0
      percentChangeLabel = '0.0%'
    } else if (absoluteChange > 0) {
      percentChangeLabel = '∞%'
    } else {
      percentChangeLabel = '-∞%'
    }
  } else {
    const percent = (absoluteChange / startingScore) * 100
    percentChange = percent
    percentChangeLabel = `${percent.toFixed(1)}%`
  }

  return {
    startingScore,
    bestScore,
    absoluteChange,
    signedAbsoluteChange,
    percentChange,
    percentChangeLabel,
  }
}

function printSummary(report: FunTuningReport, context?: { suiteLabel?: string }): void {
  if (!report.bestTrial) {
    console.log('No trials completed.')
    return
  }

  if (context?.suiteLabel) {
    console.log(`Fun tuning completed for suite ${context.suiteLabel}.`)
  } else {
    console.log('Fun tuning completed.')
  }
  console.log(`Generations evaluated: ${report.generations.length}`)
  const startingReport = findStartingTrialReport(report)
  if (startingReport) {
    console.log(`Starting trial id: ${startingReport.trial.id}`)
    console.log(
      `Starting average fun score: ${startingReport.summary.averageFunScore.toFixed(3)}`,
    )
  }

  console.log(`Best trial id: ${report.bestTrial.trial.id}`)
  const bestScore = report.bestTrial.summary.averageFunScore
  console.log(`Average fun score (best trial): ${bestScore.toFixed(3)}`)

  const improvement = calculateFunScoreImprovement(report)
  if (improvement) {
    console.log(
      `Fun score improvement: ${improvement.signedAbsoluteChange} (${improvement.percentChangeLabel})`,
    )
  }

  console.log('Recommended config patch:')
  console.log(JSON.stringify(report.recommendedConfigPatch, null, 2))
}

function printSuiteCollectionSummary(results: TrialSuiteRunResult[]): void {
  if (!results.length) {
    console.log('No trial suites completed.')
    return
  }

  console.log(
    `Fun tuning completed for ${results.length} trial suite${results.length === 1 ? '' : 's'}.`,
  )

  for (const result of results) {
    const label = result.suite.label ?? result.suite.id
    console.log('')
    printSummary(result.report, { suiteLabel: label })
  }
}

async function main(): Promise<void> {
  const args = parseArguments(process.argv.slice(2))

  if (args.showHelp) {
    printUsage()
    return
  }

  if (!args.simulatorPath || !args.trialsPath) {
    printUsage()
    process.exitCode = 1
    return
  }

  let runStartTime: Date | null = null

  try {
    const runStart = new Date()
    runStartTime = runStart

    if (args.verbose) {
      console.log('Verbose status reporting enabled.')
      console.log(`Resolving simulator from ${args.simulatorPath}`)
    }

    const simulator = await resolveSimulator(args.simulatorPath)

    if (args.verbose) {
      console.log('Simulator resolved.')
      console.log(`Loading trials from ${args.trialsPath}`)
    }

    const rawTrialConfig = await readJsonFileSafe(args.trialsPath)
    const trialConfig = normalizeTrialConfig(rawTrialConfig as TrialConfigFile | TrialDefinition[])

    if (args.verbose) {
      const suiteCount = trialConfig.suites?.length ?? 0
      const trialCount = trialConfig.trials?.length ?? 0
      if (suiteCount > 0) {
        console.log(
          `Loaded ${suiteCount} trial suite${suiteCount === 1 ? '' : 's'} from configuration.`,
        )
      }
      if (trialCount > 0 && suiteCount === 0) {
        console.log(`Loaded ${trialCount} trial${trialCount === 1 ? '' : 's'} from configuration.`)
      }
    }

    const hasSuites = Array.isArray(trialConfig.suites) && trialConfig.suites.length > 0

    if (hasSuites) {
      const suiteResults: TrialSuiteRunResult[] = []
      const resolvedOutput = args.outputPath
        ? path.resolve(process.cwd(), args.outputPath)
        : null
      const outputPathInfo = resolvedOutput ? path.parse(resolvedOutput) : null
      const outputDir = outputPathInfo && outputPathInfo.dir ? outputPathInfo.dir : ''
      const baseOutputName = outputPathInfo && outputPathInfo.name ? outputPathInfo.name : 'results'
      const outputExtension = outputPathInfo && outputPathInfo.ext ? outputPathInfo.ext : '.json'

      for (const suite of trialConfig.suites!) {
        const suiteLabel = suite.label ?? suite.id
        const suiteOptionsBase = mergeOptions(trialConfig.options, suite.options ?? {})
        const suiteOptions = mergeOptions(suiteOptionsBase, args.overrides)

        if (args.verbose) {
          const trialCount = suite.trials.length
          const generationCount = suiteOptions.generations ?? 1
          console.log(
            `[${formatTimestamp(new Date())}] Starting trial suite ${suiteLabel} with ${trialCount} ` +
              `trial${trialCount === 1 ? '' : 's'} across ${generationCount} generation${generationCount === 1 ? '' : 's'}.`,
          )
          if (typeof suiteOptions.timeScale === 'number') {
            console.log(`Simulated time scale: ${suiteOptions.timeScale}x.`)
          }
        }

        const suiteStatusLogger = args.verbose
          ? createVerboseStatusLogger(new Date())
          : undefined
        const report = await runFunTuning(
          simulator,
          suite.trials,
          suiteOptions,
          suiteStatusLogger,
        )

        const suiteResult: TrialSuiteRunResult = {
          suite,
          report,
          improvement: calculateFunScoreImprovement(report),
          options: suiteOptions,
        }

        suiteResults.push(suiteResult)

        if (resolvedOutput) {
          const suitePrefix = sanitizeForFileName(suiteLabel)
          const suiteFileName = `${suitePrefix}-${baseOutputName}${outputExtension}`
          const suiteFilePath = path.join(outputDir || '.', suiteFileName)
          const suiteFileContents = {
            suites: [createSuiteOutputEntry(suiteResult)],
          }

          await writeFile(suiteFilePath, JSON.stringify(suiteFileContents, null, 2))

          if (args.verbose) {
            console.log(`Suite report saved to ${suiteFilePath}`)
          }
        }
      }

      printSuiteCollectionSummary(suiteResults)

      if (resolvedOutput) {
        const suiteOutput = {
          suites: suiteResults.map(result => createSuiteOutputEntry(result)),
        }
        await writeFile(resolvedOutput, JSON.stringify(suiteOutput, null, 2))
        console.log(`Full report saved to ${resolvedOutput}`)
      } else if (args.verbose) {
        console.log('No output path provided; skipping report file write.')
      }
    } else {
      const options = mergeOptions(trialConfig.options, args.overrides)
      if (args.verbose) {
        const generationCount = options.generations ?? 1
        console.log(
          `[${formatTimestamp(runStart)}] Starting fun tuning with ${generationCount} ` +
            `generation${generationCount === 1 ? '' : 's'}. ETA updates will be provided as data becomes available.`,
        )
        if (typeof options.timeScale === 'number') {
          console.log(`Simulated time scale: ${options.timeScale}x.`)
        }
      }

      const statusLogger = args.verbose ? createVerboseStatusLogger(runStart) : undefined
      const report = await runFunTuning(
        simulator,
        trialConfig.trials!,
        options,
        statusLogger,
      )

      printSummary(report)

      if (args.outputPath) {
        const resolvedOutput = path.resolve(process.cwd(), args.outputPath)
        await writeFile(resolvedOutput, JSON.stringify(report, null, 2))
        console.log(`Full report saved to ${resolvedOutput}`)
      } else if (args.verbose) {
        console.log('No output path provided; skipping report file write.')
      }
    }
  } catch (error) {
    console.error('Failed to run fun tuning:')
    if (error instanceof Error) {
      console.error(error.message)
    } else {
      console.error(error)
    }
    process.exitCode = 1
  } finally {
    if (runStartTime) {
      const finishTime = new Date()
      const totalDurationMs = finishTime.getTime() - runStartTime.getTime()
      console.log(
        `[${formatTimestamp(finishTime)}] Fun tuning command finished. Total runtime: ${formatDuration(totalDurationMs)} ` +
          `(${formatMinutes(totalDurationMs)}).`,
      )
    }
  }
}

await main()

function createVerboseStatusLogger(runStartTime: Date): (status: FunTuningStatus) => void {
  const generationStartTimes = new Map<number, Date>()
  const generationDurations: number[] = []

  return status => {
    const now = new Date()

    switch (status.type) {
      case 'generation-start':
        generationStartTimes.set(status.generation, now)
        console.log(
          `[${formatTimestamp(now)}] Generation ${status.generation}/${status.totalGenerations} started ` +
            `(mutation factor ${status.mutationFactor.toFixed(2)}). ${buildEtaMessage(
              now,
              generationDurations,
              status.totalGenerations - status.generation + 1,
            )}`,
        )
        console.log(
          `  Runtime so far: ${formatDuration(now.getTime() - runStartTime.getTime())}.`,
        )
        break
      case 'trial-start': {
        const label = status.trial.label ?? status.trial.id
        console.log(`  Running trial ${status.trialIndex}/${status.trialCount}: ${label}`)
        break
      }
      case 'trial-complete': {
        const label = status.trial.label ?? status.trial.id
        console.log(`  Completed trial ${status.trialIndex}/${status.trialCount}: ${label}`)
        break
      }
      case 'generation-complete':
        {
          const startedAt = generationStartTimes.get(status.generation)
          const durationMs = startedAt ? now.getTime() - startedAt.getTime() : undefined
          if (typeof durationMs === 'number') {
            generationDurations.push(durationMs)
          }

          const remainingGenerations = status.totalGenerations - status.generation
          const etaMessage = remainingGenerations > 0
            ? buildEtaMessage(now, generationDurations, remainingGenerations)
            : 'All generations complete.'
          const runtimeMessage = durationMs
            ? `in ${formatDuration(durationMs)} (${formatMinutes(durationMs)}).`
            : 'with unknown duration.'

          console.log(
            `[${formatTimestamp(now)}] Generation ${status.generation}/${status.totalGenerations} complete ${runtimeMessage} ${etaMessage}`,
          )
        }
        break
      default:
        break
    }
  }
}

function buildEtaMessage(
  now: Date,
  durations: number[],
  remainingGenerations: number,
): string {
  if (!durations.length || remainingGenerations <= 0) {
    return 'ETA pending.'
  }

  const averageMs = durations.reduce((total, value) => total + value, 0) / durations.length
  const remainingMs = averageMs * remainingGenerations
  const eta = new Date(now.getTime() + remainingMs)
  return `ETA ~${formatMinutes(remainingMs)} (approximately ${formatTimestamp(eta)}).`
}

function formatTimestamp(date: Date): string {
  return date.toISOString()
}

function formatDuration(durationMs: number): string {
  const totalSeconds = Math.max(0, Math.round(durationMs / 1000))
  const hours = Math.floor(totalSeconds / 3600)
  const minutes = Math.floor((totalSeconds % 3600) / 60)
  const seconds = totalSeconds % 60

  const parts: string[] = []
  if (hours) {
    parts.push(`${hours}h`)
  }
  if (minutes || hours) {
    parts.push(`${minutes}m`)
  }
  parts.push(`${seconds}s`)

  return parts.join(' ')
}

function formatMinutes(durationMs: number): string {
  return `${(durationMs / 60000).toFixed(1)} minutes`
}
