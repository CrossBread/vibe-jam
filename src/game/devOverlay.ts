/*
 * Copyright (c) 2025. CrossBread Tech All rights reserved.
 */

import {
  BALL_MODIFIER_KEYS,
  GRAVITY_WELL_KEYS,
  PADDLE_MODIFIER_KEYS,
  deepClone,
  type DevConfig,
  type GravityWellModifier,
  type ModifierBase,
  type KiteModifier,
  type BumShuffleModifier,
  type PollokModifier,
  type SnowballModifier,
  type MeteorModifier,
  type ApparitionModifier,
  type OutOfBodyModifier,
  type BendyModifier,
  type ChillyModifier,
  type BuckToothModifier,
  type OsteoWhatModifier,
  type BrokePhysicsModifier,
  type HadronModifier,
  type FoosballModifier,
  type DizzyModifier,
  type BungeeModifier,
  type MissileCommanderModifier,
  type FrisbeeModifier,
  type DundeeModifier,
  type ModifiersConfig,
  type DoublesConfig,
} from './devtools'
import { arenaModifierBuilders } from './mods/arena'
import { ballModifierBuilders } from './mods/ball'
import { paddleModifierBuilders } from './mods/paddle'
import {
  createSliderControl,
  createToggleControl,
  type CreateModifierDetails,
} from './mods/shared'

export const DEV_OVERLAY_STATS_TOGGLE_EVENT = 'devtools:stats-toggle'

export interface DevOverlayStatsToggleDetail {
  enabled: boolean
}

export interface DevOverlayStatsSnapshot {
  averageFps: number
  averageFrameTime: number
  onePercentLowFps: number
  longFrameShare: number
  longFrameThresholdMs: number
  worstFrameTime: number
  sampleCount: number
}

export interface DevOverlayApi {
  setStatsEnabled(enabled: boolean): void
  updateStats(stats: DevOverlayStatsSnapshot | null): void
}

export type DevOverlayElement = HTMLDivElement & {
  __devtools?: DevOverlayApi
}

let devOverlayStylesInjected = false

interface DevOverlayOptions {
  onDockChange?: (docked: boolean) => void
}

