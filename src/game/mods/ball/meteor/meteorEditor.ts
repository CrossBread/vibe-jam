/*
 * Copyright (c) 2025. CrossBread Tech All rights reserved.
 */

import type { MeteorModifier } from '../../../devtools'
import type { ModifierBuilder } from '../../shared'
import { createSliderControl } from '../../shared'

export const createMeteorModifier: ModifierBuilder<MeteorModifier> = ({
  modifier,
  createDetails,
}) =>
  createDetails(modifier, body => {
    body.appendChild(
      createSliderControl('Start Radius', modifier.startRadius, {
        min: 0,
        max: 400,
        step: 1,
        format: v => `${Math.round(v)} px`,
        onInput: v => (modifier.startRadius = v),
      }),
    )

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
      createSliderControl('Shrink Rate', modifier.shrinkRate, {
        min: 0,
        max: 100,
        step: 0.1,
        format: v => `${v.toFixed(2)} px/unit`,
        onInput: v => (modifier.shrinkRate = v),
      }),
    )
  })
