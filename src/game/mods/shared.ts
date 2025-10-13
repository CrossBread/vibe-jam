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
