/*
 * Copyright (c) 2025. CrossBread Tech All rights reserved.
 */

import type { BrokePhysicsModifier } from '../../../devtools'
import type { ModifierBuilder } from '../../shared'
import { createSliderControl, degreesToRadians, radiansToDegrees } from '../../shared'

export const createBrokePhysicsModifier: ModifierBuilder<BrokePhysicsModifier> = ({
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
      createSliderControl('Center Angle', radiansToDegrees(modifier.centerAngle), {
        min: 0,
        max: 90,
        step: 1,
        format: v => `${Math.round(v)}°`,
        onInput: v => (modifier.centerAngle = degreesToRadians(v)),
      }),
    )

    body.appendChild(
      createSliderControl('Edge Angle', radiansToDegrees(modifier.edgeAngle), {
        min: 0,
        max: 45,
        step: 1,
        format: v => `${Math.round(v)}°`,
        onInput: v => (modifier.edgeAngle = degreesToRadians(v)),
      }),
    )
  })
