/*
 * Copyright (c) 2025. CrossBread Tech All rights reserved.
 */

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
        min: 0.25,
        max: 4,
        step: 0.05,
        format: v => `${v.toFixed(2)}×`,
        onInput: v => (modifier.paddleSizeMultiplier = v),
      }),
    )

    body.appendChild(
      createSliderControl('Stretch Speed', modifier.stretchSpeed, {
        min: 0,
        max: 1000,
        step: 5,
        format: v => `${Math.round(v)} px/s`,
        onInput: v => (modifier.stretchSpeed = v),
      }),
    )

    body.appendChild(
      createSliderControl('Maximum Stretch', modifier.maxStretch, {
        min: 0,
        max: 240,
        step: 1,
        format: v => `${Math.round(v)} px`,
        onInput: v => (modifier.maxStretch = v),
      }),
    )

    body.appendChild(
      createSliderControl('Release Speed', modifier.releaseSpeed, {
        min: 0,
        max: 1000,
        step: 5,
        format: v => `${Math.round(v)} px/s`,
        onInput: v => (modifier.releaseSpeed = v),
      }),
    )

    body.appendChild(
      createSliderControl('Movement Multiplier', modifier.moveSpeedMultiplier, {
        min: 0.1,
        max: 3,
        step: 0.01,
        format: v => `${v.toFixed(2)}×`,
        onInput: v => (modifier.moveSpeedMultiplier = v),
      }),
    )
  })
