import type { ArenaModifiers, GravityWellKey } from '../../devtools'
import type { ModifierBuilder } from '../shared'
import { createBlackHoleModifier } from './blackHole/blackHoleEditor'
import { createBlackMoleModifier } from './blackMole/blackMoleEditor'
import { createDivotsModifier } from './divots/divotsEditor'
import { createFogOfWarModifier } from './fogOfWar/fogOfWarEditor'
import { createGopherModifier } from './gopher/gopherEditor'
import { createCeresModifier } from './ceres/ceresEditor'
import { createDrinkMeModifier } from './drinkMe/drinkMeEditor'
import { createTeaPartyModifier } from './teaParty/teaPartyEditor'
import { createWonderlandModifier } from './wonderland/wonderlandEditor'
import { createIrelandModifier } from './ireland/irelandEditor'
import { createRussianRouletteModifier } from './russianRoulette/russianRouletteEditor'
import { createSecondChancesModifier } from './secondChances/secondChancesEditor'
import { createSpaceInvadersModifier } from './spaceInvaders/spaceInvadersEditor'
import { createMinesweeperModifier } from './minesweeper/minesweeperEditor'
import { createSuperMassiveModifier } from './superMassive/superMassiveEditor'
import { createWhiteDwarfModifier } from './whiteDwarf/whiteDwarfEditor'
import { createJupiterModifier } from './jupiter/jupiterEditor'
import { createMadHatterModifier } from './madHatter/madHatterEditor'
import { createWormholeModifier } from './wormhole/wormholeEditor'
import { createVortexModifier } from './vortex/vortexEditor'

type ArenaBuilderMap = {
  [K in GravityWellKey]: ModifierBuilder<ArenaModifiers[K]>
}

export const arenaModifierBuilders: ArenaBuilderMap = {
  blackHole: createBlackHoleModifier,
  blackMole: createBlackMoleModifier,
  gopher: createGopherModifier,
  ceres: createCeresModifier,
  superMassive: createSuperMassiveModifier,
  jupiter: createJupiterModifier,
  whiteDwarf: createWhiteDwarfModifier,
  divots: createDivotsModifier,
  fogOfWar: createFogOfWarModifier,
  wonderland: createWonderlandModifier,
  secondChances: createSecondChancesModifier,
  spaceInvaders: createSpaceInvadersModifier,
  minesweeper: createMinesweeperModifier,
  ireland: createIrelandModifier,
  russianRoulette: createRussianRouletteModifier,
  drinkMe: createDrinkMeModifier,
  teaParty: createTeaPartyModifier,
  madHatter: createMadHatterModifier,
  wormhole: createWormholeModifier,
  vortex: createVortexModifier,
}
