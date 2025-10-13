import type { FrisbeeModifier } from '../../devtools'
import type { ModifierBuilder } from '../shared'
import { createSliderControl } from '../shared'

export const createFrisbeeModifier: ModifierBuilder<FrisbeeModifier> = ({
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

    body.appendChild(
      createSliderControl('Throw Speed', modifier.throwSpeed, {
        min: 120,
        max: 900,
        step: 5,
        format: v => `${Math.round(v)} px/s`,
        onInput: v => (modifier.throwSpeed = v),
      }),
    )
  })
