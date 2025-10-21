/*
 * Copyright (c) 2025. CrossBread Tech All rights reserved.
 */

import type { ChillyModifier } from '../../../devtools'
import type { ModifierBuilder } from '../../shared'
import { createSliderControl } from '../../shared'

export const createChillyModifier: ModifierBuilder<ChillyModifier> = ({
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
      createSliderControl('Starting Height', modifier.startingHeight, {
        min: 20,
        max: 400,
        step: 1,
        format: v => `${Math.round(v)} px`,
        onInput: v => (modifier.startingHeight = v),
      }),
    )

    body.appendChild(
      createSliderControl('Shrink Per Return', modifier.shrinkAmount, {
        min: 0,
        max: 200,
        step: 1,
        format: v => `${Math.round(v)} px`,
        onInput: v => (modifier.shrinkAmount = v),
      }),
    )

    body.appendChild(
      createSliderControl('Minimum Height', modifier.minimumHeight, {
        min: 10,
        max: 300,
        step: 1,
        format: v => `${Math.round(v)} px`,
        onInput: v => (modifier.minimumHeight = v),
      }),
    )
  })
