/*
 * Copyright (c) 2025. CrossBread Tech All rights reserved.
 */

import type { GravityWellModifier } from '../../../devtools'
import type { ModifierBuilder } from '../../shared'
import { createSliderControl } from '../../shared'

const DEFAULT_FADE_DISTANCE = 140
const DEFAULT_FADE_SPEED = 6

export const createRussianRouletteModifier: ModifierBuilder<GravityWellModifier> = ({
  modifier,
  createDetails,
}) =>
  createDetails(modifier, body => {
    const currentDistance = Number.isFinite(modifier.illusionFadeDistance)
      ? Number(modifier.illusionFadeDistance)
      : DEFAULT_FADE_DISTANCE

    body.appendChild(
      createSliderControl('Fade Distance', currentDistance, {
        min: 20,
        max: 260,
        step: 5,
        format: value => `${Math.round(value)} px`,
        onInput: value => {
          modifier.illusionFadeDistance = value
        },
      }),
    )

    const currentSpeed = Number.isFinite(modifier.illusionFadeSpeed)
      ? Number(modifier.illusionFadeSpeed)
      : DEFAULT_FADE_SPEED

    body.appendChild(
      createSliderControl('Fade Speed', currentSpeed, {
        min: 1,
        max: 20,
        step: 1,
        format: value => `${Math.round(value)} /s`,
        onInput: value => {
          modifier.illusionFadeSpeed = value
        },
      }),
    )
  })
