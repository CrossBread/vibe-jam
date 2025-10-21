/*
 * Copyright (c) 2025. CrossBread Tech All rights reserved.
 */

import { chromium } from 'playwright'
import { spawn } from 'child_process'
import fs from 'fs/promises'
import path from 'path'
import { fileURLToPath } from 'url'

interface ParameterChange {
  key: string
  before: unknown
  after: unknown
}

interface SuiteRecord {
  suite: string
  category: 'arena' | 'ball' | 'paddle'
  modKey: string
  generations: number
  startingTrialId: string
  startingAverage: number
  bestTrialId: string
  bestAverage: number
  improvement: number
  percentImprovement: number
  patch: Record<string, unknown>
  parameterChanges: ParameterChange[]
}

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const repoRoot = path.resolve(__dirname, '..')
const logPath = path.join(repoRoot, 'reports', 'fun-tuning-all-log.txt')
const devConfigPath = path.join(repoRoot, 'src', 'game', 'devConfig.json')
const screenshotDir = path.join(repoRoot, 'reports', 'screenshots', 'fun-tuning')
const csvPath = path.join(repoRoot, 'reports', 'fun-tuning-summary.csv')
const markdownPath = path.join(repoRoot, 'reports', 'fun-tuning-report.md')
const serverUrl = 'http://127.0.0.1:4173/'

function slugifySuite(suite: string): string {
  return suite.replace(/[^a-zA-Z0-9]+/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '')
}

function parseFunTuningLog(text: string): SuiteRecord[] {
  const records: SuiteRecord[] = []
  let index = 0
  while (index < text.length) {
    const start = text.indexOf('Fun tuning completed for suite', index)
    if (start === -1) break
    const suiteLineEnd = text.indexOf('\n', start)
    const suiteLine = text
      .slice(start, suiteLineEnd === -1 ? undefined : suiteLineEnd)
      .trim()
    const suiteMatch = suiteLine.match(/Fun tuning completed for suite ([^.]+\.[^.]*)\./)
    if (!suiteMatch) {
      index = suiteLineEnd === -1 ? text.length : suiteLineEnd + 1
      continue
    }
    const suite = suiteMatch[1] as SuiteRecord['suite']

    const sectionStart = suiteLineEnd === -1 ? text.length : suiteLineEnd + 1
    const nextSuiteIndex = text.indexOf('Fun tuning completed for suite', sectionStart)
    const sectionEnd = nextSuiteIndex === -1 ? text.length : nextSuiteIndex
    const section = text.slice(sectionStart, sectionEnd)

    const generationsMatch = section.match(/Generations evaluated: (\d+)/)
    const startingTrialMatch = section.match(/Starting trial id: ([^\n]+)/)
    const startingAvgMatch = section.match(/Starting average fun score: ([0-9.]+)/)
    const bestTrialMatch = section.match(/Best trial id: ([^\n]+)/)
    const bestAvgMatch = section.match(/Average fun score \(best trial\): ([0-9.]+)/)
    const improvementMatch = section.match(/Fun score improvement: ([+\-0-9.]+) \(([+\-0-9.]+)%\)/)
    const patchLabelIndex = section.indexOf('Recommended config patch:')
    if (
      !generationsMatch ||
      !startingTrialMatch ||
      !startingAvgMatch ||
      !bestTrialMatch ||
      !bestAvgMatch ||
      !improvementMatch ||
      patchLabelIndex === -1
    ) {
      index = sectionEnd
      continue
    }

    const patchStartInSection = section.indexOf('{', patchLabelIndex)
    if (patchStartInSection === -1) {
      index = sectionEnd
      continue
    }

    let braceCount = 0
    let patchEndInSection = patchStartInSection
    while (patchEndInSection < section.length) {
      const char = section[patchEndInSection]
      if (char === '{') {
        braceCount += 1
      } else if (char === '}') {
        braceCount -= 1
        if (braceCount === 0) {
          patchEndInSection += 1
          break
        }
      }
      patchEndInSection += 1
    }

    const patchJson = section.slice(patchStartInSection, patchEndInSection)
    let patch: any
    try {
      patch = JSON.parse(patchJson)
    } catch (error) {
      console.error(`Failed to parse patch for ${suite}:`, error)
      index = sectionEnd
      continue
    }

    const [categoryRaw, modKey] = suite.split('.') as [SuiteRecord['category'], string]
    const category = categoryRaw as SuiteRecord['category']
    const modPatch = patch?.modifiers?.[category]?.[modKey] ?? {}

    records.push({
      suite,
      category,
      modKey,
      generations: Number.parseInt(generationsMatch[1], 10),
      startingTrialId: startingTrialMatch[1],
      startingAverage: Number.parseFloat(startingAvgMatch[1]),
      bestTrialId: bestTrialMatch[1],
      bestAverage: Number.parseFloat(bestAvgMatch[1]),
      improvement: Number.parseFloat(improvementMatch[1]),
      percentImprovement: Number.parseFloat(improvementMatch[2]),
      patch: modPatch,
      parameterChanges: [],
    })

    index = sectionEnd
  }

  return records
}

