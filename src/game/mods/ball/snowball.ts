import type { SnowballModifier } from '../../devtools'
import type { ModifierBuilder } from '../shared'
import { createSliderControl } from '../shared'

export const createSnowballModifier: ModifierBuilder<SnowballModifier> = ({
  modifier,
  createDetails,
}) =>
  createDetails(modifier, body => {
    body.appendChild(
      createSliderControl('Minimum Radius', modifier.minRadius, {
        min: 2,
        max: 12,
        step: 0.5,
        format: v => `${v.toFixed(1)} px`,
        onInput: v => (modifier.minRadius = v),
      }),
    )

    body.appendChild(
      createSliderControl('Maximum Radius', modifier.maxRadius, {
        min: 8,
        max: 32,
        step: 0.5,
        format: v => `${v.toFixed(1)} px`,
        onInput: v => (modifier.maxRadius = v),
      }),
    )

    body.appendChild(
      createSliderControl('Growth Rate', modifier.growthRate, {
        min: 0.001,
        max: 0.05,
        step: 0.001,
        format: v => `${v.toFixed(3)} px⁻¹`,
        onInput: v => (modifier.growthRate = v),
      }),
    )
  })
