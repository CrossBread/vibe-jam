import type { GravityWellModifier } from '../../devtools'
import type { ModifierBuilder } from '../shared'
import { createGravityWellModifier } from './gravityWell'

export const createSuperMassiveModifier: ModifierBuilder<GravityWellModifier> = context =>
  createGravityWellModifier(context)