function formatNumber(value: number, fractionDigits: number): string {
  return value.toFixed(fractionDigits)
}

function toCsv(records: SuiteRecord[]): string {
  const header = [
    'suite',
    'starting_avg_fun_score',
    'best_trial_id',
    'best_avg_fun_score',
    'fun_score_improvement',
    'percent_improvement',
  ]
  const lines = [header.join(',')]
  for (const record of records) {
    lines.push(
      [
        record.suite,
        formatNumber(record.startingAverage, 3),
        record.bestTrialId,
        formatNumber(record.bestAverage, 3),
        formatNumber(record.improvement, 3),
        formatNumber(record.percentImprovement, 1),
      ].join(','),
    )
  }
  return lines.join('\n') + '\n'
}

type DevServerProcess = ReturnType<typeof spawn>

async function startDevServer(): Promise<DevServerProcess> {
  const proc = spawn('npm', ['run', 'dev', '--', '--host', '127.0.0.1', '--port', '4173'], {
    cwd: repoRoot,
    stdio: ['ignore', 'pipe', 'pipe'],
    env: {
      ...process.env,
      BROWSER: 'none',
    },
  })

  proc.stdout?.setEncoding('utf8')
  proc.stderr?.setEncoding('utf8')

  proc.stdout?.on('data', chunk => {
    process.stdout.write(chunk)
  })
  proc.stderr?.on('data', chunk => {
    process.stderr.write(chunk)
  })

  const timeoutMs = 60_000
  const start = Date.now()
  while (Date.now() - start < timeoutMs) {
    try {
      const response = await fetch(serverUrl, { method: 'GET' })
      if (response.ok) {
        return proc
      }
    } catch {
      // ignore until server starts
    }
    await new Promise(resolve => setTimeout(resolve, 500))
    if (proc.exitCode !== null) {
      throw new Error(`Dev server exited with code ${proc.exitCode}`)
    }
  }

  proc.kill('SIGTERM')
  throw new Error('Dev server failed to start within timeout')
}

async function stopDevServer(proc: DevServerProcess) {
  if (!proc.kill('SIGTERM')) {
    return
  }

  await new Promise<void>(resolve => {
    let settled = false
    const timer = setTimeout(() => {
      if (!settled) {
        settled = true
        proc.kill('SIGKILL')
        resolve()
      }
    }, 3000)

    proc.once('exit', () => {
      if (!settled) {
        settled = true
        clearTimeout(timer)
        resolve()
      }
    })
  })
}