function ensureDevOverlayStyles() {
  if (devOverlayStylesInjected) return
  const style = document.createElement('style')
  style.textContent = `
    .dev-overlay-container {
      position: relative;
    }
    .dev-overlay-container.dev-overlay-container--docked {
      display: flex;
      align-items: flex-start;
      gap: 16px;
      width: 100%;
      box-sizing: border-box;
      padding: 16px;
      flex-wrap: nowrap;
    }
    .dev-overlay-container.dev-overlay-container--docked canvas {
      flex: 1 1 auto;
      min-width: 0;
      height: auto;
      max-width: 100%;
      max-height: calc(100vh - 32px);
    }
    .dev-overlay {
      position: fixed;
      top: 16px;
      right: 16px;
      width: 280px;
      padding: 16px;
      border-radius: 12px;
      background: rgba(15, 23, 42, 0.95);
      color: #e2e8f0;
      border: 1px solid rgba(148, 163, 184, 0.35);
      box-shadow: 0 12px 32px rgba(15, 23, 42, 0.45);
      font-family: 'Inter', ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
      font-size: 13px;
      line-height: 1.4;
      z-index: 9999;
      display: none;
      backdrop-filter: blur(10px);
      max-height: calc(100vh - 32px);
      overflow-y: auto;
      touch-action: pan-y;
      -webkit-overflow-scrolling: touch;
    }
    .dev-overlay.dev-overlay--visible {
      display: block;
    }
    .dev-overlay.dev-overlay--docked {
      position: relative;
      top: 0;
      right: 0;
      margin: 0;
      height: calc(100vh - 32px);
      max-height: none;
      width: 320px;
      display: none;
      flex: 0 0 320px;
    }
    .dev-overlay.dev-overlay--docked.dev-overlay--visible {
      display: flex;
      flex-direction: column;
    }
    @media (max-width: 768px) {
      .dev-overlay-container.dev-overlay-container--docked {
        flex-direction: column;
        align-items: stretch;
        justify-content: center;
        gap: 12px;
        padding: 12px;
      }
      .dev-overlay-container.dev-overlay-container--docked canvas {
        max-height: none;
        width: 100%;
      }
      .dev-overlay.dev-overlay--docked {
        width: 100%;
        max-width: none;
        height: auto;
        max-height: min(70vh, 520px);
      }
    }
    .dev-overlay__title {
      font-size: 14px;
      font-weight: 600;
      margin-bottom: 12px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 12px;
    }
    .dev-overlay__title-meta {
      display: flex;
      flex-direction: column;
      align-items: flex-end;
      gap: 6px;
    }
    .dev-overlay__title-actions {
      display: flex;
      align-items: center;
      gap: 8px;
    }
    .dev-overlay__dock-toggle {
      display: flex;
      align-items: center;
      gap: 6px;
      font-size: 11px;
      text-transform: uppercase;
      letter-spacing: 0.08em;
      color: rgba(226, 232, 240, 0.7);
      cursor: pointer;
      white-space: nowrap;
    }
    .dev-overlay__dock-toggle input {
      width: 14px;
      height: 14px;
    }
    .dev-overlay__hint {
      color: rgba(226, 232, 240, 0.65);
      font-size: 11px;
      text-transform: uppercase;
      letter-spacing: 0.08em;
      white-space: nowrap;
    }
    .dev-overlay__collapse-all {
      background: none;
      border: 1px solid rgba(148, 163, 184, 0.35);
      color: inherit;
      border-radius: 6px;
      font-size: 11px;
      padding: 4px 8px;
      cursor: pointer;
      transition: background 0.2s ease, border-color 0.2s ease;
    }
    .dev-overlay__collapse-all:hover {
      background: rgba(71, 85, 105, 0.35);
      border-color: rgba(148, 163, 184, 0.6);
    }
    .dev-overlay__content {
      display: flex;
      flex-direction: column;
      gap: 12px;
    }
    .dev-overlay__controls {
      display: flex;
      flex-direction: column;
      gap: 10px;
    }
    .dev-overlay__control {
      display: flex;
      flex-direction: column;
      gap: 4px;
    }
    .dev-overlay__label {
      display: flex;
      align-items: center;
      justify-content: space-between;
      font-weight: 500;
      gap: 8px;
    }
    .dev-overlay__value {
      font-variant-numeric: tabular-nums;
      color: rgba(226, 232, 240, 0.85);
    }
    .dev-overlay__card {
      display: flex;
      flex-direction: column;
      gap: 12px;
      padding: 14px;
      border-radius: 12px;
      background: rgba(30, 41, 59, 0.55);
      border: 1px solid rgba(148, 163, 184, 0.25);
    }
    .dev-overlay__card--active {
      border-color: rgba(96, 165, 250, 0.55);
      box-shadow: 0 0 0 1px rgba(96, 165, 250, 0.15);
    }
    .dev-overlay__card-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 12px;
    }
    .dev-overlay__card-title {
      font-size: 13px;
      font-weight: 600;
      color: rgba(226, 232, 240, 0.92);
    }
    .dev-overlay__card-body {
      display: flex;
      flex-direction: column;
      gap: 10px;
    }
    .dev-overlay__card-empty {
      margin: 0;
      font-size: 12px;
      color: rgba(226, 232, 240, 0.75);
    }
    .dev-overlay__card-meta {
      font-size: 11px;
      color: rgba(148, 163, 184, 0.9);
    }
    .dev-overlay__card-hint {
      font-size: 11px;
      color: rgba(148, 163, 184, 0.75);
    }
    .dev-overlay__metrics {
      display: grid;
      grid-template-columns: repeat(2, minmax(0, 1fr));
      gap: 10px;
    }
    .dev-overlay__metric {
      display: flex;
      flex-direction: column;
      gap: 4px;
      padding: 10px;
      border-radius: 10px;
      background: rgba(15, 23, 42, 0.55);
      border: 1px solid rgba(148, 163, 184, 0.18);
    }
    .dev-overlay__metric-label {
      font-size: 11px;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.08em;
      color: rgba(148, 163, 184, 0.85);
    }
    .dev-overlay__metric-value {
      font-size: 18px;
      font-weight: 600;
      color: rgba(226, 232, 240, 0.95);
      font-variant-numeric: tabular-nums;
    }
    .dev-overlay__metric-description {
      font-size: 11px;
      color: rgba(148, 163, 184, 0.8);
    }
    .dev-overlay__toggle {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      font-size: 12px;
      color: rgba(226, 232, 240, 0.85);
      cursor: pointer;
    }
    .dev-overlay__toggle-input {
      width: 16px;
      height: 16px;
      flex-shrink: 0;
    }
    .dev-overlay__toggle-status {
      font-weight: 600;
      color: rgba(96, 165, 250, 0.9);
      font-variant-numeric: tabular-nums;
    }
    .dev-overlay__section {
      display: flex;
      flex-direction: column;
      gap: 10px;
      padding-top: 12px;
      margin-top: 12px;
      border-top: 1px solid rgba(148, 163, 184, 0.35);
    }
    .dev-overlay__section-title {
      font-size: 12px;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.08em;
      color: rgba(226, 232, 240, 0.7);
    }
    .dev-overlay__modifiers {
      display: flex;
      flex-direction: column;
      gap: 10px;
    }
    .dev-overlay__modifier {
      border-radius: 10px;
      background: rgba(30, 41, 59, 0.6);
      border: 1px solid rgba(148, 163, 184, 0.2);
      overflow: hidden;
    }
    .dev-overlay__modifier summary {
      display: flex;
      align-items: center;
      justify-content: flex-start;
      gap: 12px;
      padding: 10px;
      font-weight: 500;
      cursor: pointer;
      list-style: none;
    }
    .dev-overlay__modifier summary::-webkit-details-marker {
      display: none;
    }
    .dev-overlay__modifier summary::after {
      content: '';
      width: 8px;
      height: 8px;
      border-right: 2px solid rgba(226, 232, 240, 0.7);
      border-bottom: 2px solid rgba(226, 232, 240, 0.7);
      transform: rotate(45deg);
      margin-left: auto;
      transition: transform 0.2s ease;
    }
    .dev-overlay__modifier[open] summary::after {
      transform: rotate(225deg);
    }
    .dev-overlay__modifier-header {
      display: flex;
      align-items: center;
      gap: 8px;
      min-width: 0;
    }
    .dev-overlay__modifier-toggle {
      flex-shrink: 0;
    }
    .dev-overlay__modifier-name {
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
    .dev-overlay__collapsible {
      border-top: 1px solid rgba(148, 163, 184, 0.35);
      padding-top: 12px;
      margin-top: 12px;
    }
    .dev-overlay__collapsible summary {
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 12px;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.08em;
      color: rgba(226, 232, 240, 0.7);
      cursor: pointer;
      list-style: none;
    }
    .dev-overlay__collapsible summary::-webkit-details-marker {
      display: none;
    }
    .dev-overlay__collapsible summary::after {
      content: '';
      width: 8px;
      height: 8px;
      border-right: 2px solid rgba(226, 232, 240, 0.7);
      border-bottom: 2px solid rgba(226, 232, 240, 0.7);
      transform: rotate(45deg);
      margin-left: auto;
      transition: transform 0.2s ease;
    }
    .dev-overlay__collapsible[open] summary::after {
      transform: rotate(225deg);
    }
    .dev-overlay__collapsible-body {
      display: flex;
      flex-direction: column;
      gap: 10px;
      padding-top: 12px;
      margin-top: 12px;
      border-top: 1px solid rgba(148, 163, 184, 0.35);
    }
    .dev-overlay__modifier-body {
      display: flex;
      flex-direction: column;
      gap: 8px;
      padding: 0 10px 10px;
    }
    .dev-overlay__description {
      margin: 0;
      color: rgba(226, 232, 240, 0.75);
      font-size: 12px;
    }
    .dev-overlay__buttons {
      display: flex;
      flex-direction: column;
      gap: 8px;
      margin-top: 16px;
    }
    .dev-overlay__buttons-row {
      display: flex;
      gap: 8px;
    }
    .dev-overlay__button {
      flex: 1;
      padding: 10px 12px;
      border-radius: 8px;
      border: 1px solid rgba(148, 163, 184, 0.35);
      background: rgba(51, 65, 85, 0.6);
      color: inherit;
      cursor: pointer;
      font-weight: 500;
      transition: background 0.2s ease, border-color 0.2s ease;
    }
    .dev-overlay__button:hover {
      background: rgba(71, 85, 105, 0.65);
      border-color: rgba(148, 163, 184, 0.6);
    }
    .dev-overlay input,
    .dev-overlay button,
    .dev-overlay select,
    .dev-overlay summary {
      touch-action: manipulation;
    }
    .dev-overlay__status {
      margin-top: 12px;
      font-size: 12px;
      color: rgba(148, 163, 184, 0.9);
    }
    .dev-overlay__status--error {
      color: #f87171;
    }
    .dev-overlay__scroll-top {
      width: 100%;
      margin-top: 12px;
    }
    .dev-overlay input[type='range'] {
      width: 100%;
    }
    .dev-overlay__color-input {
      width: 100%;
      height: 32px;
      border-radius: 8px;
      border: 1px solid rgba(148, 163, 184, 0.35);
      background: rgba(15, 23, 42, 0.35);
      padding: 0;
      cursor: pointer;
    }
    .dev-overlay__color-input::-webkit-color-swatch-wrapper {
      padding: 0;
    }
    .dev-overlay__color-input::-webkit-color-swatch {
      border: none;
      border-radius: 6px;
    }
    .dev-overlay__color-input::-moz-color-swatch {
      border: none;
      border-radius: 6px;
    }
    .dev-overlay input[type='checkbox'] {
      width: 16px;
      height: 16px;
    }
  `
  document.head.appendChild(style)
  devOverlayStylesInjected = true
}

