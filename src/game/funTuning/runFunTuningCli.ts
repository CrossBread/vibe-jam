import fs from 'node:fs/promises'
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
  trials: TrialDefinition[]
  options?: FunTuningOptions
}

function printUsage(): void {
  console.log(`Fun tuning CLI\n\n` +
    `Usage: npm run fun-tuning -- --simulator ./path/to/simulator.ts --trials ./trials.json [options]\n\n` +
    `Required flags:\n` +
    `  --simulator    Path to a module exporting a HeadlessMatchSimulator or a createSimulator() factory.\n` +
    `  --trials       Path to a JSON file containing an array of trials or { \'trials\': [...], \'options\': {...} }.\n\n` +
    `Optional flags:\n` +
    `  --output               Where to write the full report as JSON. Defaults to stdout only.\n` +
    `  --repetitions          Override repetitions per trial.\n` +
    `  --ai-misalignment      Override AI misalignment value (0-1).\n` +
    `  --score-limit          Override the score limit.\n` +
    `  --mutation-survivors   Override survivor count per generation.\n` +
    `  --generations          Override total generations to run.\n` +
    `  --concurrency          Number of matches to simulate in parallel (default 1).\n` +
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
  const raw = await fs.readFile(abs, 'utf8');
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

  if (!Array.isArray(data.trials)) {
    throw new Error('Trial config must include a "trials" array.')
  }

  return data
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

function printSummary(report: FunTuningReport): void {
  if (!report.bestTrial) {
    console.log('No trials completed.')
    return
  }

  console.log('Fun tuning completed.')
  console.log(`Generations evaluated: ${report.generations.length}`)
  console.log(`Best trial id: ${report.bestTrial.trial.id}`)
  console.log(`Average fun score: ${report.bestTrial.summary.averageFunScore.toFixed(3)}`)
  console.log('Recommended config patch:')
  console.log(JSON.stringify(report.recommendedConfigPatch, null, 2))
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

  try {
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
      const trialCount = trialConfig.trials.length
      console.log(`Loaded ${trialCount} trial${trialCount === 1 ? '' : 's'} from configuration.`)
    }

    const options = mergeOptions(trialConfig.options, args.overrides)

    if (args.verbose) {
      const generationCount = options.generations ?? 1
      console.log(`Starting fun tuning with ${generationCount} generation${generationCount === 1 ? '' : 's'}.`)
    }

    const statusLogger = args.verbose ? createVerboseStatusLogger() : undefined
    const report = await runFunTuning(
      simulator,
      trialConfig.trials,
      options,
      statusLogger,
    )

    if (args.verbose) {
      console.log('Fun tuning run finished.')
    }

    printSummary(report)

    if (args.outputPath) {
      const resolvedOutput = path.resolve(process.cwd(), args.outputPath)
      await fs.writeFile(resolvedOutput, JSON.stringify(report, null, 2))
      console.log(`Full report saved to ${resolvedOutput}`)
    } else if (args.verbose) {
      console.log('No output path provided; skipping report file write.')
    }
  } catch (error) {
    console.error('Failed to run fun tuning:')
    if (error instanceof Error) {
      console.error(error.message)
    } else {
      console.error(error)
    }
    process.exitCode = 1
  }
}

await main()

function createVerboseStatusLogger(): (status: FunTuningStatus) => void {
  return status => {
    switch (status.type) {
      case 'generation-start':
        console.log(
          `Generation ${status.generation}/${status.totalGenerations} started (mutation factor ${status.mutationFactor.toFixed(2)}).`,
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
        console.log(`Generation ${status.generation}/${status.totalGenerations} complete.`)
        break
      default:
        break
    }
  }
}
