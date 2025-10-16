import type { GravityWellModifier } from '../../../devtools'
import type { ManagedMod } from '../../modManager'
import type { ActiveGravityWell, ArenaDimensions } from '../shared'
import {
  clearIrelandWells,
  createIrelandState,
  ensureIrelandWells,
  markIrelandNeedsRegeneration,
  regenerateIrelandWells,
  type IrelandState,
} from './irelandModifier'
import { getIrelandWells } from './irelandView'

type IrelandModifierConfig = GravityWellModifier

interface IrelandModParams {
  getModifier(): IrelandModifierConfig
  getArenaDimensions(): ArenaDimensions
}

export interface IrelandMod extends ManagedMod {
  markNeedsRegeneration(): void
  rebuildWells(): void
  clearWells(): void
  getActiveWells(): ActiveGravityWell[]
}

export function createIrelandMod(params: IrelandModParams): IrelandMod {
  const state: IrelandState = createIrelandState()

  const getModifier = () => params.getModifier()
  const getDimensions = () => params.getArenaDimensions()

  const clearState = () => {
    clearIrelandWells(state)
  }

  const rebuildState = () => {
    regenerateIrelandWells(state, getModifier(), getDimensions())
  }

  return {
    key: 'ireland',
    isEnabled: () => Boolean(getModifier().enabled),
    onEnabled() {
      rebuildState()
    },
    onTick() {
      ensureIrelandWells(state, getModifier(), getDimensions())
    },
    onDisabled() {
      clearState()
    },
    onReset() {
      clearState()
    },
    markNeedsRegeneration() {
      markIrelandNeedsRegeneration(state)
    },
    rebuildWells() {
      rebuildState()
    },
    clearWells() {
      clearState()
    },
    getActiveWells() {
      return getIrelandWells(state, getModifier(), getDimensions())
    },
  }
}