export function createDevOverlay(
  config: DevConfig,
  defaults: DevConfig,
  options: DevOverlayOptions = {},
): DevOverlayElement {
  ensureDevOverlayStyles()

  const overlay = document.createElement('div') as DevOverlayElement
  overlay.className = 'dev-overlay'
  overlay.setAttribute('aria-hidden', 'true')

  const { onDockChange } = options

  const title = document.createElement('div')
  title.className = 'dev-overlay__title'

  const heading = document.createElement('span')
  heading.textContent = 'Dev Controls'

  const titleMeta = document.createElement('div')
  titleMeta.className = 'dev-overlay__title-meta'

  const titleActions = document.createElement('div')
  titleActions.className = 'dev-overlay__title-actions'

  const hint = document.createElement('span')
  hint.className = 'dev-overlay__hint'
  hint.textContent = 'Press ` or hold 3 fingers to open'

  const collapseAllButton = document.createElement('button')
  collapseAllButton.type = 'button'
  collapseAllButton.className = 'dev-overlay__collapse-all'
  collapseAllButton.textContent = 'Collapse All'

  const dockToggleLabel = document.createElement('label')
  dockToggleLabel.className = 'dev-overlay__dock-toggle'

  const dockToggle = document.createElement('input')
  dockToggle.type = 'checkbox'
  dockToggle.addEventListener('change', () => {
    const docked = dockToggle.checked
    overlay.classList.toggle('dev-overlay--docked', docked)
    onDockChange?.(docked)
  })

  const dockToggleText = document.createElement('span')
  dockToggleText.textContent = 'Dock panel'

  dockToggleLabel.appendChild(dockToggle)
  dockToggleLabel.appendChild(dockToggleText)

  titleActions.appendChild(dockToggleLabel)
  titleActions.appendChild(collapseAllButton)

  titleMeta.appendChild(hint)
  titleMeta.appendChild(titleActions)
  title.appendChild(heading)
  title.appendChild(titleMeta)

  const content = document.createElement('div')
  content.className = 'dev-overlay__content'

  type MetricKey =
    | 'averageFps'
    | 'averageFrameTime'
    | 'onePercentLowFps'
    | 'longFrameShare'

  const statsCard = document.createElement('section')
  statsCard.className = 'dev-overlay__card'

  const statsHeader = document.createElement('div')
  statsHeader.className = 'dev-overlay__card-header'

  const statsTitle = document.createElement('div')
  statsTitle.className = 'dev-overlay__card-title'
  statsTitle.textContent = 'Performance Stats'

  const statsToggle = document.createElement('label')
  statsToggle.className = 'dev-overlay__toggle'

  const statsToggleInput = document.createElement('input')
  statsToggleInput.type = 'checkbox'
  statsToggleInput.className = 'dev-overlay__toggle-input'
  statsToggleInput.title = 'Enable performance stats'
  statsToggleInput.setAttribute('aria-label', 'Enable performance stats')

  const statsToggleLabel = document.createElement('span')
  statsToggleLabel.textContent = 'Show stats'

  const statsToggleStatus = document.createElement('span')
  statsToggleStatus.className = 'dev-overlay__toggle-status'

  statsToggle.appendChild(statsToggleInput)
  statsToggle.appendChild(statsToggleLabel)
  statsToggle.appendChild(statsToggleStatus)

  statsHeader.appendChild(statsTitle)
  statsHeader.appendChild(statsToggle)

  const statsBody = document.createElement('div')
  statsBody.className = 'dev-overlay__card-body'

  const statsMetrics = document.createElement('div')
  statsMetrics.className = 'dev-overlay__metrics'
  statsMetrics.hidden = true

  const metricValueElements = {} as Record<MetricKey, HTMLSpanElement>
  let longFrameLabelEl: HTMLSpanElement | null = null

  const metricsConfig: Array<{
    key: MetricKey
    label: string
    description: string
  }> = [
    {
      key: 'averageFps',
      label: 'Average FPS',
      description: 'Rolling window',
    },
    {
      key: 'averageFrameTime',
      label: 'Avg Frame Time',
      description: 'Milliseconds',
    },
    {
      key: 'onePercentLowFps',
      label: '1% Low FPS',
      description: '99th percentile',
    },
    {
      key: 'longFrameShare',
      label: 'Long Frames (> 20 ms)',
      description: 'Share of slow frames',
    },
  ]

  for (const metric of metricsConfig) {
    const metricEl = document.createElement('div')
    metricEl.className = 'dev-overlay__metric'

    const metricLabel = document.createElement('span')
    metricLabel.className = 'dev-overlay__metric-label'
    metricLabel.textContent = metric.label
    if (metric.key === 'longFrameShare') {
      longFrameLabelEl = metricLabel
    }

    const metricValue = document.createElement('span')
    metricValue.className = 'dev-overlay__metric-value'
    metricValue.textContent = '–'

    const metricDescription = document.createElement('span')
    metricDescription.className = 'dev-overlay__metric-description'
    metricDescription.textContent = metric.description

    metricEl.appendChild(metricLabel)
    metricEl.appendChild(metricValue)
    metricEl.appendChild(metricDescription)
    statsMetrics.appendChild(metricEl)

    metricValueElements[metric.key] = metricValue
  }

  const statsEmpty = document.createElement('p')
  statsEmpty.className = 'dev-overlay__card-empty'
  statsEmpty.textContent = 'Performance stats are disabled.'

  const statsMeta = document.createElement('div')
  statsMeta.className = 'dev-overlay__card-meta'
  statsMeta.hidden = true

  const statsHint = document.createElement('div')
  statsHint.className = 'dev-overlay__card-hint'
  statsHint.textContent =
    'Rolling window: last 240 frames (~4s). Frame budget (60fps): 16.7 ms.'

  statsBody.appendChild(statsMetrics)
  statsBody.appendChild(statsEmpty)
  statsBody.appendChild(statsMeta)
  statsBody.appendChild(statsHint)

  statsCard.appendChild(statsHeader)
  statsCard.appendChild(statsBody)

  let statsEnabled = false
  let hasStatsData = false

  function formatNumber(value: number, fractionDigits: number) {
    if (!Number.isFinite(value)) return '–'
    return value.toFixed(fractionDigits)
  }

  function renderStats(stats: DevOverlayStatsSnapshot | null) {
    if (!statsEnabled) {
      hasStatsData = false
      statsMetrics.hidden = true
      statsMeta.hidden = true
      statsMeta.textContent = ''
      statsEmpty.hidden = false
      statsEmpty.textContent = 'Performance stats are disabled.'
      return
    }

    if (!stats) {
      hasStatsData = false
      statsMetrics.hidden = true
      statsMeta.hidden = true
      statsMeta.textContent = ''
      statsEmpty.hidden = false
      statsEmpty.textContent = 'Collecting samples…'
      return
    }

    hasStatsData = true
    statsMetrics.hidden = false
    statsEmpty.hidden = true
    statsMeta.hidden = false

    metricValueElements.averageFps.textContent = formatNumber(stats.averageFps, 1)
    metricValueElements.averageFrameTime.textContent = `${formatNumber(stats.averageFrameTime, 1)} ms`
    metricValueElements.onePercentLowFps.textContent = formatNumber(
      stats.onePercentLowFps,
      1,
    )
    metricValueElements.longFrameShare.textContent = `${formatNumber(
      stats.longFrameShare,
      1,
    )}%`

    if (longFrameLabelEl) {
      longFrameLabelEl.textContent = `Long Frames (> ${formatNumber(
        stats.longFrameThresholdMs,
        1,
      )} ms)`
    }

    statsMeta.textContent = `Samples: ${stats.sampleCount} • Worst: ${formatNumber(
      stats.worstFrameTime,
      1,
    )} ms`
  }

  function setStatsEnabled(
    next: boolean,
    { emitEvent = false }: { emitEvent?: boolean } = {},
  ) {
    const stateChanged = statsEnabled !== next
    statsEnabled = next
    statsToggleInput.checked = next
    statsToggleStatus.textContent = next ? 'On' : 'Off'
    statsCard.classList.toggle('dev-overlay__card--active', next)

    if (!next) {
      hasStatsData = false
      statsMetrics.hidden = true
      statsMeta.hidden = true
      statsMeta.textContent = ''
      statsEmpty.hidden = false
      statsEmpty.textContent = 'Performance stats are disabled.'
    } else if (!hasStatsData) {
      statsMetrics.hidden = true
      statsMeta.hidden = true
      statsMeta.textContent = ''
      statsEmpty.hidden = false
      statsEmpty.textContent = 'Collecting samples…'
    }

    if (emitEvent && stateChanged) {
      overlay.dispatchEvent(
        new CustomEvent<DevOverlayStatsToggleDetail>(
          DEV_OVERLAY_STATS_TOGGLE_EVENT,
          {
            detail: { enabled: next },
            bubbles: true,
          },
        ),
      )
    }
  }

  statsToggleInput.addEventListener('change', () => {
    setStatsEnabled(statsToggleInput.checked, { emitEvent: true })
  })

  overlay.__devtools = {
    setStatsEnabled,
    updateStats: renderStats,
  }

  setStatsEnabled(false)
  renderStats(null)

  content.appendChild(statsCard)

  const controls = document.createElement('div')
  controls.className = 'dev-overlay__controls'

  const paddleSection = document.createElement('div')
  paddleSection.className = 'dev-overlay__section'

  const ballSection = document.createElement('div')
  ballSection.className = 'dev-overlay__section'

  const arenaSection = document.createElement('div')
  arenaSection.className = 'dev-overlay__section'

  const buttons = document.createElement('div')
  buttons.className = 'dev-overlay__buttons'

  const buttonsRow = document.createElement('div')
  buttonsRow.className = 'dev-overlay__buttons-row'

  const status = document.createElement('div')
  status.className = 'dev-overlay__status'

  const scrollTopButton = createOverlayButton('Scroll to Top')
  scrollTopButton.classList.add('dev-overlay__scroll-top')
  scrollTopButton.addEventListener('click', () => {
    overlay.scrollTo({ top: 0, behavior: 'smooth' })
  })

  const collapsibleSections: HTMLDetailsElement[] = []

  function setStatus(message: string, variant: 'default' | 'error' = 'default') {
    status.textContent = message
    status.classList.toggle('dev-overlay__status--error', variant === 'error')
  }

  function renderControls() {
    controls.innerHTML = ''
    paddleSection.innerHTML = ''
    ballSection.innerHTML = ''
    arenaSection.innerHTML = ''
    collapsibleSections.length = 0

    const createModifierDetails: CreateModifierDetails = (modifier, buildBody) => {
      const details = document.createElement('details')
      details.className = 'dev-overlay__modifier'
      details.open = true
      collapsibleSections.push(details)

      const summary = document.createElement('summary')

      const summaryHeader = document.createElement('div')
      summaryHeader.className = 'dev-overlay__modifier-header'

      const toggle = document.createElement('input')
      toggle.type = 'checkbox'
      toggle.checked = modifier.enabled
      toggle.className = 'dev-overlay__modifier-toggle'
      toggle.addEventListener('click', event => event.stopPropagation())
      toggle.addEventListener('change', () => {
        modifier.enabled = toggle.checked
      })

      const summaryLabel = document.createElement('span')
      summaryLabel.className = 'dev-overlay__modifier-name'
      summaryLabel.textContent = modifier.name

      summaryHeader.appendChild(toggle)
      summaryHeader.appendChild(summaryLabel)
      summary.appendChild(summaryHeader)
      details.appendChild(summary)

      const body = document.createElement('div')
      body.className = 'dev-overlay__modifier-body'

      const description = document.createElement('p')
      description.className = 'dev-overlay__description'
      description.textContent = modifier.description
      body.appendChild(description)

      body.appendChild(
        createToggleControl('Include in Random Selection', modifier.includeInRandom, {
          onChange: value => {
            modifier.includeInRandom = value
          },
        }),
      )

      buildBody(body)

      details.appendChild(body)

      return details
    }

    const baseSection = document.createElement('details')
    baseSection.className = 'dev-overlay__collapsible'
    baseSection.open = true

    const baseSummary = document.createElement('summary')
    baseSummary.textContent = 'Game Parameters'
    baseSection.appendChild(baseSummary)

    const baseBody = document.createElement('div')
    baseBody.className = 'dev-overlay__collapsible-body'
    baseSection.appendChild(baseBody)

    let insideOffsetInput: HTMLInputElement | null = null

    baseBody.appendChild(
      createToggleControl('Doubles Mode', config.doubles.enabled, {
        onChange: value => {
          config.doubles.enabled = value
          if (insideOffsetInput) insideOffsetInput.disabled = !value
        },
      }),
    )

    const insideOffsetControl = createSliderControl(
      'Inside Paddle Offset',
      config.doubles.insideOffset,
      {
        min: 0,
        max: 220,
        step: 1,
        format: v => `${Math.round(v)} px`,
        onInput: v => (config.doubles.insideOffset = v),
      },
    )

    insideOffsetInput = insideOffsetControl.querySelector('input') as HTMLInputElement | null
    if (insideOffsetInput) insideOffsetInput.disabled = !config.doubles.enabled
    baseBody.appendChild(insideOffsetControl)

    baseBody.appendChild(
      createSliderControl('Paddle Speed', config.paddleSpeed, {
        min: 120,
        max: 360,
        step: 5,
        format: v => `${Math.round(v)} px/s`,
        onInput: v => (config.paddleSpeed = v),
      }),
    )

    baseBody.appendChild(
      createSliderControl(
        'Left Paddle Speed Multiplier',
        config.leftPaddleSpeedMultiplier,
        {
          min: 0.5,
          max: 1.5,
          step: 0.05,
          format: v => `${v.toFixed(2)}×`,
          onInput: v => (config.leftPaddleSpeedMultiplier = v),
        },
      ),
    )

    baseBody.appendChild(
      createSliderControl(
        'Right Paddle Speed Multiplier',
        config.rightPaddleSpeedMultiplier,
        {
          min: 0.5,
          max: 1.5,
          step: 0.05,
          format: v => `${v.toFixed(2)}×`,
          onInput: v => (config.rightPaddleSpeedMultiplier = v),
        },
      ),
    )

    baseBody.appendChild(
      createSliderControl('Ball Base Speed', config.baseBallSpeed, {
        min: 120,
        max: 600,
        step: 10,
        format: v => `${Math.round(v)} px/s`,
        onInput: v => (config.baseBallSpeed = v),
      }),
    )

    baseBody.appendChild(
      createSliderControl('Min Horizontal Ratio', config.minHorizontalRatio, {
        min: 0.1,
        max: 1,
        step: 0.01,
        format: v => v.toFixed(2),
        onInput: v => (config.minHorizontalRatio = v),
      }),
    )

    baseBody.appendChild(
      createSliderControl('Hit Speed Multiplier', config.speedIncreaseOnHit, {
        min: 1,
        max: 1.3,
        step: 0.01,
        format: v => `${v.toFixed(2)}×`,
        onInput: v => (config.speedIncreaseOnHit = v),
      }),
    )

    baseBody.appendChild(
      createSliderControl('Shot Clock Duration', config.shotClockSeconds, {
        min: 0,
        max: 20,
        step: 0.5,
        format: v => `${v.toFixed(1)} s`,
        onInput: v => (config.shotClockSeconds = v),
      }),
    )

    baseBody.appendChild(
      createSliderControl(
        'Left Paddle Size Multiplier',
        config.leftPaddleSizeMultiplier,
        {
          min: 0.5,
          max: 1.75,
          step: 0.05,
          format: v => `${v.toFixed(2)}×`,
          onInput: v => (config.leftPaddleSizeMultiplier = v),
        },
      ),
    )

    baseBody.appendChild(
      createSliderControl(
        'Right Paddle Size Multiplier',
        config.rightPaddleSizeMultiplier,
        {
          min: 0.5,
          max: 1.75,
          step: 0.05,
          format: v => `${v.toFixed(2)}×`,
          onInput: v => (config.rightPaddleSizeMultiplier = v),
        },
      ),
    )
    collapsibleSections.push(baseSection)
    controls.appendChild(baseSection)

    const paddleTitle = document.createElement('div')
    paddleTitle.className = 'dev-overlay__section-title'
    paddleTitle.textContent = 'Paddle Modifiers'
    paddleSection.appendChild(paddleTitle)

    const paddleList = document.createElement('div')
    paddleList.className = 'dev-overlay__modifiers'
    paddleSection.appendChild(paddleList)

    const renderPaddleModifier = <K extends typeof PADDLE_MODIFIER_KEYS[number]>(key: K) => {
      const modifier = config.modifiers.paddle[key]
      const details = paddleModifierBuilders[key]({
        modifier,
        createDetails: createModifierDetails,
      })
      paddleList.appendChild(details)
    }

    for (const key of PADDLE_MODIFIER_KEYS) {
      renderPaddleModifier(key)
    }

    const ballTitle = document.createElement('div')
    ballTitle.className = 'dev-overlay__section-title'
    ballTitle.textContent = 'Ball Modifiers'
    ballSection.appendChild(ballTitle)

    const ballList = document.createElement('div')
    ballList.className = 'dev-overlay__modifiers'
    ballSection.appendChild(ballList)

    const renderBallModifier = <K extends typeof BALL_MODIFIER_KEYS[number]>(key: K) => {
      const modifier = config.modifiers.ball[key]
      const details = ballModifierBuilders[key]({
        modifier,
        createDetails: createModifierDetails,
      })
      ballList.appendChild(details)
    }

    for (const key of BALL_MODIFIER_KEYS) {
      renderBallModifier(key)
    }

    const arenaTitle = document.createElement('div')
    arenaTitle.className = 'dev-overlay__section-title'
    arenaTitle.textContent = 'Arena Modifiers'
    arenaSection.appendChild(arenaTitle)

    const modifiersList = document.createElement('div')
    modifiersList.className = 'dev-overlay__modifiers'
    arenaSection.appendChild(modifiersList)

    const renderArenaModifier = <K extends typeof GRAVITY_WELL_KEYS[number]>(key: K) => {
      const modifier = config.modifiers.arena[key]
      const details = arenaModifierBuilders[key]({
        modifier,
        createDetails: createModifierDetails,
      })
      modifiersList.appendChild(details)
    }

    for (const key of GRAVITY_WELL_KEYS) {
      renderArenaModifier(key)
    }
  }

  const copyButton = createOverlayButton('Copy to Clipboard')
  copyButton.addEventListener('click', async () => {
    try {
      await navigator.clipboard.writeText(JSON.stringify(config, null, 2))
      setStatus('Configuration copied to clipboard.')
    } catch (error) {
      console.error(error)
      setStatus('Failed to copy config to clipboard.', 'error')
    }
  })

  const loadButton = createOverlayButton('Load from Clipboard')
  loadButton.addEventListener('click', async () => {
    try {
      const text = await navigator.clipboard.readText()
      const parsed = JSON.parse(text) as unknown
      if (!isDevConfig(parsed)) {
        setStatus('Clipboard contents are not a valid config.', 'error')
        return
      }
      applyConfig(config, parsed)
      renderControls()
      setStatus('Configuration loaded from clipboard.')
    } catch (error) {
      console.error(error)
      setStatus('Failed to load config from clipboard.', 'error')
    }
  })

  const resetButton = createOverlayButton('Reset to Defaults')
  resetButton.addEventListener('click', () => {
    applyConfig(config, defaults)
    renderControls()
    setStatus('Configuration reset to defaults.')
  })

  collapseAllButton.addEventListener('click', () => {
    collapsibleSections.forEach(section => {
      section.open = false
    })
  })

  buttonsRow.appendChild(copyButton)
  buttonsRow.appendChild(loadButton)
  buttonsRow.appendChild(resetButton)
  buttons.appendChild(buttonsRow)

  content.appendChild(controls)
  content.appendChild(paddleSection)
  content.appendChild(ballSection)
  content.appendChild(arenaSection)

  overlay.appendChild(title)
  overlay.appendChild(content)
  overlay.appendChild(buttons)
  overlay.appendChild(status)
  overlay.appendChild(scrollTopButton)

  renderControls()

  return overlay
}

