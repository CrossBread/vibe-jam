import type { SearchLightModifier } from '../../../devtools'
import type { ModifierBuilder } from '../../shared'
import { createColorControl, createSliderControl } from '../../shared'
import {
  getSearchLightBallBrightness,
  getSearchLightBeamColor,
  getSearchLightConeLength,
  getSearchLightConeWidth,
} from './searchLightModifier'

export const createSearchLightModifier: ModifierBuilder<SearchLightModifier> = ({
  modifier,
  createDetails,
}) =>
  createDetails(modifier, body => {
    body.appendChild(
      createColorControl('Beam Color', getSearchLightBeamColor(modifier), value => {
        modifier.beamColor = value
      }),
    )

    body.appendChild(
      createSliderControl('Ball Brightness', getSearchLightBallBrightness(modifier), {
        min: 0,
        max: 2,
        step: 0.05,
        format: value => `${value.toFixed(2)}×`,
        onInput: value => {
          modifier.ballBrightness = value
        },
      }),
    )

    body.appendChild(
      createSliderControl('Cone Length', getSearchLightConeLength(modifier), {
        min: 60,
        max: 480,
        step: 5,
        format: value => `${Math.round(value)} px`,
        onInput: value => {
          modifier.coneLength = value
        },
      }),
    )

    body.appendChild(
      createSliderControl('Cone Width', getSearchLightConeWidth(modifier), {
        min: 60,
        max: 480,
        step: 5,
        format: value => `${Math.round(value)} px`,
        onInput: value => {
          modifier.coneWidth = value
        },
      }),
    )
  })
