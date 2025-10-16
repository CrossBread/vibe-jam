/*
 * Copyright (c) 2025. CrossBread Tech All rights reserved.
 */

import type { KiteModifier } from '../../../devtools'
import type { ModifierBuilder } from '../../shared'
import { createSliderControl } from '../../shared'

export const createKiteModifier: ModifierBuilder<KiteModifier> = ({
  modifier,
  createDetails,
}) =>
  createDetails(modifier, body => {
    body.appendChild(
      createSliderControl('Tail Length', modifier.tailLength, {
        min: 4,
        max: 120,
        step: 1,
        format: v => `${Math.round(v)} samples`,
        onInput: v => (modifier.tailLength = v),
      }),
    )
  })
