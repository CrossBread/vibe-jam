import type { GravityWellModifier } from '../../devtools'
import type { ModifierBuilder } from '../shared'
import { createGravityWellModifier } from './gravityWell'

export const createWhiteDwarfModifier: ModifierBuilder<GravityWellModifier> = context =>
  createGravityWellModifier(context)
