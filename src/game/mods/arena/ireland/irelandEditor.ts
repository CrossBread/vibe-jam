import type { GravityWellModifier } from '../../../devtools'
import type { ModifierBuilder } from '../../shared'
import { createGravityWellModifier } from '../gravityWell/gravityWellEditor'

export const createIrelandModifier: ModifierBuilder<GravityWellModifier> = context =>
  createGravityWellModifier(context)