function applyConfig(target: DevConfig, source: DevConfig) {
  target.paddleSpeed = source.paddleSpeed
  target.leftPaddleSpeedMultiplier = source.leftPaddleSpeedMultiplier
  target.rightPaddleSpeedMultiplier = source.rightPaddleSpeedMultiplier
  target.leftPaddleSizeMultiplier = source.leftPaddleSizeMultiplier
  target.rightPaddleSizeMultiplier = source.rightPaddleSizeMultiplier
  target.baseBallSpeed = source.baseBallSpeed
  target.minHorizontalRatio = source.minHorizontalRatio
  target.speedIncreaseOnHit = source.speedIncreaseOnHit
  target.shotClockSeconds = source.shotClockSeconds
  target.doubles = deepClone(source.doubles)
  target.modifiers = deepClone(source.modifiers)
}

function isDevConfig(value: unknown): value is DevConfig {
  if (!value || typeof value !== 'object') return false
  const candidate = value as Partial<DevConfig>
  if (
    typeof candidate.paddleSpeed !== 'number' ||
    typeof candidate.leftPaddleSpeedMultiplier !== 'number' ||
    typeof candidate.rightPaddleSpeedMultiplier !== 'number' ||
    typeof candidate.leftPaddleSizeMultiplier !== 'number' ||
    typeof candidate.rightPaddleSizeMultiplier !== 'number' ||
    typeof candidate.baseBallSpeed !== 'number' ||
    typeof candidate.minHorizontalRatio !== 'number' ||
    typeof candidate.speedIncreaseOnHit !== 'number' ||
    typeof candidate.shotClockSeconds !== 'number'
  ) {
    return false
  }

  if (!isDoublesConfig(candidate.doubles)) return false

  const modifiers = candidate.modifiers as Partial<ModifiersConfig> | undefined
  if (!modifiers || typeof modifiers !== 'object') return false

  const arena = modifiers.arena as Partial<Record<string, unknown>> | undefined
  if (!arena || typeof arena !== 'object') return false

  for (const key of GRAVITY_WELL_KEYS) {
    if (!isGravityWellModifier(arena[key])) return false
  }

  const ball = modifiers.ball as Partial<Record<string, unknown>> | undefined
  if (!ball || typeof ball !== 'object') return false

  if (!isKiteModifier(ball.kite)) return false
  if (!isBumShuffleModifier(ball.bumShuffle)) return false
  if (!isPollokModifier(ball.pollok)) return false
  if (!isSnowballModifier(ball.snowball)) return false
  if (!isMeteorModifier(ball.meteor)) return false

  const paddle = modifiers.paddle as Partial<Record<string, unknown>> | undefined
  if (!paddle || typeof paddle !== 'object') return false

  if (!isApparitionModifier(paddle.apparition)) return false
  if (!isOutOfBodyModifier(paddle.outOfBody)) return false
  if (!isBendyModifier(paddle.bendy)) return false
  if (!isChillyModifier(paddle.chilly)) return false
  if (!isBuckToothModifier(paddle.buckTooth)) return false
  if (!isOsteoWhatModifier(paddle.osteoWhat)) return false
  if (!isBrokePhysicsModifier(paddle.brokePhysics)) return false
  if (!isHadronModifier(paddle.hadron)) return false
  if (!isFoosballModifier(paddle.foosball)) return false
  if (!isDizzyModifier(paddle.dizzy)) return false
  if (!isBungeeModifier(paddle.bungee)) return false
  if (!isMissileCommanderModifier(paddle.missileCommander)) return false
  if (!isFrisbeeModifier(paddle.frisbee)) return false
  return isDundeeModifier(paddle.dundee)
}

