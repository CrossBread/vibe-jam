import type { OutOfBodyModifier } from '../../../devtools'
import type { ModifierBuilder } from '../../shared'
import { createSliderControl } from '../../shared'

export const createOutOfBodyModifier: ModifierBuilder<OutOfBodyModifier> = ({
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
      createSliderControl('Paddle Opacity', modifier.paddleOpacity, {
        min: 0,
        max: 1,
        step: 0.01,
        format: v => `${Math.round(v * 100)}%`,
        onInput: v => (modifier.paddleOpacity = v),
      }),
    )

    body.appendChild(
      createSliderControl('Trail Length', modifier.trailLength, {
        min: 2,
        max: 16,
        step: 1,
        format: v => `${Math.round(v)} frames`,
        onInput: v => (modifier.trailLength = v),
      }),
    )

    body.appendChild(
      createSliderControl('Sample Interval', modifier.sampleInterval, {
        min: 0.01,
        max: 0.2,
        step: 0.01,
        format: v => `${v.toFixed(2)} s`,
        onInput: v => (modifier.sampleInterval = v),
      }),
    )

    body.appendChild(
      createSliderControl('Trail Fade', modifier.trailFade, {
        min: 0.3,
        max: 0.95,
        step: 0.01,
        format: v => `${Math.round(v * 100)}%`,
        onInput: v => (modifier.trailFade = v),
      }),
    )
  })
