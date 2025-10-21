/*
 * Copyright (c) 2025. CrossBread Tech All rights reserved.
 */

import type { GravityWellModifier } from '../../../devtools'
import type { ModifierBuilder } from '../../shared'
import { createSliderControl } from '../../shared'
import { createGravityWellModifier } from '../gravityWell/gravityWellEditor'

type DivotsModifierConfig = GravityWellModifier & {
  maxDivots?: number
  spawnMargin?: number
}

export const createDivotsModifier: ModifierBuilder<DivotsModifierConfig> = context =>
  createGravityWellModifier({
    modifier: context.modifier,
    createDetails(modifier, buildBody) {
      return context.createDetails(modifier, body => {
        buildBody(body)

        const currentMaxDivots = Number.isFinite(modifier.maxDivots)
          ? Number(modifier.maxDivots)
          : 12
        body.appendChild(
          createSliderControl('Max Active Divots', currentMaxDivots, {
            min: 1,
            max: 60,
            step: 1,
            format: value => `${Math.round(value)} wells`,
            onInput: value => {
              modifier.maxDivots = Math.round(value)
            },
          }),
        )

        const currentSpawnMargin = Number.isFinite(modifier.spawnMargin)
          ? Number(modifier.spawnMargin)
          : Number.isFinite(modifier.radius)
            ? Number(modifier.radius)
            : 48
        body.appendChild(
          createSliderControl('Spawn Margin', currentSpawnMargin, {
            min: 0,
            max: 320,
            step: 1,
            format: value => `${Math.round(value)} px`,
            onInput: value => {
              modifier.spawnMargin = value
            },
          }),
        )
      })
    },
  })
