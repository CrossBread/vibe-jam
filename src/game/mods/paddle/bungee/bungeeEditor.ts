import type { BungeeModifier } from '../../../devtools'
import type { ModifierBuilder } from '../../shared'
import { createSliderControl } from '../../shared'

export const createBungeeModifier: ModifierBuilder<BungeeModifier> = ({
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
      createSliderControl('Return Speed', modifier.returnSpeed, {
        min: 60,
        max: 640,
        step: 5,
        format: v => `${Math.round(v)} px/s`,
        onInput: v => (modifier.returnSpeed = v),
      }),
    )
  })
