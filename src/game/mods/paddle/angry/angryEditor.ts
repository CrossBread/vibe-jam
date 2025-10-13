import type { AngryModifier } from '../../../devtools'
import type { ModifierBuilder } from '../../shared'
import { createSliderControl } from '../../shared'

export const createAngryModifier: ModifierBuilder<AngryModifier> = ({
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
      createSliderControl('Stretch Speed', modifier.stretchSpeed, {
        min: 20,
        max: 480,
        step: 5,
        format: v => `${Math.round(v)} px/s`,
        onInput: v => (modifier.stretchSpeed = v),
      }),
    )

    body.appendChild(
      createSliderControl('Maximum Stretch', modifier.maxStretch, {
        min: 10,
        max: 140,
        step: 1,
        format: v => `${Math.round(v)} px`,
        onInput: v => (modifier.maxStretch = v),
      }),
    )

    body.appendChild(
      createSliderControl('Release Speed', modifier.releaseSpeed, {
        min: 20,
        max: 720,
        step: 5,
        format: v => `${Math.round(v)} px/s`,
        onInput: v => (modifier.releaseSpeed = v),
      }),
    )

    body.appendChild(
      createSliderControl('Movement Multiplier', modifier.moveSpeedMultiplier, {
        min: 0.2,
        max: 1,
        step: 0.01,
        format: v => `${v.toFixed(2)}×`,
        onInput: v => (modifier.moveSpeedMultiplier = v),
      }),
    )
  })
