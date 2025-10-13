import type { DizzyModifier } from '../../devtools'
import type { ModifierBuilder } from '../shared'
import { createSliderControl } from '../shared'

export const createDizzyModifier: ModifierBuilder<DizzyModifier> = ({
  modifier,
  createDetails,
}) =>
  createDetails(modifier, body => {
    body.appendChild(
      createSliderControl('Paddle Size Multiplier', modifier.paddleSizeMultiplier, {
        min: 0.5,
        max: 1.75,
        step: 0.05,
        format: v => `${v.toFixed(2)}×`,
        onInput: v => (modifier.paddleSizeMultiplier = v),
      }),
    )
  })
