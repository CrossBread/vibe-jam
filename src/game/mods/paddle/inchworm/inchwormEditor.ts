/*
 * Copyright (c) 2025. CrossBread Tech All rights reserved.
 */

import type { InchwormModifier } from '../../../devtools'
import type { ModifierBuilder } from '../../shared'
import { createSliderControl } from '../../shared'

export const createInchwormModifier: ModifierBuilder<InchwormModifier> = ({
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
      createSliderControl('Shrink Amount', modifier.shrinkAmount, {
        min: 0,
        max: 96,
        step: 1,
        format: v => `${Math.round(v)} px`,
        onInput: v => (modifier.shrinkAmount = v),
      }),
    )

    body.appendChild(
      createSliderControl('Minimum Height', modifier.minimumHeight, {
        min: 24,
        max: 180,
        step: 1,
        format: v => `${Math.round(v)} px`,
        onInput: v => (modifier.minimumHeight = v),
      }),
    )

    body.appendChild(
      createSliderControl('Shrink Speed', modifier.shrinkSpeed, {
        min: 20,
        max: 600,
        step: 5,
        format: v => `${Math.round(v)} px/s`,
        onInput: v => (modifier.shrinkSpeed = v),
      }),
    )

    body.appendChild(
      createSliderControl('Extend Speed', modifier.extendSpeed, {
        min: 20,
        max: 600,
        step: 5,
        format: v => `${Math.round(v)} px/s`,
        onInput: v => (modifier.extendSpeed = v),
      }),
    )
  })
