/*
 * Copyright (c) 2025. CrossBread Tech All rights reserved.
 */

import type { DundeeModifier } from '../../../devtools'
import type { ModifierBuilder } from '../../shared'
import { createSliderControl } from '../../shared'

export const createDundeeModifier: ModifierBuilder<DundeeModifier> = ({
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
      createSliderControl('Base Speed', modifier.baseSpeed, {
        min: 0,
        max: 1000,
        step: 5,
        format: v => `${Math.round(v)} px/s`,
        onInput: v => (modifier.baseSpeed = v),
      }),
    )

    body.appendChild(
      createSliderControl('Acceleration', modifier.acceleration, {
        min: -1000,
        max: 1000,
        step: 10,
        format: v => `${Math.round(v)} px/s²`,
        onInput: v => (modifier.acceleration = v),
      }),
    )

    body.appendChild(
      createSliderControl('Max Speed', modifier.maxSpeed, {
        min: 0,
        max: 1000,
        step: 5,
        format: v => `${Math.round(v)} px/s`,
        onInput: v => (modifier.maxSpeed = v),
      }),
    )
  })
