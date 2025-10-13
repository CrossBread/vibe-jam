import type { PaddleModifierKey, PaddleModifiers } from '../../devtools'
import type { ModifierBuilder } from '../shared'
import { createAngryModifier } from './angry'
import { createApparitionModifier } from './apparition'
import { createBendyModifier } from './bendy'
import { createBrokePhysicsModifier } from './brokePhysics'
import { createBuckToothModifier } from './buckTooth'
import { createBungeeModifier } from './bungee'
import { createChillyModifier } from './chilly'
import { createDizzyModifier } from './dizzy'
import { createDundeeModifier } from './dundee'
import { createFoosballModifier } from './foosball'
import { createFrisbeeModifier } from './frisbee'
import { createHadronModifier } from './hadron'
import { createInchwormModifier } from './inchworm'
import { createMissileCommanderModifier } from './missileCommander'
import { createOutOfBodyModifier } from './outOfBody'
import { createOsteoWhatModifier } from './osteoWhat'
import { createSlinkyModifier } from './slinky'
type PaddleBuilderMap = {
  [K in PaddleModifierKey]: ModifierBuilder<PaddleModifiers[K]>
}

export const paddleModifierBuilders: PaddleBuilderMap = {
  apparition: createApparitionModifier,
  outOfBody: createOutOfBodyModifier,
  bendy: createBendyModifier,
  chilly: createChillyModifier,
  buckTooth: createBuckToothModifier,
  osteoWhat: createOsteoWhatModifier,
  brokePhysics: createBrokePhysicsModifier,
  hadron: createHadronModifier,
  foosball: createFoosballModifier,
  dizzy: createDizzyModifier,
  bungee: createBungeeModifier,
  angry: createAngryModifier,
  inchworm: createInchwormModifier,
  slinky: createSlinkyModifier,
  missileCommander: createMissileCommanderModifier,
  frisbee: createFrisbeeModifier,
  dundee: createDundeeModifier,
}
