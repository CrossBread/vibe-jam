import type { PollokModifier } from '../../devtools'
import type { ModifierBuilder } from '../shared'
import { createColorControl, createSliderControl } from '../shared'

export const createPollokModifier: ModifierBuilder<PollokModifier> = ({
  modifier,
  createDetails,
}) =>
  createDetails(modifier, body => {
    body.appendChild(
      createSliderControl('Trail Length', modifier.trailLength, {
        min: 80,
        max: 4000,
        step: 20,
        format: v => `${Math.round(v)} samples`,
        onInput: v => (modifier.trailLength = v),
      }),
    )

    body.appendChild(
      createColorControl('Left Return Color', modifier.leftColor, value => {
        modifier.leftColor = value
      }),
    )

    body.appendChild(
      createColorControl('Right Return Color', modifier.rightColor, value => {
        modifier.rightColor = value
      }),
    )

    body.appendChild(
      createColorControl('Neutral Color', modifier.neutralColor, value => {
        modifier.neutralColor = value
      }),
    )
  })