function isGravityWellModifier(value: unknown): value is GravityWellModifier {
  if (!value || typeof value !== 'object') return false
  const candidate = value as Partial<GravityWellModifier>
  if (
    typeof candidate.name !== 'string' ||
    typeof candidate.description !== 'string' ||
    typeof candidate.enabled !== 'boolean' ||
    typeof candidate.includeInRandom !== 'boolean' ||
    typeof candidate.gravityStrength !== 'number' ||
    typeof candidate.gravityFalloff !== 'number' ||
    typeof candidate.radius !== 'number' ||
    typeof candidate.positiveTint !== 'string' ||
    typeof candidate.negativeTint !== 'string'
  ) {
    return false
  }

  if (
    'wanderWidthPercentage' in candidate &&
    typeof candidate.wanderWidthPercentage !== 'number'
  ) {
    return false
  }

  if ('pauseDuration' in candidate && typeof candidate.pauseDuration !== 'number') {
    return false
  }

  if ('wanderSpeed' in candidate && typeof candidate.wanderSpeed !== 'number') {
    return false
  }

  if ('maxDivots' in candidate && typeof (candidate as { maxDivots?: unknown }).maxDivots !== 'number') {
    return false
  }

  if (
    'spawnMargin' in candidate &&
    typeof (candidate as { spawnMargin?: unknown }).spawnMargin !== 'number'
  ) {
    return false
  }

  if ('wellCount' in candidate && typeof (candidate as { wellCount?: unknown }).wellCount !== 'number') {
    return false
  }

  if (
    'minGravityStrength' in candidate &&
    typeof (candidate as { minGravityStrength?: unknown }).minGravityStrength !== 'number'
  ) {
    return false
  }

  if (
    'maxGravityStrength' in candidate &&
    typeof (candidate as { maxGravityStrength?: unknown }).maxGravityStrength !== 'number'
  ) {
    return false
  }

  if (
    'minGravityFalloff' in candidate &&
    typeof (candidate as { minGravityFalloff?: unknown }).minGravityFalloff !== 'number'
  ) {
    return false
  }

  if (
    'maxGravityFalloff' in candidate &&
    typeof (candidate as { maxGravityFalloff?: unknown }).maxGravityFalloff !== 'number'
  ) {
    return false
  }

  if ('minRadius' in candidate && typeof (candidate as { minRadius?: unknown }).minRadius !== 'number') {
    return false
  }

  if ('maxRadius' in candidate && typeof (candidate as { maxRadius?: unknown }).maxRadius !== 'number') {
    return false
  }

  if ('maxHits' in candidate && typeof (candidate as { maxHits?: unknown }).maxHits !== 'number') {
    return false
  }

  if (
    'barricadeHealth' in candidate &&
    typeof (candidate as { barricadeHealth?: unknown }).barricadeHealth !== 'number'
  ) {
    return false
  }

  if (
    'barricadeCount' in candidate &&
    typeof (candidate as { barricadeCount?: unknown }).barricadeCount !== 'number'
  ) {
    return false
  }

  if (
    'barricadeSpacing' in candidate &&
    typeof (candidate as { barricadeSpacing?: unknown }).barricadeSpacing !== 'number'
  ) {
    return false
  }

  if (
    'barricadeDistance' in candidate &&
    typeof (candidate as { barricadeDistance?: unknown }).barricadeDistance !== 'number'
  ) {
    return false
  }

  if ('beamColor' in candidate && typeof (candidate as { beamColor?: unknown }).beamColor !== 'string') {
    return false
  }

  if ('coneLength' in candidate && typeof (candidate as { coneLength?: unknown }).coneLength !== 'number') {
    return false
  }

  if ('coneWidth' in candidate && typeof (candidate as { coneWidth?: unknown }).coneWidth !== 'number') {
    return false
  }

  if ('ballBrightness' in candidate) {
    return typeof (candidate as { ballBrightness?: unknown }).ballBrightness === 'number'
  }

  return true
}

