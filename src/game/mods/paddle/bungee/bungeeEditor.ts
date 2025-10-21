/*
 * Copyright (c) 2025. CrossBread Tech All rights reserved.
 */

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
        min: 0.25,
        max: 4,
        step: 0.05,
        format: v => `${v.toFixed(2)}×`,
        onInput: v => (modifier.paddleSizeMultiplier = v),
      }),
    )

    body.appendChild(
      createSliderControl('Return Speed', modifier.returnSpeed, {
        min: 0,
        max: 1000,
        step: 5,
        format: v => `${Math.round(v)} px/s`,
        onInput: v => (modifier.returnSpeed = v),
      }),
    )
  })
