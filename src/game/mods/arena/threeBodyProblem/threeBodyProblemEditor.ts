/*
 * Copyright (c) 2025. CrossBread Tech All rights reserved.
 */

import type { ThreeBodyProblemModifier } from '../../../devtools'
import type { ModifierBuilder } from '../../shared'
import { createColorControl, createSliderControl } from '../../shared'

function appendSectionLabel(parent: HTMLDivElement, text: string) {
  const label = document.createElement('p')
  label.className = 'dev-overlay__hint'
  label.textContent = text
  parent.appendChild(label)
}

function getOrbitValue(value: number | undefined, fallback: number): number {
  return Number.isFinite(value) ? Number(value) : fallback
}

export const createThreeBodyProblemModifier: ModifierBuilder<ThreeBodyProblemModifier> = ({
  modifier,
  createDetails,
}) =>
  createDetails(modifier, body => {
    appendSectionLabel(body, 'Solar Core')

    body.appendChild(
      createSliderControl('Core Gravity Strength', modifier.gravityStrength, {
        min: -8_000_000,
        max: 8_000_000,
        step: 100_000,
        format: value => `${Math.round(value).toLocaleString()} ƒ`,
        onInput: value => {
          modifier.gravityStrength = value
        },
      }),
    )

    body.appendChild(
      createSliderControl('Core Gravity Falloff', modifier.gravityFalloff, {
        min: 0,
        max: 240,
        step: 1,
        format: value => `${Math.round(value)} px`,
        onInput: value => {
          modifier.gravityFalloff = value
        },
      }),
    )

    body.appendChild(
      createSliderControl('Core Visual Radius', modifier.radius, {
        min: 10,
        max: 160,
        step: 1,
        format: value => `${Math.round(value)} px`,
        onInput: value => {
          modifier.radius = value
        },
      }),
    )

    body.appendChild(
      createColorControl('Core Positive Tint', modifier.positiveTint, value => {
        modifier.positiveTint = value
      }),
    )

    body.appendChild(
      createColorControl('Core Negative Tint', modifier.negativeTint, value => {
        modifier.negativeTint = value
      }),
    )

    appendSectionLabel(body, 'Orbiting Planet')

    const orbitStrength = getOrbitValue(modifier.orbitGravityStrength, modifier.gravityStrength)
    body.appendChild(
      createSliderControl('Orbit Gravity Strength', orbitStrength, {
        min: -8_000_000,
        max: 8_000_000,
        step: 100_000,
        format: value => `${Math.round(value).toLocaleString()} ƒ`,
        onInput: value => {
          modifier.orbitGravityStrength = value
        },
      }),
    )

    const orbitFalloff = getOrbitValue(modifier.orbitGravityFalloff, modifier.gravityFalloff)
    body.appendChild(
      createSliderControl('Orbit Gravity Falloff', orbitFalloff, {
        min: 0,
        max: 240,
        step: 1,
        format: value => `${Math.round(value)} px`,
        onInput: value => {
          modifier.orbitGravityFalloff = value
        },
      }),
    )

    const orbitRadius = getOrbitValue(modifier.orbitRadius, Math.max(20, modifier.radius * 0.6))
    body.appendChild(
      createSliderControl('Orbit Visual Radius', orbitRadius, {
        min: 8,
        max: 120,
        step: 1,
        format: value => `${Math.round(value)} px`,
        onInput: value => {
          modifier.orbitRadius = value
        },
      }),
    )

    const orbitDistance = getOrbitValue(modifier.orbitDistance, 160)
    body.appendChild(
      createSliderControl('Orbit Distance', orbitDistance, {
        min: 0,
        max: 320,
        step: 1,
        format: value => `${Math.round(value)} px`,
        onInput: value => {
          modifier.orbitDistance = value
        },
      }),
    )

    const orbitSpeed = getOrbitValue(modifier.orbitSpeed, 0.85)
    body.appendChild(
      createSliderControl('Orbit Speed', orbitSpeed, {
        min: 0,
        max: 4,
        step: 0.01,
        format: value => `${value.toFixed(2)} rad/s`,
        onInput: value => {
          modifier.orbitSpeed = value
        },
      }),
    )

    const orbitPositiveTint = modifier.orbitPositiveTint ?? '#38bdf8'
    body.appendChild(
      createColorControl('Orbit Positive Tint', orbitPositiveTint, value => {
        modifier.orbitPositiveTint = value
      }),
    )

    const orbitNegativeTint = modifier.orbitNegativeTint ?? '#bae6fd'
    body.appendChild(
      createColorControl('Orbit Negative Tint', orbitNegativeTint, value => {
        modifier.orbitNegativeTint = value
      }),
    )
  })
