/*
 * Copyright (c) 2025. CrossBread Tech All rights reserved.
 */

import type { GravityWellModifier } from '../../../devtools'
import type { ModifierBuilder } from '../../shared'
import { createColorControl, createSliderControl } from '../../shared'

type VortexModifierConfig = GravityWellModifier & {
  portalPairs?: number
  portalRadius?: number
  portalMargin?: number
  portalCooldown?: number
  portalRotationSpeed?: number
  arrowColor?: string
}

export const createVortexModifier: ModifierBuilder<VortexModifierConfig> = ({
  modifier,
  createDetails,
}) =>
  createDetails(modifier, body => {
    const currentPairs = Number.isFinite(modifier.portalPairs) ? Number(modifier.portalPairs) : 2
    body.appendChild(
      createSliderControl('Portal Pairs', currentPairs, {
        min: 0,
        max: 12,
        step: 1,
        format: value => `${Math.round(value)}`,
        onInput: value => {
          modifier.portalPairs = value
        },
      }),
    )

    const currentRadius = Number.isFinite(modifier.portalRadius)
      ? Number(modifier.portalRadius)
      : Number.isFinite(modifier.radius)
        ? Number(modifier.radius)
        : 34
    body.appendChild(
      createSliderControl('Portal Radius', currentRadius, {
        min: 0,
        max: 400,
        step: 1,
        format: value => `${Math.round(value)} px`,
        onInput: value => {
          modifier.portalRadius = value
        },
      }),
    )

    const currentMargin = Number.isFinite(modifier.portalMargin) ? Number(modifier.portalMargin) : 96
    body.appendChild(
      createSliderControl('Arena Margin', currentMargin, {
        min: 0,
        max: 400,
        step: 1,
        format: value => `${Math.round(value)} px`,
        onInput: value => {
          modifier.portalMargin = value
        },
      }),
    )

    const currentCooldown = Number.isFinite(modifier.portalCooldown) ? Number(modifier.portalCooldown) : 0.18
    body.appendChild(
      createSliderControl('Re-entry Cooldown', currentCooldown, {
        min: 0,
        max: 10,
        step: 0.05,
        format: value => `${value.toFixed(2)} s`,
        onInput: value => {
          modifier.portalCooldown = Number(value.toFixed(2))
        },
      }),
    )

    const currentRotation = Number.isFinite(modifier.portalRotationSpeed)
      ? Number(modifier.portalRotationSpeed)
      : Math.PI
    body.appendChild(
      createSliderControl('Rotation Speed', currentRotation, {
        min: -Math.PI * 6,
        max: Math.PI * 6,
        step: 0.1,
        format: value => `${value.toFixed(2)} rad/s`,
        onInput: value => {
          modifier.portalRotationSpeed = Number(value.toFixed(2))
        },
      }),
    )

    const currentArrowColor = typeof modifier.arrowColor === 'string'
      ? modifier.arrowColor
      : '#f472b6'
    body.appendChild(
      createColorControl('Arrow Color', currentArrowColor, value => {
        modifier.arrowColor = value
      }),
    )
  })

