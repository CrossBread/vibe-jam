import type { BendyModifier } from '../../../devtools'
import type { ModifierBuilder } from '../../shared'
import { createSliderControl } from '../../shared'

export const createBendyModifier: ModifierBuilder<BendyModifier> = ({
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
      createSliderControl('Max Offset', modifier.maxOffset, {
        min: 0,
        max: 24,
        step: 0.5,
        format: v => `${v.toFixed(1)} px`,
        onInput: v => (modifier.maxOffset = v),
      }),
    )

    body.appendChild(
      createSliderControl('Oscillation Speed', modifier.oscillationSpeed, {
        min: 1,
        max: 12,
        step: 0.1,
        format: v => `${v.toFixed(1)} Hz`,
        onInput: v => (modifier.oscillationSpeed = v),
      }),
    )

    body.appendChild(
      createSliderControl('Speed For Max Bend', modifier.speedForMaxBend, {
        min: 120,
        max: 900,
        step: 5,
        format: v => `${Math.round(v)} px/s`,
        onInput: v => (modifier.speedForMaxBend = v),
      }),
    )
  })