function hasModifierBaseFields(value: unknown): value is ModifierBase {
  if (!value || typeof value !== 'object') return false
  const candidate = value as Partial<ModifierBase>
  return (
    typeof candidate.name === 'string' &&
    typeof candidate.description === 'string' &&
    typeof candidate.enabled === 'boolean' &&
    typeof candidate.includeInRandom === 'boolean'
  )
}

function isKiteModifier(value: unknown): value is KiteModifier {
  if (!hasModifierBaseFields(value)) return false
  const candidate = value as Partial<KiteModifier>
  return typeof candidate.tailLength === 'number'
}

function isBumShuffleModifier(value: unknown): value is BumShuffleModifier {
  if (!hasModifierBaseFields(value)) return false
  const candidate = value as Partial<BumShuffleModifier>
  return typeof candidate.trailLength === 'number'
}

function isPollokModifier(value: unknown): value is PollokModifier {
  if (!hasModifierBaseFields(value)) return false
  const candidate = value as Partial<PollokModifier>
  return (
    typeof candidate.trailLength === 'number' &&
    typeof candidate.leftColor === 'string' &&
    typeof candidate.rightColor === 'string' &&
    typeof candidate.neutralColor === 'string'
  )
}

function isSnowballModifier(value: unknown): value is SnowballModifier {
  if (!hasModifierBaseFields(value)) return false
  const candidate = value as Partial<SnowballModifier>
  return (
    typeof candidate.minRadius === 'number' &&
    typeof candidate.maxRadius === 'number' &&
    typeof candidate.growthRate === 'number'
  )
}

