import type { PaddleModifierKey, PaddleModifiers } from '../../devtools'
import type { ModifierBuilder } from '../shared'
import { createAngryModifier } from './angry/angryEditor'
import { createApparitionModifier } from './apparition/apparitionEditor'
import { createBendyModifier } from './bendy/bendyEditor'
import { createBrokePhysicsModifier } from './brokePhysics/brokePhysicsEditor'
import { createBuckToothModifier } from './buckTooth/buckToothEditor'
import { createBungeeModifier } from './bungee/bungeeEditor'
import { createChillyModifier } from './chilly/chillyEditor'
import { createCharlotteModifier } from './charlotte/charlotteEditor'
import { createDizzyModifier } from './dizzy/dizzyEditor'
import { createDundeeModifier } from './dundee/dundeeEditor'
import { createFoosballModifier } from './foosball/foosballEditor'
import { createFrisbeeModifier } from './frisbee/frisbeeEditor'
import { createHadronModifier } from './hadron/hadronEditor'
import { createInchwormModifier } from './inchworm/inchwormEditor'
import { createMissileCommanderModifier } from './missileCommander/missileCommanderEditor'
import { createOutOfBodyModifier } from './outOfBody/outOfBodyEditor'
import { createOsteoWhatModifier } from './osteoWhat/osteoWhatEditor'
import { createSlinkyModifier } from './slinky/slinkyEditor'
import { createCrabbyModifier } from './crabby/crabbyEditor'
type PaddleBuilderMap = {
  [K in PaddleModifierKey]: ModifierBuilder<PaddleModifiers[K]>
}

export const paddleModifierBuilders: PaddleBuilderMap = {
  apparition: createApparitionModifier,
  outOfBody: createOutOfBodyModifier,
  bendy: createBendyModifier,
  chilly: createChillyModifier,
  crabby: createCrabbyModifier,
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
  charlotte: createCharlotteModifier,
}
