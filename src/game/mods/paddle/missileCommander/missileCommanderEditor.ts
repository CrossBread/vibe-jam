/*
 * Copyright (c) 2025. CrossBread Tech All rights reserved.
 */

import type { MissileCommanderModifier } from '../../../devtools'
import type { ModifierBuilder } from '../../shared'
import { createSliderControl } from '../../shared'

export const createMissileCommanderModifier: ModifierBuilder<MissileCommanderModifier> = ({
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
      createSliderControl('Launch Speed', modifier.launchSpeed, {
        min: 0,
        max: 1000,
        step: 5,
        format: v => `${Math.round(v)} px/s`,
        onInput: v => (modifier.launchSpeed = v),
      }),
    )

    body.appendChild(
      createSliderControl('Launch Cooldown', modifier.cooldown, {
        min: 0,
        max: 10,
        step: 0.05,
        format: v => `${v.toFixed(2)} s`,
        onInput: v => (modifier.cooldown = v),
      }),
    )

    body.appendChild(
      createSliderControl('Missile Height', modifier.missileHeight, {
        min: 0,
        max: 400,
        step: 1,
        format: v => `${Math.round(v)} px`,
        onInput: v => (modifier.missileHeight = v),
      }),
    )

    body.appendChild(
      createSliderControl('Missile Lifetime', modifier.missileLifetime, {
        min: 0,
        max: 10,
        step: 0.05,
        format: v => `${v.toFixed(2)} s`,
        onInput: v => (modifier.missileLifetime = v),
      }),
    )
  })
