/*
 * Copyright (c) 2025. CrossBread Tech All rights reserved.
 */

import type { OsteoWhatModifier } from '../../../devtools'
import type { ModifierBuilder } from '../../shared'
import { createColorControl, createSliderControl } from '../../shared'

export const createOsteoWhatModifier: ModifierBuilder<OsteoWhatModifier> = ({
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
      createSliderControl('Segment Count', modifier.segmentCount, {
        min: 1,
        max: 12,
        step: 1,
        format: v => `${Math.round(v)} segments`,
        onInput: v => (modifier.segmentCount = v),
      }),
    )

    body.appendChild(
      createSliderControl('Gap Size', modifier.gapSize, {
        min: 0,
        max: 400,
        step: 1,
        format: v => `${Math.round(v)} px`,
        onInput: v => (modifier.gapSize = v),
      }),
    )

    body.appendChild(
      createSliderControl('Hits Before Break', modifier.hitsBeforeBreak, {
        min: 1,
        max: 20,
        step: 1,
        format: v => `${Math.round(v)} hits`,
        onInput: v => (modifier.hitsBeforeBreak = v),
      }),
    )

    body.appendChild(
      createColorControl('Strong Segment Color', modifier.strongColor, value => {
        modifier.strongColor = value
      }),
    )

    body.appendChild(
      createColorControl('Weak Segment Color', modifier.weakColor, value => {
        modifier.weakColor = value
      }),
    )
  })
