/*
 * Copyright (c) 2025. CrossBread Tech All rights reserved.
 */

import type { CharlotteModifier } from '../../../devtools'
import type { ModifierBuilder } from '../../shared'
import { createSliderControl } from '../../shared'

export const createCharlotteModifier: ModifierBuilder<CharlotteModifier> = ({
  modifier,
  createDetails,
}) =>
  createDetails(modifier, body => {
    body.appendChild(
      createSliderControl('Paddle Size Multiplier', modifier.paddleSizeMultiplier, {
        min: 0.5,
        max: 1.75,
        step: 0.05,
        format: value => `${value.toFixed(2)}×`,
        onInput: value => (modifier.paddleSizeMultiplier = value),
      }),
    )

    body.appendChild(
      createSliderControl('Web Width', modifier.webWidthMultiplier, {
        min: 0.2,
        max: 1,
        step: 0.02,
        format: value => `${Math.round(value * 100)}%`,
        onInput: value => (modifier.webWidthMultiplier = value),
      }),
    )

    body.appendChild(
      createSliderControl('Web Length Limit', modifier.maxWebLengthMultiplier, {
        min: 0.25,
        max: 1.5,
        step: 0.05,
        format: value => `${value.toFixed(2)}×`,
        onInput: value => (modifier.maxWebLengthMultiplier = value),
      }),
    )
  })
