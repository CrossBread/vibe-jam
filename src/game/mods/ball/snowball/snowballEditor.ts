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
        min: 1,
        max: 160,
        step: 1,
        format: v => `${Math.round(v)} px`,
        onInput: v => (modifier.minRadius = v),
      }),
    )

    body.appendChild(
      createSliderControl('Maximum Radius', modifier.maxRadius, {
        min: 1,
        max: 200,
        step: 1,
        format: v => `${Math.round(v)} px`,
        onInput: v => (modifier.maxRadius = v),
      }),
    )

    body.appendChild(
      createSliderControl('Growth Rate', modifier.growthRate, {
        min: 0,
        max: 5,
        step: 0.01,
        format: v => `${v.toFixed(2)} px/unit`,
        onInput: v => (modifier.growthRate = v),
      }),
    )
  })