async function captureScreenshots(records: SuiteRecord[]) {
  await fs.mkdir(screenshotDir, { recursive: true })
  const browser = await chromium.launch()

  try {
    for (const record of records) {
      const slug = slugifySuite(record.suite)
      const beforePath = path.join(screenshotDir, `${slug}-before.png`)
      const afterPath = path.join(screenshotDir, `${slug}-after.png`)

      const context = await browser.newContext({ viewport: { width: 1280, height: 720 } })
      const page = await context.newPage()
      await page.goto(serverUrl, { waitUntil: 'networkidle' })
      await page.waitForTimeout(1500)

      await page.evaluate(({ category, modKey }) => {
        const pong: any = (window as any).__pong
        if (!pong) {
          throw new Error('Pong instance not found')
        }

        const modifiers = pong.config.modifiers
        for (const key of Object.keys(modifiers.arena)) {
          modifiers.arena[key].enabled = false
        }
        for (const key of Object.keys(modifiers.ball)) {
          modifiers.ball[key].enabled = false
        }
        for (const key of Object.keys(modifiers.paddle)) {
          modifiers.paddle[key].enabled = false
        }

        const target = modifiers[category][modKey]
        if (!target) {
          throw new Error(`Modifier not found: ${category}.${modKey}`)
        }

        target.enabled = true
        pong.reset()
      }, { category: record.category, modKey: record.modKey })

      await page.waitForTimeout(5000)
      await page.screenshot({ path: beforePath, fullPage: true })

      await page.evaluate(({ category, modKey, patch }) => {
        const pong: any = (window as any).__pong
        if (!pong) {
          throw new Error('Pong instance not found')
        }
        const target = pong.config.modifiers[category][modKey]
        if (!target) {
          throw new Error(`Modifier not found: ${category}.${modKey}`)
        }
        for (const [key, value] of Object.entries(patch)) {
          if (key === 'enabled') {
            continue
          }
          ;(target as any)[key] = value
        }
        pong.reset()
      }, { category: record.category, modKey: record.modKey, patch: record.patch })

      await page.waitForTimeout(5000)
      await page.screenshot({ path: afterPath, fullPage: true })
      await context.close()
    }
  } finally {
    await browser.close()
  }
}

function formatValue(value: unknown): string {
  if (value === undefined) return '—'
  if (typeof value === 'number') {
    if (Number.isInteger(value)) {
      return value.toString()
    }
    return value.toFixed(6).replace(/0+$/, '').replace(/\.$/, '')
  }
  if (typeof value === 'boolean') {
    return value ? 'true' : 'false'
  }
  return String(value)
}

async function writeMarkdown(records: SuiteRecord[]) {
  let content = '# Fun Tuning Comparison Report\n\n'
  content += `Generated on ${new Date().toISOString()}\n\n`

  for (const record of records) {
    const slug = slugifySuite(record.suite)
    content += `## ${record.suite}\n\n`
    content += `- Generations evaluated: ${record.generations}\n`
    content += `- Starting trial id: ${record.startingTrialId}\n`
    content += `- Starting average fun score: ${formatNumber(record.startingAverage, 3)}\n`
    content += `- Best trial id: ${record.bestTrialId}\n`
    content += `- Average fun score (best trial): ${formatNumber(record.bestAverage, 3)}\n`
    content += `- Fun score improvement: ${formatNumber(record.improvement, 3)} (${formatNumber(record.percentImprovement, 1)}%)\n\n`

    if (record.parameterChanges.length > 0) {
      content += '| Parameter | Before | After |\n'
      content += '| --- | --- | --- |\n'
      for (const change of record.parameterChanges) {
        content += `| ${change.key} | ${formatValue(change.before)} | ${formatValue(change.after)} |\n`
      }
      content += '\n'
    } else {
      content += 'No parameter changes recorded.\n\n'
    }

    content += `![${record.suite} before](./screenshots/fun-tuning/${slug}-before.png)\n\n`
    content += `![${record.suite} after](./screenshots/fun-tuning/${slug}-after.png)\n\n`
  }

  await fs.writeFile(markdownPath, content, 'utf8')
}

function stripBom(text: string): string {
  return text.replace(/^\uFEFF/, '')
}

async function main() {
  const [logTextRaw, devConfigRaw] = await Promise.all([
    fs.readFile(logPath, 'utf8'),
    fs.readFile(devConfigPath, 'utf8'),
  ])
  const logText = stripBom(logTextRaw)
  const devConfig = JSON.parse(stripBom(devConfigRaw))
  const records = parseFunTuningLog(logText)

  for (const record of records) {
    const baseModifier = devConfig?.modifiers?.[record.category]?.[record.modKey] ?? {}
    const parameterChanges: ParameterChange[] = []
    for (const [key, value] of Object.entries(record.patch)) {
      if (key === 'enabled') continue
      const beforeValue = baseModifier?.[key as keyof typeof baseModifier]
      parameterChanges.push({ key, before: beforeValue, after: value })
    }
    record.parameterChanges = parameterChanges
  }

  const csvContent = toCsv(records)
  await fs.writeFile(csvPath, csvContent, 'utf8')

  const serverProcess = await startDevServer()
  try {
    await captureScreenshots(records)
  } finally {
    await stopDevServer(serverProcess)
  }

  await writeMarkdown(records)
}

main().catch(error => {
  console.error(error)
  process.exitCode = 1
})
