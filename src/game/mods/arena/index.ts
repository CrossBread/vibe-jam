import type { ArenaModifiers, GravityWellKey } from '../../devtools'
import type { ModifierBuilder } from '../shared'
import { createBlackHoleModifier } from './blackHole'
import { createBlackMoleModifier } from './blackMole'
import { createDivotsModifier } from './divots'
import { createGopherModifier } from './gopher'
import { createIrelandModifier } from './ireland'
import { createSuperMassiveModifier } from './superMassive'
import { createWhiteDwarfModifier } from './whiteDwarf'

type ArenaBuilderMap = {
  [K in GravityWellKey]: ModifierBuilder<ArenaModifiers[K]>
}

export const arenaModifierBuilders: ArenaBuilderMap = {
  blackHole: createBlackHoleModifier,
  blackMole: createBlackMoleModifier,
  gopher: createGopherModifier,
  superMassive: createSuperMassiveModifier,
  whiteDwarf: createWhiteDwarfModifier,
  divots: createDivotsModifier,
  ireland: createIrelandModifier,
}
