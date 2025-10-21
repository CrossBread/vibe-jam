/*
 * Copyright (c) 2025. CrossBread Tech All rights reserved.
 */

import type { GravityWellModifier } from '../../../devtools'
import type { ModifierBuilder } from '../../shared'
import { createColorControl, createSliderControl } from '../../shared'

type PaddlePotionModifierConfig = GravityWellModifier & {
  objectRadius?: number
  spawnCount?: number
  shrinkAmount?: number
  growAmount?: number
  objectColor?: string
}

interface PaddlePotionEditorOptions {
  includeGrowControl?: boolean
}

export function createPaddlePotionEditor(
  options: PaddlePotionEditorOptions = {},
): ModifierBuilder<PaddlePotionModifierConfig> {
  const { includeGrowControl = false } = options

  return ({ modifier, createDetails }) =>
    createDetails(modifier, body => {
      const currentRadius = Number.isFinite(modifier.objectRadius)
        ? Number(modifier.objectRadius)
        : Number.isFinite(modifier.radius)
          ? Number(modifier.radius)
          : 18

      body.appendChild(
        createSliderControl('Object Radius', currentRadius, {
          min: 0,
          max: 300,
          step: 1,
          format: value => `${Math.round(value)} px`,
          onInput: value => {
            modifier.objectRadius = value
          },
        }),
      )

      const currentCount = Number.isFinite(modifier.spawnCount) ? Number(modifier.spawnCount) : 4
      body.appendChild(
        createSliderControl('Object Count', currentCount, {
          min: 0,
          max: 100,
          step: 1,
          format: value => `${Math.round(value)}`,
          onInput: value => {
            modifier.spawnCount = value
          },
        }),
      )

      const currentShrink = Number.isFinite(modifier.shrinkAmount) ? Number(modifier.shrinkAmount) : 28
      body.appendChild(
        createSliderControl('Shrink Amount', currentShrink, {
          min: 0,
          max: 400,
          step: 1,
          format: value => `${Math.round(value)} px`,
          onInput: value => {
            modifier.shrinkAmount = value
          },
        }),
      )

      if (includeGrowControl) {
        const currentGrow = Number.isFinite(modifier.growAmount) ? Number(modifier.growAmount) : 24
        body.appendChild(
          createSliderControl('Grow Amount', currentGrow, {
            min: 0,
            max: 400,
            step: 1,
            format: value => `${Math.round(value)} px`,
            onInput: value => {
              modifier.growAmount = value
            },
          }),
        )
      } else {
        delete modifier.growAmount
      }

      const currentColor = typeof modifier.objectColor === 'string' ? modifier.objectColor : '#f97316'
      body.appendChild(
        createColorControl('Object Color', currentColor, value => {
          modifier.objectColor = value
        }),
      )
    })
}
