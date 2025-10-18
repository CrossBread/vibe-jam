/*
 * Copyright (c) 2025. CrossBread Tech All rights reserved.
 */

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
import { createThreeBodyProblemModifier } from './threeBodyProblem/threeBodyProblemEditor'
import { createMadHatterModifier } from './madHatter/madHatterEditor'
import { createWormholeModifier } from './wormhole/wormholeEditor'
import { createVortexModifier } from './vortex/vortexEditor'
import { createSearchLightModifier } from './searchLight/searchLightEditor'

type ArenaBuilderMap = {
  [K in GravityWellKey]: ModifierBuilder<ArenaModifiers[K]>
}

export const arenaModifierBuilders: ArenaBuilderMap = {
  blackHole: createBlackHoleModifier,
  blackMole: createBlackMoleModifier,
  ceres: createCeresModifier,
  divots: createDivotsModifier,
  drinkMe: createDrinkMeModifier,
  fogOfWar: createFogOfWarModifier,
  gopher: createGopherModifier,
  ireland: createIrelandModifier,
  jupiter: createJupiterModifier,
  madHatter: createMadHatterModifier,
  minesweeper: createMinesweeperModifier,
  russianRoulette: createRussianRouletteModifier,
  searchLight: createSearchLightModifier,
  secondChances: createSecondChancesModifier,
  spaceInvaders: createSpaceInvadersModifier,
  superMassive: createSuperMassiveModifier,
  teaParty: createTeaPartyModifier,
  threeBodyProblem: createThreeBodyProblemModifier,
  vortex: createVortexModifier,
  whiteDwarf: createWhiteDwarfModifier,
  wonderland: createWonderlandModifier,
  wormhole: createWormholeModifier,
}
