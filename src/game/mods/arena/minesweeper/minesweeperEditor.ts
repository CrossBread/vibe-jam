import type { MinesweeperModifier } from '../../../devtools'
import type { ModifierBuilder } from '../../shared'
import { createColorControl, createSliderControl } from '../../shared'

export const createMinesweeperModifier: ModifierBuilder<MinesweeperModifier> = ({
  modifier,
  createDetails,
}) =>
  createDetails(modifier, body => {
    const currentSpacing = Number(modifier.gridSpacing)
    const currentSize = Number(modifier.squareSize)
    const currentRows = Number(modifier.rows)
    const currentColumns = Number(modifier.columns)

    body.appendChild(
      createSliderControl('Rows', Number.isFinite(currentRows) ? currentRows : 5, {
        min: 1,
        max: 9,
        step: 1,
        format: value => `${Math.round(value)} rows`,
        onInput: value => {
          modifier.rows = Math.round(value)
        },
      }),
    )

    body.appendChild(
      createSliderControl('Columns', Number.isFinite(currentColumns) ? currentColumns : 6, {
        min: 1,
        max: 12,
        step: 1,
        format: value => `${Math.round(value)} columns`,
        onInput: value => {
          modifier.columns = Math.round(value)
        },
      }),
    )

    body.appendChild(
      createSliderControl('Grid Spacing', Number.isFinite(currentSpacing) ? currentSpacing : 68, {
        min: 12,
        max: 200,
        step: 1,
        format: value => `${Math.round(value)} px`,
        onInput: value => {
          modifier.gridSpacing = value
        },
      }),
    )

    body.appendChild(
      createSliderControl('Square Size', Number.isFinite(currentSize) ? currentSize : 34, {
        min: 8,
        max: 160,
        step: 1,
        format: value => `${Math.round(value)} px`,
        onInput: value => {
          modifier.squareSize = value
        },
      }),
    )

    body.appendChild(
      createColorControl('Default Square Color', modifier.positiveTint, value => {
        modifier.positiveTint = value
      }),
    )

    body.appendChild(
      createColorControl('Mine Color', modifier.negativeTint, value => {
        modifier.negativeTint = value
      }),
    )
  })
