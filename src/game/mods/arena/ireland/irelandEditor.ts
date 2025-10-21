/*
 * Copyright (c) 2025. CrossBread Tech All rights reserved.
 */

import type { GravityWellModifier } from '../../../devtools'
import type { ModifierBuilder } from '../../shared'
import { createSliderControl } from '../../shared'
import { createGravityWellModifier } from '../gravityWell/gravityWellEditor'

type IrelandModifierConfig = GravityWellModifier & {
  wellCount?: number
  minGravityStrength?: number
  maxGravityStrength?: number
  minGravityFalloff?: number
  maxGravityFalloff?: number
  minRadius?: number
  maxRadius?: number
}

export const createIrelandModifier: ModifierBuilder<IrelandModifierConfig> = context =>
  createGravityWellModifier({
    modifier: context.modifier,
    createDetails(modifier, buildBody) {
      return context.createDetails(modifier, body => {
        buildBody(body)

        const currentWellCount = Number.isFinite(modifier.wellCount)
          ? Number(modifier.wellCount)
          : 16
        body.appendChild(
          createSliderControl('Well Count', currentWellCount, {
            min: 1,
            max: 48,
            step: 1,
            format: value => `${Math.round(value)} wells`,
            onInput: value => {
              modifier.wellCount = Math.round(value)
            },
          }),
        )

        const defaultMinStrength = Number.isFinite(modifier.minGravityStrength)
          ? Number(modifier.minGravityStrength)
          : modifier.gravityStrength * 0.5
        body.appendChild(
          createSliderControl('Min Gravity Strength', defaultMinStrength, {
            min: -10_000_000,
            max: 10_000_000,
            step: 100_000,
            format: value => `${Math.round(value).toLocaleString()} ƒ`,
            onInput: value => {
              modifier.minGravityStrength = value
            },
          }),
        )

        const defaultMaxStrength = Number.isFinite(modifier.maxGravityStrength)
          ? Number(modifier.maxGravityStrength)
          : modifier.gravityStrength * 1.5
        body.appendChild(
          createSliderControl('Max Gravity Strength', defaultMaxStrength, {
            min: -10_000_000,
            max: 10_000_000,
            step: 100_000,
            format: value => `${Math.round(value).toLocaleString()} ƒ`,
            onInput: value => {
              modifier.maxGravityStrength = value
            },
          }),
        )

        const defaultMinFalloff = Number.isFinite(modifier.minGravityFalloff)
          ? Number(modifier.minGravityFalloff)
          : modifier.gravityFalloff * 0.5
        body.appendChild(
          createSliderControl('Min Gravity Falloff', defaultMinFalloff, {
            min: 0,
            max: 300,
            step: 1,
            format: value => `${Math.round(value)} px`,
            onInput: value => {
              modifier.minGravityFalloff = value
            },
          }),
        )

        const defaultMaxFalloff = Number.isFinite(modifier.maxGravityFalloff)
          ? Number(modifier.maxGravityFalloff)
          : modifier.gravityFalloff * 1.5
        body.appendChild(
          createSliderControl('Max Gravity Falloff', defaultMaxFalloff, {
            min: 0,
            max: 300,
            step: 1,
            format: value => `${Math.round(value)} px`,
            onInput: value => {
              modifier.maxGravityFalloff = value
            },
          }),
        )

        const defaultMinRadius = Number.isFinite(modifier.minRadius)
          ? Number(modifier.minRadius)
          : Math.max(16, modifier.radius * 0.5)
        body.appendChild(
          createSliderControl('Min Radius', defaultMinRadius, {
            min: 10,
            max: 200,
            step: 1,
            format: value => `${Math.round(value)} px`,
            onInput: value => {
              modifier.minRadius = value
            },
          }),
        )

        const defaultMaxRadius = Number.isFinite(modifier.maxRadius)
          ? Number(modifier.maxRadius)
          : Math.max(20, modifier.radius * 1.25)
        body.appendChild(
          createSliderControl('Max Radius', defaultMaxRadius, {
            min: 10,
            max: 240,
            step: 1,
            format: value => `${Math.round(value)} px`,
            onInput: value => {
              modifier.maxRadius = value
            },
          }),
        )
      })
    },
  })