function isMeteorModifier(value: unknown): value is MeteorModifier {
  if (!hasModifierBaseFields(value)) return false
  const candidate = value as Partial<MeteorModifier>
  return (
    typeof candidate.startRadius === 'number' &&
    typeof candidate.minRadius === 'number' &&
    typeof candidate.shrinkRate === 'number'
  )
}

function isApparitionModifier(value: unknown): value is ApparitionModifier {
  if (!hasModifierBaseFields(value)) return false
  const candidate = value as Partial<ApparitionModifier>
  return (
    typeof candidate.minOpacity === 'number' &&
    typeof candidate.fadeDuration === 'number' &&
    typeof candidate.visibleHoldDuration === 'number' &&
    typeof candidate.hiddenHoldDuration === 'number' &&
    typeof candidate.paddleSizeMultiplier === 'number'
  )
}

function isOutOfBodyModifier(value: unknown): value is OutOfBodyModifier {
  if (!hasModifierBaseFields(value)) return false
  const candidate = value as Partial<OutOfBodyModifier>
  return (
    typeof candidate.paddleOpacity === 'number' &&
    typeof candidate.trailLength === 'number' &&
    typeof candidate.sampleInterval === 'number' &&
    typeof candidate.trailFade === 'number' &&
    typeof candidate.paddleSizeMultiplier === 'number'
  )
}

