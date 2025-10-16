/*
 * Copyright (c) 2025. CrossBread Tech All rights reserved.
 */

import type { OsteoWhatModifier } from '../../../devtools'
import type { ModifierBuilder } from '../../shared'
import { createSliderControl } from '../../shared'

export const createOsteoWhatModifier: ModifierBuilder<OsteoWhatModifier> = ({
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
      createSliderControl('Segment Count', modifier.segmentCount, {
        min: 2,
        max: 8,
        step: 1,
        format: v => `${Math.round(v)} segments`,
        onInput: v => (modifier.segmentCount = v),
      }),
    )

    body.appendChild(
      createSliderControl('Gap Size', modifier.gapSize, {
        min: 0,
        max: 40,
        step: 1,
        format: v => `${Math.round(v)} px`,
        onInput: v => (modifier.gapSize = v),
      }),
    )

    body.appendChild(
      createSliderControl('Hits Before Break', modifier.hitsBeforeBreak, {
        min: 1,
        max: 12,
        step: 1,
        format: v => `${Math.round(v)} hits`,
        onInput: v => (modifier.hitsBeforeBreak = v),
      }),
    )
  })
