/*
 * Copyright (c) 2025. CrossBread Tech All rights reserved.
 */

import type { CrabbyModifier } from '../../../devtools'
import type { ModifierBuilder } from '../../shared'
import { createSliderControl, createToggleControl } from '../../shared'

export const createCrabbyModifier: ModifierBuilder<CrabbyModifier> = ({
  modifier,
  createDetails,
}) =>
  createDetails(modifier, body => {
    body.appendChild(
      createSliderControl('Paddle Size Multiplier', modifier.paddleSizeMultiplier, {
        min: 0.25,
        max: 4,
        step: 0.05,
        format: value => `${value.toFixed(2)}×`,
        onInput: value => (modifier.paddleSizeMultiplier = value),
      }),
    )

    body.appendChild(
      createSliderControl('Gap Size', modifier.gapSize, {
        min: 0,
        max: 400,
        step: 1,
        format: value => `${Math.round(value)} px`,
        onInput: value => (modifier.gapSize = value),
      }),
    )

    body.appendChild(
      createSliderControl('Claw Ratio', modifier.clawRatio, {
        min: 0.1,
        max: 0.95,
        step: 0.01,
        format: value => `${Math.round(value * 100)}%`,
        onInput: value => (modifier.clawRatio = value),
      }),
    )

    body.appendChild(
      createSliderControl('Claw Advantage', modifier.clawAdvantage, {
        min: 0,
        max: 2,
        step: 0.05,
        format: value => `${Math.round(value * 100)}%`,
        onInput: value => (modifier.clawAdvantage = value),
      }),
    )

    body.appendChild(
      createToggleControl('Swap Larger Paddle', modifier.swapSides, {
        onChange: value => (modifier.swapSides = value),
      }),
    )
  })