function isBendyModifier(value: unknown): value is BendyModifier {
  if (!hasModifierBaseFields(value)) return false
  const candidate = value as Partial<BendyModifier>
  return (
    typeof candidate.paddleSizeMultiplier === 'number' &&
    typeof candidate.maxOffset === 'number' &&
    typeof candidate.oscillationSpeed === 'number' &&
    typeof candidate.speedForMaxBend === 'number'
  )
}

function isChillyModifier(value: unknown): value is ChillyModifier {
  if (!hasModifierBaseFields(value)) return false
  const candidate = value as Partial<ChillyModifier>
  return (
    typeof candidate.startingHeight === 'number' &&
    typeof candidate.shrinkAmount === 'number' &&
    typeof candidate.minimumHeight === 'number' &&
    typeof candidate.paddleSizeMultiplier === 'number'
  )
}

function isBuckToothModifier(value: unknown): value is BuckToothModifier {
  if (!hasModifierBaseFields(value)) return false
  const candidate = value as Partial<BuckToothModifier>
  return (
    typeof candidate.gapSize === 'number' &&
    typeof candidate.paddleSizeMultiplier === 'number'
  )
}

function isOsteoWhatModifier(value: unknown): value is OsteoWhatModifier {
  if (!hasModifierBaseFields(value)) return false
  const candidate = value as Partial<OsteoWhatModifier>
  return (
    typeof candidate.segmentCount === 'number' &&
    typeof candidate.gapSize === 'number' &&
    typeof candidate.hitsBeforeBreak === 'number' &&
    typeof candidate.paddleSizeMultiplier === 'number' &&
    typeof candidate.strongColor === 'string' &&
    typeof candidate.weakColor === 'string'
  )
}

function isBrokePhysicsModifier(value: unknown): value is BrokePhysicsModifier {
  if (!hasModifierBaseFields(value)) return false
  const candidate = value as Partial<BrokePhysicsModifier>
  return (
    typeof candidate.centerAngle === 'number' &&
    typeof candidate.edgeAngle === 'number' &&
    typeof candidate.paddleSizeMultiplier === 'number'
  )
}

function isHadronModifier(value: unknown): value is HadronModifier {
  if (!hasModifierBaseFields(value)) return false
  const candidate = value as Partial<HadronModifier>
  return (
    typeof candidate.splitAngle === 'number' &&
    typeof candidate.armedColor === 'string' &&
    typeof candidate.disarmedColor === 'string' &&
    typeof candidate.paddleSizeMultiplier === 'number'
  )
}

function isFoosballModifier(value: unknown): value is FoosballModifier {
  if (!hasModifierBaseFields(value)) return false
  const candidate = value as Partial<FoosballModifier>
  return (
    typeof candidate.gapSize === 'number' &&
    typeof candidate.paddleSizeMultiplier === 'number'
  )
}

function isDizzyModifier(value: unknown): value is DizzyModifier {
  if (!hasModifierBaseFields(value)) return false
  const candidate = value as Partial<DizzyModifier>
  return typeof candidate.paddleSizeMultiplier === 'number'
}

function isBungeeModifier(value: unknown): value is BungeeModifier {
  if (!hasModifierBaseFields(value)) return false
  const candidate = value as Partial<BungeeModifier>
  return (
    typeof candidate.paddleSizeMultiplier === 'number' &&
    typeof candidate.returnSpeed === 'number'
  )
}

function isMissileCommanderModifier(
  value: unknown,
): value is MissileCommanderModifier {
  if (!hasModifierBaseFields(value)) return false
  const candidate = value as Partial<MissileCommanderModifier>
  return (
    typeof candidate.paddleSizeMultiplier === 'number' &&
    typeof candidate.launchSpeed === 'number' &&
    typeof candidate.cooldown === 'number' &&
    typeof candidate.missileHeight === 'number' &&
    typeof candidate.missileLifetime === 'number'
  )
}

function isFrisbeeModifier(value: unknown): value is FrisbeeModifier {
  if (!hasModifierBaseFields(value)) return false
  const candidate = value as Partial<FrisbeeModifier>
  return (
    typeof candidate.paddleSizeMultiplier === 'number' &&
    typeof candidate.throwSpeed === 'number'
  )
}

function isDundeeModifier(value: unknown): value is DundeeModifier {
  if (!hasModifierBaseFields(value)) return false
  const candidate = value as Partial<DundeeModifier>
  return (
    typeof candidate.paddleSizeMultiplier === 'number' &&
    typeof candidate.baseSpeed === 'number' &&
    typeof candidate.acceleration === 'number' &&
    typeof candidate.maxSpeed === 'number'
  )
}

function isDoublesConfig(value: unknown): value is DoublesConfig {
  if (!value || typeof value !== 'object') return false
  const candidate = value as Partial<DoublesConfig>
  return typeof candidate.enabled === 'boolean' && typeof candidate.insideOffset === 'number'
}

function createOverlayButton(label: string) {
  const button = document.createElement('button')
  button.type = 'button'
  button.className = 'dev-overlay__button'
  button.textContent = label
  return button
}

export function toggleOverlay(overlay: HTMLDivElement) {
  const visible = overlay.classList.toggle('dev-overlay--visible')
  overlay.setAttribute('aria-hidden', visible ? 'false' : 'true')
}

export function showOverlay(overlay: HTMLDivElement) {
  if (overlay.classList.contains('dev-overlay--visible')) return
  overlay.classList.add('dev-overlay--visible')
  overlay.setAttribute('aria-hidden', 'false')
}

export type { DevConfig } from './devtools'
