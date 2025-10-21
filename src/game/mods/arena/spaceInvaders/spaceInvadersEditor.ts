/*
 * Copyright (c) 2025. CrossBread Tech All rights reserved.
 */

import type { SpaceInvadersModifier } from '../../../devtools'
import type { ModifierBuilder } from '../../shared'
import { createColorControl, createSliderControl } from '../../shared'

export const createSpaceInvadersModifier: ModifierBuilder<SpaceInvadersModifier> = ({
  modifier,
  createDetails,
}) =>
  createDetails(modifier, body => {
    const currentCount = Number(modifier.barricadeCount)
    const currentHealth = Number(modifier.barricadeHealth)
    const currentSpacing = Number(modifier.barricadeSpacing)
    const currentDistance = Number(modifier.barricadeDistance)

    body.appendChild(
      createSliderControl(
        'Barricades Per Column',
        Number.isFinite(currentCount) ? currentCount : 4,
        {
          min: 0,
          max: 20,
          step: 1,
          format: value => `${Math.round(value)} blocks`,
          onInput: value => {
            modifier.barricadeCount = Math.round(value)
          },
        },
      ),
    )

    body.appendChild(
      createSliderControl('Barricade Durability', Number.isFinite(currentHealth) ? currentHealth : 3, {
        min: 1,
        max: 20,
        step: 1,
        format: value => `${Math.round(value)} hits`,
        onInput: value => {
          modifier.barricadeHealth = Math.round(value)
        },
      }),
    )

    body.appendChild(
      createSliderControl('Vertical Spacing', Number.isFinite(currentSpacing) ? currentSpacing : 26, {
        min: 0,
        max: 400,
        step: 1,
        format: value => `${Math.round(value)} px`,
        onInput: value => {
          modifier.barricadeSpacing = value
        },
      }),
    )

    body.appendChild(
      createSliderControl('Distance from Center', Number.isFinite(currentDistance) ? currentDistance : 120, {
        min: 0,
        max: 600,
        step: 1,
        format: value => `${Math.round(value)} px`,
        onInput: value => {
          modifier.barricadeDistance = value
        },
      }),
    )

    body.appendChild(
      createColorControl('Left Column Color', modifier.positiveTint, value => {
        modifier.positiveTint = value
      }),
    )

    body.appendChild(
      createColorControl('Right Column Color', modifier.negativeTint, value => {
        modifier.negativeTint = value
      }),
    )
  })
