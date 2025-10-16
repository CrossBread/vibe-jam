/*
 * Copyright (c) 2025. CrossBread Tech All rights reserved.
 */

import type { GravityWellModifier } from '../../../devtools'
import type { ModifierBuilder } from '../../shared'
import { createSliderControl } from '../../shared'

export const createWonderlandModifier: ModifierBuilder<GravityWellModifier> = ({
  modifier,
  createDetails,
}) =>
  createDetails(modifier, body => {
    const count = Number.isFinite(modifier.snowflakeCount) ? Number(modifier.snowflakeCount) : 180
    body.appendChild(
      createSliderControl('Snowflake Count', count, {
        min: 40,
        max: 360,
        step: 10,
        format: value => `${Math.round(value)}`,
        onInput: value => {
          modifier.snowflakeCount = value
        },
      }),
    )

    const size = Number.isFinite(modifier.snowflakeSize) ? Number(modifier.snowflakeSize) : 8
    body.appendChild(
      createSliderControl('Snowflake Size', size, {
        min: 3,
        max: 16,
        step: 0.5,
        format: value => `${value.toFixed(1)} px`,
        onInput: value => {
          modifier.snowflakeSize = value
        },
      }),
    )

    const speed = Number.isFinite(modifier.snowflakeSpeed) ? Number(modifier.snowflakeSpeed) : 200
    body.appendChild(
      createSliderControl('Snowfall Speed', speed, {
        min: 40,
        max: 360,
        step: 5,
        format: value => `${Math.round(value)} px/s`,
        onInput: value => {
          modifier.snowflakeSpeed = value
        },
      }),
    )

    const opacity = Number.isFinite(modifier.snowOpacity) ? Number(modifier.snowOpacity) : 0.85
    body.appendChild(
      createSliderControl('Snow Opacity', opacity, {
        min: 0.1,
        max: 1,
        step: 0.01,
        format: value => `${Math.round(value * 100)}%`,
        onInput: value => {
          modifier.snowOpacity = value
        },
      }),
    )
  })
