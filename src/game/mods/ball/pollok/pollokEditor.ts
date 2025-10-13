import type { PollokModifier } from '../../../devtools'
import type { ModifierBuilder } from '../../shared'
import { createColorControl, createSliderControl } from '../../shared'

export const createPollokModifier: ModifierBuilder<PollokModifier> = ({
  modifier,
  createDetails,
}) =>
  createDetails(modifier, body => {
    body.appendChild(
      createSliderControl('Trail Length', modifier.trailLength, {
        min: 80,
        max: 6000,
        step: 1,
        format: v => `${Math.round(v)} samples`,
        onInput: v => (modifier.trailLength = v),
      }),
    )

    body.appendChild(
      createColorControl('Left Return Color', modifier.leftColor, color => {
        modifier.leftColor = color
      }),
    )

    body.appendChild(
      createColorControl('Right Return Color', modifier.rightColor, color => {
        modifier.rightColor = color
      }),
    )

    body.appendChild(
      createColorControl('Neutral Color', modifier.neutralColor, color => {
        modifier.neutralColor = color
      }),
    )
  })
