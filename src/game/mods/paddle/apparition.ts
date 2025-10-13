import type { ApparitionModifier } from '../../devtools'
import type { ModifierBuilder } from '../shared'
import { createSliderControl } from '../shared'

export const createApparitionModifier: ModifierBuilder<ApparitionModifier> = ({
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
      createSliderControl('Minimum Opacity', modifier.minOpacity, {
        min: 0,
        max: 1,
        step: 0.01,
        format: v => `${Math.round(v * 100)}%`,
        onInput: v => (modifier.minOpacity = v),
      }),
    )

    body.appendChild(
      createSliderControl('Fade Duration', modifier.fadeDuration, {
        min: 0,
        max: 3,
        step: 0.05,
        format: v => `${v.toFixed(2)} s`,
        onInput: v => (modifier.fadeDuration = v),
      }),
    )

    body.appendChild(
      createSliderControl('Visible Hold', modifier.visibleHoldDuration, {
        min: 0,
        max: 6,
        step: 0.1,
        format: v => `${v.toFixed(1)} s`,
        onInput: v => (modifier.visibleHoldDuration = v),
      }),
    )

    body.appendChild(
      createSliderControl('Hidden Hold', modifier.hiddenHoldDuration, {
        min: 0,
        max: 6,
        step: 0.1,
        format: v => `${v.toFixed(1)} s`,
        onInput: v => (modifier.hiddenHoldDuration = v),
      }),
    )
  })
