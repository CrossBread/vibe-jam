import type { ArenaModifiers, GravityWellKey } from '../../devtools'
import type { ModifierBuilder } from '../shared'
import { createBlackHoleModifier } from './blackHole/blackHoleEditor'
import { createBlackMoleModifier } from './blackMole/blackMoleEditor'
import { createDivotsModifier } from './divots/divotsEditor'
import { createFogOfWarModifier } from './fogOfWar/fogOfWarEditor'
import { createGopherModifier } from './gopher/gopherEditor'
import { createWonderlandModifier } from './wonderland/wonderlandEditor'
import { createIrelandModifier } from './ireland/irelandEditor'
import { createRussianRouletteModifier } from './russianRoulette/russianRouletteEditor'
import { createSuperMassiveModifier } from './superMassive/superMassiveEditor'
import { createWhiteDwarfModifier } from './whiteDwarf/whiteDwarfEditor'

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
  fogOfWar: createFogOfWarModifier,
  wonderland: createWonderlandModifier,
  ireland: createIrelandModifier,
  russianRoulette: createRussianRouletteModifier,
}
