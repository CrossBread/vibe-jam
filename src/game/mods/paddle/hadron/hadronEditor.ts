/*
 * Copyright (c) 2025. CrossBread Tech All rights reserved.
 */

import type { HadronModifier } from '../../../devtools'
import type { ModifierBuilder } from '../../shared'
import {
  createColorControl,
  createSliderControl,
  degreesToRadians,
  radiansToDegrees,
} from '../../shared'

export const createHadronModifier: ModifierBuilder<HadronModifier> = ({
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
      createSliderControl('Split Angle Offset', radiansToDegrees(modifier.splitAngle), {
        min: 0,
        max: 60,
        step: 1,
        format: v => `${Math.round(v)}°`,
        onInput: v => (modifier.splitAngle = degreesToRadians(v)),
      }),
    )

    body.appendChild(
      createColorControl('Armed Color', modifier.armedColor, value => {
        modifier.armedColor = value
      }),
    )

    body.appendChild(
      createColorControl('Disarmed Color', modifier.disarmedColor, value => {
        modifier.disarmedColor = value
      }),
    )
  })
