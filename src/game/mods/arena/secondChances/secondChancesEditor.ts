import type { SecondChancesModifier } from '../../../devtools'
import type { ModifierBuilder } from '../../shared'
import { createColorControl, createSliderControl } from '../../shared'

export const createSecondChancesModifier: ModifierBuilder<SecondChancesModifier> = ({
  modifier,
  createDetails,
}) =>
  createDetails(modifier, body => {
    const currentHits = Number(modifier.maxHits)

    body.appendChild(
      createSliderControl('Hits Per Shield', Number.isFinite(currentHits) ? currentHits : 2, {
        min: 1,
        max: 6,
        step: 1,
        format: value => `${Math.round(value)} hits`,
        onInput: value => {
          modifier.maxHits = Math.round(value)
        },
      }),
    )

    body.appendChild(
      createColorControl('Left Shield Color', modifier.positiveTint, value => {
        modifier.positiveTint = value
      }),
    )

    body.appendChild(
      createColorControl('Right Shield Color', modifier.negativeTint, value => {
        modifier.negativeTint = value
      }),
    )
  })
