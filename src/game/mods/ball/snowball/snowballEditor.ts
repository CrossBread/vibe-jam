/*
 * Copyright (c) 2025. CrossBread Tech All rights reserved.
 */

import type { SnowballModifier } from '../../../devtools'
import type { ModifierBuilder } from '../../shared'
import { createSliderControl } from '../../shared'

export const createSnowballModifier: ModifierBuilder<SnowballModifier> = ({
  modifier,
  createDetails,
}) =>
  createDetails(modifier, body => {
    body.appendChild(
      createSliderControl('Minimum Radius', modifier.minRadius, {
        min: 0,
        max: 400,
        step: 1,
        format: v => `${Math.round(v)} px`,
        onInput: v => (modifier.minRadius = v),
      }),
    )

    body.appendChild(
      createSliderControl('Maximum Radius', modifier.maxRadius, {
        min: 0,
        max: 400,
        step: 1,
        format: v => `${Math.round(v)} px`,
        onInput: v => (modifier.maxRadius = v),
      }),
    )

    body.appendChild(
      createSliderControl('Growth Rate', modifier.growthRate, {
        min: 0,
        max: 100,
        step: 0.1,
        format: v => `${v.toFixed(2)} px/s`,
        onInput: v => (modifier.growthRate = v),
      }),
    )
  })
