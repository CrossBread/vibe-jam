/*
 * Copyright (c) 2025. CrossBread Tech All rights reserved.
 */

import type { GravityWellModifier } from '../../../devtools'
import type { ModifierBuilder } from '../../shared'
import { createColorControl, createSliderControl } from '../../shared'

export const createGravityWellModifier: ModifierBuilder<GravityWellModifier> = ({
  modifier,
  createDetails,
}) =>
  createDetails(modifier, body => {
    body.appendChild(
      createSliderControl('Gravity Strength', modifier.gravityStrength, {
        min: -8_000_000,
        max: 8_000_000,
        step: 100_000,
        format: v => `${Math.round(v).toLocaleString()} ƒ`,
        onInput: v => (modifier.gravityStrength = v),
      }),
    )

    body.appendChild(
      createSliderControl('Gravity Falloff', modifier.gravityFalloff, {
        min: 0,
        max: 200,
        step: 1,
        format: v => `${Math.round(v)} px`,
        onInput: v => (modifier.gravityFalloff = v),
      }),
    )

    body.appendChild(
      createSliderControl('Visual Radius', modifier.radius, {
        min: 10,
        max: 120,
        step: 1,
        format: v => `${Math.round(v)} px`,
        onInput: v => (modifier.radius = v),
      }),
    )

    body.appendChild(
      createColorControl('Positive Gravity Tint', modifier.positiveTint, value => {
        modifier.positiveTint = value
      }),
    )

    body.appendChild(
      createColorControl('Negative Gravity Tint', modifier.negativeTint, value => {
        modifier.negativeTint = value
      }),
    )

    if ('wanderWidthPercentage' in modifier) {
      const current = modifier.wanderWidthPercentage ?? 0.33
      body.appendChild(
        createSliderControl('Wander Width', current, {
          min: 0.1,
          max: 1,
          step: 0.01,
          format: v => `${Math.round(v * 100)}%`,
          onInput: v => (modifier.wanderWidthPercentage = v),
        }),
      )
    }

    if ('pauseDuration' in modifier) {
      const current = modifier.pauseDuration ?? 1.25
      body.appendChild(
        createSliderControl('Pause Duration', current, {
          min: 0,
          max: 5,
          step: 0.05,
          format: v => `${v.toFixed(2)} s`,
          onInput: v => (modifier.pauseDuration = v),
        }),
      )
    }

    if ('wanderSpeed' in modifier) {
      const current = Number.isFinite(modifier.wanderSpeed)
        ? Number(modifier.wanderSpeed)
        : 60
      body.appendChild(
        createSliderControl('Wander Speed', current, {
          min: 0,
          max: 240,
          step: 0.05,
          format: v => `${Math.abs(v) < 10 ? v.toFixed(2) : Math.round(v)} px/s`,
          onInput: v => (modifier.wanderSpeed = v),
        }),
      )
    }
  })
