import type { MeteorModifier } from '../../devtools'
import type { ModifierBuilder } from '../shared'
import { createSliderControl } from '../shared'

export const createMeteorModifier: ModifierBuilder<MeteorModifier> = ({
  modifier,
  createDetails,
}) =>
  createDetails(modifier, body => {
    body.appendChild(
      createSliderControl('Starting Radius', modifier.startRadius, {
        min: 8,
        max: 32,
        step: 0.5,
        format: v => `${v.toFixed(1)} px`,
        onInput: v => (modifier.startRadius = v),
      }),
    )

    body.appendChild(
      createSliderControl('Minimum Radius', modifier.minRadius, {
        min: 2,
        max: 16,
        step: 0.5,
        format: v => `${v.toFixed(1)} px`,
        onInput: v => (modifier.minRadius = v),
      }),
    )

    body.appendChild(
      createSliderControl('Shrink Rate', modifier.shrinkRate, {
        min: 0.001,
        max: 0.05,
        step: 0.001,
        format: v => `${v.toFixed(3)} px⁻¹`,
        onInput: v => (modifier.shrinkRate = v),
      }),
    )
  })
