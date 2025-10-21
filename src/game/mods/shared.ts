/*
 * Copyright (c) 2025. CrossBread Tech All rights reserved.
 */

import type { ModifierBase } from '../devtools'

export function radiansToDegrees(value: number) {
  return (value * 180) / Math.PI
}

export function degreesToRadians(value: number) {
  return (value * Math.PI) / 180
}

export interface SliderOptions {
  min: number
  max: number
  step: number
  format: (value: number) => string
  onInput: (value: number) => void
}

export function createSliderControl(label: string, value: number, options: SliderOptions) {
  const wrapper = document.createElement('label')
  wrapper.className = 'dev-overlay__control'

  const title = document.createElement('div')
  title.className = 'dev-overlay__label'
  title.textContent = label

  const valueEl = document.createElement('span')
  valueEl.className = 'dev-overlay__value dev-overlay__value--interactive'
  valueEl.textContent = options.format(value)
  valueEl.tabIndex = 0
  valueEl.setAttribute('role', 'button')
  valueEl.setAttribute('aria-label', `Enter a value for ${label}`)
  valueEl.title = 'Click to enter a value'
  title.appendChild(valueEl)

  const input = document.createElement('input')
  input.type = 'range'
  input.min = String(options.min)
  input.max = String(options.max)
  input.step = String(options.step)
  input.value = String(value)

  const precision = (() => {
    const stepString = options.step.toString()
    const decimalIndex = stepString.indexOf('.')
    if (decimalIndex === -1) {
      return 0
    }
    return stepString.length - decimalIndex - 1
  })()

  const clampToRange = (candidate: number) =>
    Math.min(options.max, Math.max(options.min, candidate))

  const snapToStep = (candidate: number) => {
    const offset = candidate - options.min
    const steps = Math.round(offset / options.step)
    const snapped = options.min + steps * options.step
    return Number(snapped.toFixed(precision))
  }

  const applyValue = (candidate: number) => {
    if (!Number.isFinite(candidate)) {
      return
    }
    const clamped = clampToRange(candidate)
    const normalized = snapToStep(clamped)
    input.value = String(normalized)
    options.onInput(normalized)
    valueEl.textContent = options.format(normalized)
  }

  const normalizedInitial = snapToStep(clampToRange(value))
  input.value = String(normalizedInitial)
  valueEl.textContent = options.format(normalizedInitial)

  input.addEventListener('input', () => {
    applyValue(Number(input.value))
  })

  const requestManualEntry = () => {
    const result = window.prompt(`Enter a value for ${label}`, input.value)
    if (result === null) {
      return
    }
    const next = Number(result)
    if (!Number.isFinite(next)) {
      return
    }
    applyValue(next)
  }

  valueEl.addEventListener('click', event => {
    event.preventDefault()
    requestManualEntry()
  })

  valueEl.addEventListener('keydown', event => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault()
      requestManualEntry()
    }
  })

  wrapper.appendChild(title)
  wrapper.appendChild(input)

  return wrapper
}

export interface ToggleOptions {
  onChange: (value: boolean) => void
}

export function createToggleControl(label: string, value: boolean, options: ToggleOptions) {
  const wrapper = document.createElement('label')
  wrapper.className = 'dev-overlay__control'

  const title = document.createElement('div')
  title.className = 'dev-overlay__label'
  title.textContent = label

  const valueEl = document.createElement('span')
  valueEl.className = 'dev-overlay__value'
  valueEl.textContent = value ? 'On' : 'Off'
  title.appendChild(valueEl)

  const input = document.createElement('input')
  input.type = 'checkbox'
  input.checked = value
  input.addEventListener('change', () => {
    options.onChange(input.checked)
    valueEl.textContent = input.checked ? 'On' : 'Off'
  })

  wrapper.appendChild(title)
  wrapper.appendChild(input)

  return wrapper
}

export function createColorControl(label: string, value: string, onInput: (value: string) => void) {
  const wrapper = document.createElement('label')
  wrapper.className = 'dev-overlay__control'

  const title = document.createElement('div')
  title.className = 'dev-overlay__label'
  title.textContent = label

  const valueEl = document.createElement('span')
  valueEl.className = 'dev-overlay__value'
  valueEl.textContent = value.toUpperCase()
  title.appendChild(valueEl)

  const input = document.createElement('input')
  input.type = 'color'
  input.value = value
  input.className = 'dev-overlay__color-input'

  input.addEventListener('input', () => {
    onInput(input.value)
    valueEl.textContent = input.value.toUpperCase()
  })

  wrapper.appendChild(title)
  wrapper.appendChild(input)

  return wrapper
}

export type CreateModifierDetails = <T extends ModifierBase>(
  modifier: T,
  buildBody: (body: HTMLDivElement) => void,
) => HTMLDetailsElement

export interface ModifierContext<T extends ModifierBase> {
  modifier: T
  createDetails: CreateModifierDetails
}

export type ModifierBuilder<T extends ModifierBase> = (
  context: ModifierContext<T>,
) => HTMLDetailsElement
