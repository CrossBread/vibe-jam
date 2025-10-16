/*
 * Copyright (c) 2025. CrossBread Tech All rights reserved.
 */

import type { SlinkyModifier } from '../../../devtools'
import type { ModifierBuilder } from '../../shared'
import { createSliderControl } from '../../shared'

export const createSlinkyModifier: ModifierBuilder<SlinkyModifier> = ({
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
      createSliderControl('Flops Per Second', modifier.flopRate, {
        min: 0.2,
        max: 6,
        step: 0.1,
        format: v => `${v.toFixed(2)} flops/s`,
        onInput: v => (modifier.flopRate = v),
      }),
    )
  })
