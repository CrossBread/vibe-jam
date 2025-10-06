import {
  GRAVITY_WELL_KEYS,
  deepClone,
  getGravityWellsEntries,
  type DevConfig,
  type GravityWellModifier,
  type ModifiersConfig,
} from './devtools'

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
): HTMLDivElement {
  ensureDevOverlayStyles()

  const overlay = document.createElement('div')
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
  hint.textContent = 'Press ` to toggle'

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

  const controls = document.createElement('div')
  controls.className = 'dev-overlay__controls'

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
    arenaSection.innerHTML = ''
    collapsibleSections.length = 0

    const baseSection = document.createElement('details')
    baseSection.className = 'dev-overlay__collapsible'
    baseSection.open = true

    const baseSummary = document.createElement('summary')
    baseSummary.textContent = 'Game Parameters'
    baseSection.appendChild(baseSummary)

    const baseBody = document.createElement('div')
    baseBody.className = 'dev-overlay__collapsible-body'
    baseSection.appendChild(baseBody)

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

    collapsibleSections.push(baseSection)
    controls.appendChild(baseSection)

    const arenaTitle = document.createElement('div')
    arenaTitle.className = 'dev-overlay__section-title'
    arenaTitle.textContent = 'Arena Modifiers'
    arenaSection.appendChild(arenaTitle)

    const modifiersList = document.createElement('div')
    modifiersList.className = 'dev-overlay__modifiers'
    arenaSection.appendChild(modifiersList)

    for (const [key, modifier] of getGravityWellsEntries(config.modifiers.arena)) {
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
        createSliderControl('Gravity Strength', modifier.gravityStrength, {
          min: 0,
          max: 8_000_000,
          step: 100_000,
          format: v => `${Math.round(v).toLocaleString()} ƒ`,
          onInput: v => (modifier.gravityStrength = v),
        }),
      )

      body.appendChild(
        createSliderControl('Gravity Falloff', modifier.gravityFalloff, {
          min: 0,
          max: 30_000,
          step: 500,
          format: v => `${Math.round(v).toLocaleString()}`,
          onInput: v => (modifier.gravityFalloff = v),
        }),
      )

      body.appendChild(
        createSliderControl('Visual Radius', modifier.radius, {
          min: 10,
          max: 120,
          step: 1,
          format: v => `${Math.round(v)} px`,
          onInput: v => (modifier.radius = v),
        }),
      )

      if ('wanderWidthPercentage' in modifier) {
        const current = modifier.wanderWidthPercentage ?? 0.33
        body.appendChild(
          createSliderControl('Wander Width', current, {
            min: 0.1,
            max: 1,
            step: 0.01,
            format: v => `${Math.round(v * 100)}%`,
            onInput: v => (modifier.wanderWidthPercentage = v),
          }),
        )
      }

      if ('pauseDuration' in modifier) {
        const current = modifier.pauseDuration ?? 1.25
        body.appendChild(
          createSliderControl('Pause Duration', current, {
            min: 0,
            max: 5,
            step: 0.05,
            format: v => `${v.toFixed(2)} s`,
            onInput: v => (modifier.pauseDuration = v),
          }),
        )
      }

      if ('wanderSpeed' in modifier) {
        const current = modifier.wanderSpeed ?? 60
        body.appendChild(
          createSliderControl('Wander Speed', current, {
            min: 10,
            max: 200,
            step: 5,
            format: v => `${Math.round(v)} px/s`,
            onInput: v => (modifier.wanderSpeed = v),
          }),
        )
      }

      details.appendChild(body)
      modifiersList.appendChild(details)
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
  target.baseBallSpeed = source.baseBallSpeed
  target.minHorizontalRatio = source.minHorizontalRatio
  target.speedIncreaseOnHit = source.speedIncreaseOnHit
  target.modifiers = deepClone(source.modifiers)
}

function isDevConfig(value: unknown): value is DevConfig {
  if (!value || typeof value !== 'object') return false
  const candidate = value as Partial<DevConfig>
  if (
    typeof candidate.paddleSpeed !== 'number' ||
    typeof candidate.baseBallSpeed !== 'number' ||
    typeof candidate.minHorizontalRatio !== 'number' ||
    typeof candidate.speedIncreaseOnHit !== 'number'
  ) {
    return false
  }

  const modifiers = candidate.modifiers as Partial<ModifiersConfig> | undefined
  if (!modifiers || typeof modifiers !== 'object') return false

  const arena = modifiers.arena as Partial<Record<string, unknown>> | undefined
  if (!arena || typeof arena !== 'object') return false

  for (const key of GRAVITY_WELL_KEYS) {
    if (!isGravityWellModifier(arena[key])) return false
  }

  return true
}

function isGravityWellModifier(value: unknown): value is GravityWellModifier {
  if (!value || typeof value !== 'object') return false
  const candidate = value as Partial<GravityWellModifier>
  if (
    typeof candidate.name !== 'string' ||
    typeof candidate.description !== 'string' ||
    typeof candidate.enabled !== 'boolean' ||
    typeof candidate.gravityStrength !== 'number' ||
    typeof candidate.gravityFalloff !== 'number' ||
    typeof candidate.radius !== 'number'
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

  return !('wanderSpeed' in candidate && typeof candidate.wanderSpeed !== 'number');


}

function createOverlayButton(label: string) {
  const button = document.createElement('button')
  button.type = 'button'
  button.className = 'dev-overlay__button'
  button.textContent = label
  return button
}

interface SliderOptions {
  min: number
  max: number
  step: number
  format: (value: number) => string
  onInput: (value: number) => void
}

function createSliderControl(label: string, value: number, options: SliderOptions) {
  const wrapper = document.createElement('label')
  wrapper.className = 'dev-overlay__control'

  const title = document.createElement('div')
  title.className = 'dev-overlay__label'
  title.textContent = label

  const valueEl = document.createElement('span')
  valueEl.className = 'dev-overlay__value'
  valueEl.textContent = options.format(value)
  title.appendChild(valueEl)

  const input = document.createElement('input')
  input.type = 'range'
  input.min = String(options.min)
  input.max = String(options.max)
  input.step = String(options.step)
  input.value = String(value)

  input.addEventListener('input', () => {
    const next = Number(input.value)
    options.onInput(next)
    valueEl.textContent = options.format(next)
  })

  wrapper.appendChild(title)
  wrapper.appendChild(input)

  return wrapper
}

export function toggleOverlay(overlay: HTMLDivElement) {
  const visible = overlay.classList.toggle('dev-overlay--visible')
  overlay.setAttribute('aria-hidden', visible ? 'false' : 'true')
}

export type { DevConfig } from './devtools'
