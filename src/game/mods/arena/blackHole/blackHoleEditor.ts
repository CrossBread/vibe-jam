import type { GravityWellModifier } from '../../../devtools'
import type { ModifierBuilder } from '../../shared'
import { createGravityWellModifier } from '../gravityWell/gravityWellEditor'

export const createBlackHoleModifier: ModifierBuilder<GravityWellModifier> = context =>
  createGravityWellModifier(context)
