/*
 * Copyright (c) 2025. CrossBread Tech All rights reserved.
 */

import type { BuckToothModifier } from '../../../devtools'
import type { ModifierBuilder } from '../../shared'
import { createSliderControl } from '../../shared'


export const createBuckToothModifier: ModifierBuilder<BuckToothModifier> = ({
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
      createSliderControl('Gap Size', modifier.gapSize, {
        min: 0,
        max: 80,
        step: 1,
        format: v => `${Math.round(v)} px`,
        onInput: v => (modifier.gapSize = v),
      }),
    )
  })
