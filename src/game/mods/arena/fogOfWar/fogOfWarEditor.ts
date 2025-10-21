/*
 * Copyright (c) 2025. CrossBread Tech All rights reserved.
 */

import type { GravityWellModifier } from '../../../devtools'
import type { ModifierBuilder } from '../../shared'
import { createSliderControl } from '../../shared'

export const createFogOfWarModifier: ModifierBuilder<GravityWellModifier> = ({
  modifier,
  createDetails,
}) =>
  createDetails(modifier, body => {
    const expansionSpeed = Number.isFinite(modifier.fogExpansionSpeed)
      ? Number(modifier.fogExpansionSpeed)
      : 220
    body.appendChild(
      createSliderControl('Expansion Speed', expansionSpeed, {
        min: 0,
        max: 1000,
        step: 5,
        format: value => `${Math.round(value)} px/s`,
        onInput: value => {
          modifier.fogExpansionSpeed = value
        },
      }),
    )

    const maxRadius = Number.isFinite(modifier.fogMaxRadius) ? Number(modifier.fogMaxRadius) : 420
    body.appendChild(
      createSliderControl('Max Radius', maxRadius, {
        min: 0,
        max: 1000,
        step: 5,
        format: value => `${Math.round(value)} px`,
        onInput: value => {
          modifier.fogMaxRadius = value
        },
      }),
    )

    const maxOpacity = Number.isFinite(modifier.fogMaxOpacity) ? Number(modifier.fogMaxOpacity) : 0.85
    body.appendChild(
      createSliderControl('Max Darkness', maxOpacity, {
        min: 0,
        max: 1,
        step: 0.01,
        format: value => `${Math.round(value * 100)}%`,
        onInput: value => {
          modifier.fogMaxOpacity = value
        },
      }),
    )
  })
