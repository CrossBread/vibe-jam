/*
 * Copyright (c) 2025. CrossBread Tech All rights reserved.
 */

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
  angry: createAngryModifier,
  apparition: createApparitionModifier,
  bendy: createBendyModifier,
  brokePhysics: createBrokePhysicsModifier,
  buckTooth: createBuckToothModifier,
  bungee: createBungeeModifier,
  charlotte: createCharlotteModifier,
  chilly: createChillyModifier,
  crabby: createCrabbyModifier,
  dizzy: createDizzyModifier,
  dundee: createDundeeModifier,
  foosball: createFoosballModifier,
  frisbee: createFrisbeeModifier,
  hadron: createHadronModifier,
  inchworm: createInchwormModifier,
  missileCommander: createMissileCommanderModifier,
  outOfBody: createOutOfBodyModifier,
  osteoWhat: createOsteoWhatModifier,
  slinky: createSlinkyModifier,
}
