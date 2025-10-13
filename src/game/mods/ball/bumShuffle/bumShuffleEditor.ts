import type { BumShuffleModifier } from '../../../devtools'
import type { ModifierBuilder } from '../../shared'
import { createSliderControl } from '../../shared'

export const createBumShuffleModifier: ModifierBuilder<BumShuffleModifier> = ({
  modifier,
  createDetails,
}) =>
  createDetails(modifier, body => {
    body.appendChild(
      createSliderControl('Trail Length', modifier.trailLength, {
        min: 40,
        max: 4000,
        step: 1,
        format: v => `${Math.round(v)} samples`,
        onInput: v => (modifier.trailLength = v),
      }),
    )
  })
