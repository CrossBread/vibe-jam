import type { GravityWellModifier } from '../../devtools'
import type { ModifierBuilder } from '../shared'
import { createGravityWellModifier } from './gravityWell'

export const createDivotsModifier: ModifierBuilder<GravityWellModifier> = context =>
  createGravityWellModifier(context)
